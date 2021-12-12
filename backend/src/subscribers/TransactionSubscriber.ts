import { Budget } from "../entities/Budget";
import { EntityManager, EntitySubscriberInterface, EventSubscriber, getManager, getRepository, InsertEvent, RemoveEvent, Repository, UpdateEvent } from "typeorm";
import { formatMonthFromDateString, getDateFromString, getMonthString, getMonthStringFromNow } from "../utils";
import { BudgetMonth } from "../entities/BudgetMonth";
import { CategoryGroup, CreditCardGroupName } from "../entities/CategoryGroup";
import { Category } from "../entities/Category";
import { Payee } from "../entities/Payee";
import { Account, AccountTypes } from "../entities/Account";
import { add, equal, isNegative, isPositive, multiply, subtract } from "dinero.js";
import { CategoryMonth } from "../entities/CategoryMonth";
import { Transaction, TransactionFlags, TransactionOriginalValues, TransactionStatus } from "../entities/Transaction";
import { CategoryMonths } from "../repositories/CategoryMonths";

@EventSubscriber()
export class TransactionSubscriber implements EntitySubscriberInterface<Transaction> {
  listenTo() {
    return Transaction;
  }

  async beforeInsert(event: InsertEvent<Transaction>) {
    if (event.entity.getEventsEnabled() === false) {
      return
    }

    await this.checkCreateTransferTransaction(event.entity as Transaction, event.manager)
    await this.createCategoryMonth(event.entity as Transaction, event.manager)
  }

  async beforeUpdate(event: UpdateEvent<Transaction>) {
    if (event.entity.getEventsEnabled() === false) {
      return
    }

    await this.createCategoryMonth(event.entity as Transaction, event.manager)
    await this.updateTransferTransaction(event.entity as Transaction, event.manager)
  }

  async afterInsert(event: InsertEvent<Transaction>) {
    if (event.entity.getEventsEnabled() === false) {
      return
    }

    await this.updateAccountBalanceOnAdd(event.entity as Transaction, event.manager)
    await this.bookkeepingOnAdd(event.entity as Transaction, event.manager)
    await this.createTransferTransaction(event.entity as Transaction, event.manager)
  }

  async afterUpdate(event: UpdateEvent<Transaction>) {
    if (event.entity.getEventsEnabled() === false) {
      return
    }

    await this.updateAccountBalanceOnUpdate(event.entity as Transaction, event.manager)
    await this.bookkeepingOnUpdate(event.entity as Transaction, event.manager)
  }

  async beforeRemove(event: RemoveEvent<Transaction>) {
    if (event.entity.getEventsEnabled() === false) {
      return
    }

    const transaction = event.entity
    const manager = event.manager

    if (transaction.transferTransactionId === null) {
      return
    }

    const transferTransaction = await manager.findOne(Transaction, { transferTransactionId: transaction.id })
    transferTransaction.transferTransactionId = null
    await manager.remove(Transaction, transferTransaction)
  }

  async afterRemove(event: RemoveEvent<Transaction>) {
    if (event.entity.getEventsEnabled() === false) {
      return
    }

    await this.updateAccountBalanceOnRemove(event.entity as Transaction, event.manager)
    await this.bookkeepingOnDelete(event.entity as Transaction, event.manager)
  }

  async checkCreateTransferTransaction(transaction: Transaction, manager: EntityManager) {
    if (transaction.getHandleTransfers() === false) {
      return
    }
    transaction.setHandleTransfers(false)

    const payee = await manager.findOne(Payee, transaction.payeeId)
    if (payee.transferAccountId === null) {
      // No transfer needed
      return
    }

    // Set a dummy transfer transaction ID since we don't have one yet... hacky, but works
    transaction.transferTransactionId = '0'
  }

  private async createCategoryMonth(transaction: Transaction, manager: EntityManager) {
    if (transaction.categoryId) {
      // First, ensure category month exists
      await manager.getCustomRepository(CategoryMonths).findOrCreate(
        transaction.budgetId,
        transaction.categoryId,
        formatMonthFromDateString(transaction.date),
      )
    }

    const account = await manager.getRepository(Account).findOne(transaction.accountId)

    // Create category month for CC tracking category
    if (account.type === AccountTypes.CreditCard) {
      // First, ensure category month exists
      const trackingCategory = await manager.findOne(Category, { trackingAccountId: account.id })
      await manager.getCustomRepository(CategoryMonths).findOrCreate(
        transaction.budgetId,
        trackingCategory.id,
        transaction.getMonth(),
      )
    }
  }

  private async bookkeepingOnAdd(transaction: Transaction, manager: EntityManager) {
    const account = await manager.findOne(Account, { id: transaction.accountId })

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    const payee = await manager.findOne(Payee, transaction.payeeId)
    const transferAccount = payee.transferAccountId ? await manager.findOne(Account, payee.transferAccountId) : null

    // If this is a transfer to a budget account, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!
    if (transaction.transferTransactionId !== null && transferAccount.type !== AccountTypes.Tracking) {
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
        const ccCategoryMonth = await manager.getCustomRepository(CategoryMonths).findOrCreate(transaction.budgetId, ccCategory.id, transaction.getMonth())
        ccCategoryMonth.update({ activity: multiply(transaction.amount, -1) })
        await manager.getCustomRepository(CategoryMonths).save(ccCategoryMonth)
      }
      return
    }

    if (!transaction.categoryId) {
      return
    }

    const category = await getRepository(Category).findOne(transaction.categoryId)

    // If this is inflow and a CC, bail out - don't update budget or category months as the
    // 'inflow' will be accounted for in the difference of the payment you allocate.
    if (category.inflow === true && account.type === AccountTypes.CreditCard) {
      return
    }

    if (category.inflow === false || account.type !== AccountTypes.CreditCard) {
      // Cascade category month
      const transactionCategoryMonth = await manager.getRepository(CategoryMonth).findOne({ categoryId: transaction.categoryId, month: transaction.getMonth() })
      transactionCategoryMonth.update({ activity: transaction.amount })
      await manager.getRepository(CategoryMonth).update(transactionCategoryMonth.id, transactionCategoryMonth)
    }

    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
      const ccCategoryMonth = await manager.getCustomRepository(CategoryMonths).findOrCreate(transaction.budgetId, ccCategory.id, transaction.getMonth())
      ccCategoryMonth.update({ activity: multiply(transaction.amount, -1) })
      await manager.getCustomRepository(CategoryMonths).save(ccCategoryMonth)
    }
  }

  private async createTransferTransaction(transaction: Transaction, manager: EntityManager) {
    if (transaction.transferTransactionId !== '0') {
      return
    }

    const account = await manager.getRepository(Account).findOne(transaction.accountId)
    const payee = await manager.getRepository(Payee).findOne(transaction.payeeId)

    const transferTransaction = manager.create(Transaction, {
      budgetId: transaction.budgetId,
      accountId: payee.transferAccountId,
      payeeId: account.transferPayeeId,
      transferAccountId: account.id,
      transferTransactionId: transaction.id,
      amount: multiply(transaction.amount, -1),
      date: transaction.date,
      status: TransactionStatus.Pending,
    })

    await manager.save(Transaction, transferTransaction)

    const transferAccount = await manager.getRepository(Account).findOne(transferTransaction.accountId)

    transaction.payeeId = transferAccount.transferPayeeId
    transaction.transferAccountId = transferAccount.id
    transaction.transferTransactionId = transferTransaction.id

    // Perform update here so that the listener hooks don't get called
    transaction.setEventsEnabled(false)
    await manager.getRepository(Transaction).save(transaction)
  }

  private async updateAccountBalanceOnAdd(transaction: Transaction, manager: EntityManager) {
    const account = await manager.getRepository(Account).findOne(transaction.accountId)

    switch (transaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = add(account.uncleared, transaction.amount)
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = add(account.cleared, transaction.amount)
        break
    }

    await manager.save(Account, account)
  }

  private async updateAccountBalanceOnUpdate(transaction: Transaction, manager: EntityManager) {
    const getRepository = manager.getRepository

    if (transaction.amount === transaction.original.amount && transaction.status === transaction.original.status) {
      // amount and status hasn't changed, no balance update necessary
      return
    }

    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await manager.findOne(Account, transaction.accountId)

    switch (transaction.original.status) {
      case TransactionStatus.Pending:
        account.uncleared = subtract(account.uncleared, transaction.original.amount)
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = subtract(account.cleared, transaction.original.amount)
        break
    }

    switch (transaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = add(account.uncleared, transaction.amount)
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = add(account.cleared, transaction.amount)
        break
    }

    await manager.save(Account, account)
  }

  private async updateAccountBalanceOnRemove(transaction: Transaction, manager: EntityManager) {
    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await manager.getRepository(Account).findOne(transaction.accountId)

    switch (transaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = subtract(account.uncleared, transaction.amount)
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = subtract(account.cleared, transaction.amount)
        break
    }

    await manager.save(Account, account)
  }

  private async updateTransferTransaction(transaction: Transaction, manager: EntityManager) {
    if (transaction.getHandleTransfers() === false) {
      return
    }
    transaction.setHandleTransfers(false)

    // If the payees, dates, and amounts haven't changed, bail
    if (
      transaction.payeeId === transaction.original.payeeId &&
      transaction.amount === transaction.original.amount &&
      formatMonthFromDateString(transaction.date) === formatMonthFromDateString(transaction.original.date)
    ) {
      return
    }

    if (transaction.payeeId === transaction.original.payeeId && transaction.transferTransactionId) {
      // Payees are the same, just update details
      const transferTransaction = await manager.findOne(Transaction, { transferTransactionId: transaction.id })
      transferTransaction.update({
        amount: multiply(transaction.amount, -1),
        date: transaction.date,
      })
      await manager.getRepository(Transaction).save(transferTransaction)
      return
    }

    if (transaction.payeeId !== transaction.original.payeeId) {
      // If the payee has changed, delete the transfer transaction before proceeding
      if (transaction.transferTransactionId) {
        const transferTransaction = await manager.findOne(Transaction, { transferTransactionId: transaction.id })
        await manager.remove(Transaction, transferTransaction)
      }

      transaction.transferTransactionId = null

      // Now create a new transfer transaction if necessary
      const payee = await manager.findOne(Payee, transaction.payeeId)
      if (payee.transferAccountId !== null) {
        const account = await manager.getRepository(Account).findOne(transaction.accountId)
        const transactionPayee = await manager.getRepository(Payee).findOne()
        const transferAccount = await manager.getRepository(Account).findOne(payee.transferAccountId)

        const transferTransaction = await manager.getRepository(Transaction).create({
          budgetId: transaction.budgetId,
          accountId: transferAccount.id,
          payeeId: account.transferPayeeId,
          transferAccountId: account.id,
          transferTransactionId: transaction.id,
          amount: multiply(transaction.amount, -1),
          date: transaction.date,
          status: TransactionStatus.Pending,
        })
        await manager.save(Transaction, transferTransaction)
        transaction.transferTransactionId = transferTransaction.id
      }
    }
  }

  private async bookkeepingOnUpdate(transaction: Transaction, manager: EntityManager) {
    const account = await transaction.account

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    // @TODO: hanle update of transactions when going to / from a transfer to / from a non-transfer

    if (transaction.transferTransactionId !== null) {
      // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
        const originalCCMonth = await manager.findOne(CategoryMonth, {
          categoryId: ccCategory.id,
          month: formatMonthFromDateString(transaction.original.date),
        })
        await originalCCMonth.update({ activity: transaction.original.amount })

        const currentCCMonth = await manager.getCustomRepository(CategoryMonths).findOrCreate(transaction.budgetId, ccCategory.id, transaction.getMonth())
        currentCCMonth.update({ activity: multiply(transaction.amount, -1) })
        await manager.getCustomRepository(CategoryMonths).save(currentCCMonth)
      }

      return
    }

    const category = await transaction.category
    const originalCategory = await manager.findOne(Category, transaction.original.categoryId)

    let activity = subtract(transaction.amount, transaction.original.amount)

    if (
      transaction.original.categoryId !== transaction.categoryId ||
      formatMonthFromDateString(transaction.original.date) !== formatMonthFromDateString(transaction.date)
    ) {
      // Cat or month has changed so the activity is the entirety of the transaction
      activity = transaction.amount

      // Revert original category, if set
      if (transaction.original.categoryId) {
        if (originalCategory && originalCategory.inflow === false || account.type !== AccountTypes.CreditCard) {
          // Category or month has changed, so reset 'original' amount
          const originalCategoryMonth = await manager.getRepository(CategoryMonth).findOne(
            { categoryId: transaction.original.categoryId, month: formatMonthFromDateString(transaction.original.date) },
            { relations: ['budgetMonth'] },
          )

          originalCategoryMonth.update({ activity: multiply(transaction.original.amount, -1) })
          await manager.getRepository(CategoryMonth).update(originalCategoryMonth.id, originalCategoryMonth)
        }

        if (account.type === AccountTypes.CreditCard) {
          const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })

          /**
           * Don't update CC months for original or current CC category month
           * if this is inflow.
           */

          if (originalCategory.inflow === false) {
            const originalCCMonth = await manager.findOne(CategoryMonth, {
              categoryId: ccCategory.id,
              month: formatMonthFromDateString(transaction.original.date),
            })
            originalCCMonth.update({ activity: transaction.original.amount })
            await manager.getRepository(CategoryMonth).update(originalCCMonth.id, originalCCMonth)
          }
        }
      }

      // Apply to new category
      if (transaction.categoryId) {
        if (category.inflow === false || account.type !== AccountTypes.CreditCard) {
          const transactionCategoryMonth = await manager.getRepository(CategoryMonth).findOne({ categoryId: transaction.categoryId, month: transaction.getMonth() })
          transactionCategoryMonth.update({ activity })
          await manager.getRepository(CategoryMonth).update(transactionCategoryMonth.id, transactionCategoryMonth)
        }

        if (account.type === AccountTypes.CreditCard) {
          const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })

          /**
           * Don't update CC months for original or current CC category month
           * if this is inflow.
           */

          if (category && category.inflow === false) {
            const currentCCMonth = await manager.getCustomRepository(CategoryMonths).findOrCreate(transaction.budgetId, ccCategory.id, transaction.getMonth())
            currentCCMonth.update({ activity: multiply(transaction.amount, -1) })
            await manager.getCustomRepository(CategoryMonths).save(currentCCMonth)
          }
        }
      }
    } else {
      if (!transaction.categoryId) {
        return
      }

      if (category.inflow === true && account.type === AccountTypes.CreditCard) {
        return
      }

      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
        const currentCCMonth = await manager.getCustomRepository(CategoryMonths).findOrCreate(transaction.budgetId, ccCategory.id, transaction.getMonth())
        currentCCMonth.update({ activity: multiply(transaction.amount, -1) })
        await manager.getCustomRepository(CategoryMonths).save(currentCCMonth)
      }
    }
  }

  private async bookkeepingOnDelete(transaction: Transaction, manager: EntityManager) {
    const account = await manager.getRepository(Account).findOne(transaction.accountId)

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    const payee = await manager.findOne(Payee, transaction.payeeId)
    const transferAccount = payee.transferAccountId ? await manager.findOne(Account, payee.transferAccountId) : null

    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
    if (transaction.transferTransactionId !== null && transferAccount.type !== AccountTypes.Tracking) {
      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
        const ccCategoryMonth = await manager.findOne(CategoryMonth, { categoryId: ccCategory.id, month: transaction.getMonth() })
        ccCategoryMonth.update({ activity: transaction.amount })
        await manager.getRepository(CategoryMonth).update(ccCategoryMonth.id, ccCategoryMonth)
      }

      return
    }

    if (!transaction.categoryId) {
      return
    }

    const category = await manager.findOne(Category, transaction.categoryId)

    if (category.inflow === true && account.type === AccountTypes.CreditCard) {
      return
    }

    if (transaction.categoryId) {
      const originalCategoryMonth = await manager.findOne(CategoryMonth,
        { categoryId: transaction.categoryId, month: formatMonthFromDateString(transaction.date) },
        { relations: ['budgetMonth'] },
      )
      originalCategoryMonth.update({ activity: multiply(transaction.amount, -1) })
      await manager.getRepository(CategoryMonth).update(originalCategoryMonth.id, originalCategoryMonth)
    }

    // Check if we need to update a CC category
    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
      const ccCategoryMonth = await manager.findOne(CategoryMonth, { categoryId: ccCategory.id, month: transaction.getMonth() })
      ccCategoryMonth.update({ activity: transaction.amount })
      await manager.getRepository(CategoryMonth).update(ccCategoryMonth.id, ccCategoryMonth)
    }
  }
}
