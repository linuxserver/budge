import {
  EntityManager,
  EntitySubscriberInterface,
  EventSubscriber,
  getRepository,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm'
import { formatMonthFromDateString } from '../utils'
import { Category } from '../entities/Category'
import { Payee } from '../entities/Payee'
import { Account, AccountTypes } from '../entities/Account'
import { add, equal, isZero, multiply, subtract } from 'dinero.js'
import { CategoryMonth } from '../entities/CategoryMonth'
import { Transaction, TransactionCache, TransactionStatus } from '../entities/Transaction'
import { CategoryMonths } from '../repositories/CategoryMonths'

@EventSubscriber()
export class TransactionSubscriber implements EntitySubscriberInterface<Transaction> {
  listenTo() {
    return Transaction
  }

  async beforeInsert(event: InsertEvent<Transaction>) {
    await Promise.all([
      this.checkCreateTransferTransaction(event.entity as Transaction, event.manager),
      this.createCategoryMonth(event.entity as Transaction, event.manager),
    ])
  }

  async beforeUpdate(event: UpdateEvent<Transaction>) {
    await Promise.all([
      this.createCategoryMonth(event.entity as Transaction, event.manager),
      this.updateTransferTransaction(event.entity as Transaction, event.manager),

      this.updateAccountBalanceOnUpdate(event.entity as Transaction, event.manager),
      this.bookkeepingOnUpdate(event.entity as Transaction, event.manager),
    ])
  }

  async afterInsert(event: InsertEvent<Transaction>) {
    await Promise.all([
      this.updateAccountBalanceOnAdd(event.entity as Transaction, event.manager),
      this.bookkeepingOnAdd(event.entity as Transaction, event.manager),
      this.createTransferTransaction(event.entity as Transaction, event.manager),
    ])
  }

  async beforeRemove(event: RemoveEvent<Transaction>) {
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
    await Promise.all([
      this.updateAccountBalanceOnRemove(event.entity as Transaction, event.manager),
      this.bookkeepingOnDelete(event.entity as Transaction, event.manager),
    ])
  }

  async checkCreateTransferTransaction(transaction: Transaction, manager: EntityManager) {
    // This is only called on INSERT. If the id is null AND the transferAccountId is null,
    // then this is the 'origin' transfer transaction
    if (transaction.transferAccountId) {
      return
    }

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
      await manager
        .getCustomRepository(CategoryMonths)
        .findOrCreate(transaction.budgetId, transaction.categoryId, formatMonthFromDateString(transaction.date))
    }

    const account = await manager.getRepository(Account).findOne(transaction.accountId)

    // Create category month for CC tracking category
    if (account.type === AccountTypes.CreditCard) {
      // First, ensure category month exists
      const trackingCategory = await manager.findOne(Category, { trackingAccountId: account.id })
      await manager
        .getCustomRepository(CategoryMonths)
        .findOrCreate(transaction.budgetId, trackingCategory.id, Transaction.getMonth(transaction.date))
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
        const ccCategoryMonth = await manager
          .getCustomRepository(CategoryMonths)
          .findOrCreate(transaction.budgetId, ccCategory.id, Transaction.getMonth(transaction.date))
        ccCategoryMonth.update({ activity: multiply(transaction.amount, -1) })
        await manager.getRepository(CategoryMonth).update(ccCategoryMonth.id, ccCategoryMonth.getUpdatePayload())
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
      const transactionCategoryMonth = await manager
        .getRepository(CategoryMonth)
        .findOne({ categoryId: transaction.categoryId, month: Transaction.getMonth(transaction.date) })
      transactionCategoryMonth.update({ activity: transaction.amount })
      await manager
        .getRepository(CategoryMonth)
        .update(transactionCategoryMonth.id, transactionCategoryMonth.getUpdatePayload())
    }

    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
      const ccCategoryMonth = await manager
        .getCustomRepository(CategoryMonths)
        .findOrCreate(transaction.budgetId, ccCategory.id, Transaction.getMonth(transaction.date))
      ccCategoryMonth.update({ activity: multiply(transaction.amount, -1) })
      await manager.getRepository(CategoryMonth).update(ccCategoryMonth.id, ccCategoryMonth.getUpdatePayload())
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

    await manager.insert(Transaction, transferTransaction)

    const transferAccount = await manager.getRepository(Account).findOne(transferTransaction.accountId)

    transaction.payeeId = transferAccount.transferPayeeId
    transaction.transferAccountId = transferAccount.id
    transaction.transferTransactionId = transferTransaction.id

    // Perform save here so that the listener hooks don't get called
    await manager.getRepository(Transaction).save(transaction, { listeners: false })
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

    await manager.update(Account, account.id, account.getUpdatePayload())
  }

  private async updateAccountBalanceOnUpdate(transaction: Transaction, manager: EntityManager) {
    const originalTransaction = TransactionCache.get(transaction.id)
    if (transaction.amount === originalTransaction.amount && transaction.status === originalTransaction.status) {
      // amount and status hasn't changed, no balance update necessary
      return
    }

    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await manager.findOne(Account, transaction.accountId)

    switch (originalTransaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = subtract(account.uncleared, originalTransaction.amount)
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = subtract(account.cleared, originalTransaction.amount)
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

    await manager.update(Account, account.id, account.getUpdatePayload())
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

    await manager.update(Account, account.id, account.getUpdatePayload())
  }

  private async updateTransferTransaction(transaction: Transaction, manager: EntityManager) {
    if (!TransactionCache.transfersEnabled(transaction.id)) {
      return
    }
    TransactionCache.disableTransfers(transaction.id)

    const originalTransaction = TransactionCache.get(transaction.id)

    // If the payees, dates, and amounts haven't changed, bail
    if (
      transaction.payeeId === originalTransaction.payeeId &&
      transaction.amount === originalTransaction.amount &&
      formatMonthFromDateString(transaction.date) === formatMonthFromDateString(originalTransaction.date)
    ) {
      return
    }

    if (transaction.payeeId === originalTransaction.payeeId && transaction.transferTransactionId) {
      if (equal(transaction.amount, originalTransaction.amount) && transaction.date === originalTransaction.date) {
        // amount and dates are the same, everything else is not linked
        return
      }

      // Payees are the same, just update details
      const transferTransaction = await manager.findOne(Transaction, { transferTransactionId: transaction.id })
      transferTransaction.update({
        amount: multiply(transaction.amount, -1),
        date: transaction.date,
      })
      await manager.getRepository(Transaction).update(transferTransaction.id, transferTransaction.getUpdatePayload())
      return
    }

    if (transaction.payeeId !== originalTransaction.payeeId) {
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
        await manager.update(Transaction, transferTransaction.id, transferTransaction.getUpdatePayload())
        transaction.transferTransactionId = transferTransaction.id
      }
    }
  }

  private async bookkeepingOnUpdate(transaction: Transaction, manager: EntityManager) {
    const account = await manager.getRepository(Account).findOne(transaction.accountId)

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    const originalTransaction = TransactionCache.get(transaction.id)

    // @TODO: hanle update of transactions when going to / from a transfer to / from a non-transfer

    let activity = subtract(transaction.amount, originalTransaction.amount)

    if (transaction.transferTransactionId !== null) {
      // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        if (transaction.date !== originalTransaction.date && isZero(activity)) {
          // No change in time or amount, so category month data doesn't change
          return
        }

        const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
        const originalCCMonth = await manager.findOne(CategoryMonth, {
          categoryId: ccCategory.id,
          month: formatMonthFromDateString(originalTransaction.date),
        })
        await originalCCMonth.update({ activity: originalTransaction.amount })

        const currentCCMonth = await manager
          .getCustomRepository(CategoryMonths)
          .findOrCreate(transaction.budgetId, ccCategory.id, Transaction.getMonth(transaction.date))
        currentCCMonth.update({ activity: multiply(transaction.amount, -1) })
        await manager.getRepository(CategoryMonth).update(currentCCMonth.id, currentCCMonth.getUpdatePayload())
      }

      return
    }

    if (
      originalTransaction.categoryId !== transaction.categoryId ||
      formatMonthFromDateString(originalTransaction.date) !== formatMonthFromDateString(transaction.date)
    ) {
      const category = await manager.getRepository(Category).findOne(transaction.categoryId)
      const originalCategory = await manager.findOne(Category, originalTransaction.categoryId)

      // Cat or month has changed so the activity is the entirety of the transaction
      activity = transaction.amount

      // Revert original category, if set
      if (originalTransaction.categoryId) {
        if ((originalCategory && originalCategory.inflow === false) || account.type !== AccountTypes.CreditCard) {
          // Category or month has changed, so reset 'original' amount
          const originalCategoryMonth = await manager.getRepository(CategoryMonth).findOne(
            {
              categoryId: originalTransaction.categoryId,
              month: formatMonthFromDateString(originalTransaction.date),
            },
            { relations: ['budgetMonth'] },
          )

          originalCategoryMonth.update({ activity: multiply(originalTransaction.amount, -1) })
          await manager
            .getRepository(CategoryMonth)
            .update(originalCategoryMonth.id, originalCategoryMonth.getUpdatePayload())
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
              month: formatMonthFromDateString(originalTransaction.date),
            })
            originalCCMonth.update({ activity: originalTransaction.amount })
            await manager.getRepository(CategoryMonth).update(originalCCMonth.id, originalCCMonth.getUpdatePayload())
          }
        }
      }

      // Apply to new category
      if (transaction.categoryId) {
        if (category.inflow === false || account.type !== AccountTypes.CreditCard) {
          const transactionCategoryMonth = await manager
            .getRepository(CategoryMonth)
            .findOne({ categoryId: transaction.categoryId, month: Transaction.getMonth(transaction.date) })
          transactionCategoryMonth.update({ activity })
          await manager
            .getRepository(CategoryMonth)
            .update(transactionCategoryMonth.id, transactionCategoryMonth.getUpdatePayload())
        }

        if (account.type === AccountTypes.CreditCard) {
          const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })

          /**
           * Don't update CC months for original or current CC category month
           * if this is inflow.
           */

          if (category && category.inflow === false) {
            const currentCCMonth = await manager
              .getCustomRepository(CategoryMonths)
              .findOrCreate(transaction.budgetId, ccCategory.id, Transaction.getMonth(transaction.date))
            currentCCMonth.update({ activity: multiply(transaction.amount, -1) })
            await manager.getRepository(CategoryMonth).update(currentCCMonth.id, currentCCMonth.getUpdatePayload())
          }
        }
      }
    } else {
      if (isZero(activity)) {
        return
      }

      if (!transaction.categoryId) {
        return
      }

      const category = await manager.getRepository(Category).findOne(transaction.categoryId)
      if (category.inflow === true && account.type === AccountTypes.CreditCard) {
        return
      }

      const categoryMonth = await manager
        .getRepository(CategoryMonth)
        .findOne({ categoryId: category.id, month: Transaction.getMonth(transaction.date) })
      categoryMonth.update({ activity })
      await manager.getRepository(CategoryMonth).update(categoryMonth.id, categoryMonth.getUpdatePayload())

      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
        const currentCCMonth = await manager
          .getCustomRepository(CategoryMonths)
          .findOrCreate(transaction.budgetId, ccCategory.id, Transaction.getMonth(transaction.date))
        currentCCMonth.update({ activity: multiply(transaction.amount, -1) })
        await manager.getRepository(CategoryMonth).update(currentCCMonth.id, currentCCMonth.getUpdatePayload())
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
        const ccCategoryMonth = await manager.findOne(CategoryMonth, {
          categoryId: ccCategory.id,
          month: Transaction.getMonth(transaction.date),
        })
        ccCategoryMonth.update({ activity: transaction.amount })
        await manager.getRepository(CategoryMonth).update(ccCategoryMonth.id, ccCategoryMonth.getUpdatePayload())
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
      const originalCategoryMonth = await manager.findOne(
        CategoryMonth,
        { categoryId: transaction.categoryId, month: formatMonthFromDateString(transaction.date) },
        { relations: ['budgetMonth'] },
      )
      originalCategoryMonth.update({ activity: multiply(transaction.amount, -1) })
      await manager
        .getRepository(CategoryMonth)
        .update(originalCategoryMonth.id, originalCategoryMonth.getUpdatePayload())
    }

    // Check if we need to update a CC category
    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await manager.findOne(Category, { trackingAccountId: account.id })
      const ccCategoryMonth = await manager.findOne(CategoryMonth, {
        categoryId: ccCategory.id,
        month: Transaction.getMonth(transaction.date),
      })
      ccCategoryMonth.update({ activity: transaction.amount })
      await manager.getRepository(CategoryMonth).update(ccCategoryMonth.id, ccCategoryMonth.getUpdatePayload())
    }
  }
}
