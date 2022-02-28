import { formatMonthFromDateString } from '../../utils'
import { CategoryMonths } from '../../entities/CategoryMonth'
import { AccountTypes } from '../../entities/Account'
import { TransactionStatus, TransactionCache } from '../../entities/Transaction'
import { PrismaClient } from '@prisma/client'

export default class TransactionMiddleware {
  public static async afterDelete(transaction: any, prisma: PrismaClient) {
    if (transaction.transferTransactionId === null) {
      return
    }

    const transferTransaction = await prisma.transaction.findFirst({
      where: { transferTransactionId: transaction.id },
    })

    if (transferTransaction) {
      transferTransaction.transferTransactionId = null
      await prisma.transaction.delete({ where: { id: transferTransaction.id } })
    }
  }

  public static async afterLoad(transaction: any) {
    TransactionCache.set(transaction)
  }

  public static async checkCreateTransferTransaction(transaction: any, prisma: PrismaClient) {
    // This is only called on INSERT. If the id is null AND the transferAccountId is null,
    // then this is the 'origin' transfer transaction
    if (transaction.transferAccountId) {
      return
    }

    const payee = await prisma.payee.findUnique({ where: { id: transaction.payeeId } })
    if (payee.transferAccountId === null) {
      // No transfer needed
      return
    }

    // Set a dummy transfer transaction ID since we don't have one yet... hacky, but works
    transaction.transferTransactionId = '0'
  }

  public static async createCategoryMonth(transaction: any, prisma: PrismaClient) {
    if (transaction.categoryId) {
      // First, ensure category month exists
      await CategoryMonths.findOrCreate(
        transaction.budgetId,
        transaction.categoryId,
        formatMonthFromDateString(transaction.date),
      )
    }

    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    // Create category month for CC tracking category
    if (account.type === AccountTypes.CreditCard) {
      // First, ensure category month exists
      const trackingCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
      await CategoryMonths.findOrCreate(
        transaction.budgetId,
        trackingCategory.id,
        formatMonthFromDateString(transaction.date),
      )
    }
  }

  public static async updateTransferTransaction(transaction: any, prisma: PrismaClient) {
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
      if (transaction.amount === originalTransaction.amount && transaction.date === originalTransaction.date) {
        // amount and dates are the same, everything else is not linked
        return
      }

      // Payees are the same, just update details
      const transferTransaction = await prisma.transaction.findFirst({
        where: { transferTransactionId: transaction.id },
      })

      transferTransaction.amount = transaction.amount * -1
      transferTransaction.date = transaction.date

      await prisma.transaction.update({
        where: { id: transferTransaction.id },
        data: {
          amount: transferTransaction.amount,
          date: transferTransaction.date,
        },
      })
      return
    }

    if (transaction.payeeId !== originalTransaction.payeeId) {
      // If the payee has changed, delete the transfer transaction before proceeding
      if (transaction.transferTransactionId) {
        const transferTransaction = await prisma.transaction.findFirst({
          where: { transferTransactionId: transaction.id },
        })
        await prisma.transaction.delete({ where: { id: transferTransaction.id } })
      }

      transaction.transferTransactionId = null

      // Now create a new transfer transaction if necessary
      const payee = await prisma.payee.findUnique({ where: { id: transaction.payeeId } })
      if (payee.transferAccountId !== null) {
        const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })
        const transferAccount = await prisma.account.findUnique({ where: { id: payee.transferAccountId } })

        const transferTransaction = await prisma.transaction.create({
          data: {
            amount: transaction.amount * -1,
            date: transaction.date,
            status: TransactionStatus.Pending,
            budget: { connect: { id: transaction.budgetId } },
            account: { connect: { id: transferAccount.id } },
            payee: { connect: { id: account.transferPayeeId } },
            transferAccountId: account.id,
            transferTransactionId: transaction.id,
          },
        })

        // await prisma.transaction.update({ where: { id: transferTransaction.id }, data: transferTransaction })
        transaction.transferTransactionId = transferTransaction.id
      }
    }
  }

  public static async updateAccountBalanceOnUpdate(transaction: any, prisma: PrismaClient) {
    const originalTransaction = TransactionCache.get(transaction.id)
    if (transaction.amount === originalTransaction.amount && transaction.status === originalTransaction.status) {
      // amount and status hasn't changed, no balance update necessary
      return
    }

    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    switch (originalTransaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = account.uncleared - originalTransaction.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = account.cleared - originalTransaction.amount
        break
    }

    switch (transaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = account.uncleared + transaction.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = account.cleared + transaction.amount
        break
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        cleared: account.cleared,
        uncleared: account.uncleared,
      },
    })
  }

  public static async bookkeepingOnUpdate(transaction: any, prisma: PrismaClient) {
    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    const originalTransaction = TransactionCache.get(transaction.id)

    // @TODO: hanle update of transactions when going to / from a transfer to / from a non-transfer

    let activity = transaction.amount - originalTransaction.amount

    if (transaction.transferTransactionId !== null) {
      // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        if (transaction.date !== originalTransaction.date && activity === 0) {
          // No change in time or amount, so category month data doesn't change
          return
        }

        const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
        const originalCCMonth = await prisma.categoryMonth.findFirst({
          where: {
            categoryId: ccCategory.id,
            month: formatMonthFromDateString(originalTransaction.date),
          },
        })
        await CategoryMonths.updateActivity(originalCCMonth, { activity: originalTransaction.amount })

        const currentCCMonth = await CategoryMonths.findOrCreate(
          transaction.budgetId,
          ccCategory.id,
          formatMonthFromDateString(transaction.date),
        )
        await CategoryMonths.updateActivity(currentCCMonth, { activity: transaction.amount * -1 })
      }

      return
    }

    if (
      originalTransaction.categoryId !== transaction.categoryId ||
      formatMonthFromDateString(originalTransaction.date) !== formatMonthFromDateString(transaction.date)
    ) {
      const category = await prisma.category.findUnique({ where: { id: transaction.categoryId } })
      const originalCategory = await prisma.category.findUnique({ where: { id: originalTransaction.categoryId } })

      // Cat or month has changed so the activity is the entirety of the transaction
      activity = transaction.amount

      // Revert original category, if set
      if (originalTransaction.categoryId) {
        if ((originalCategory && originalCategory.inflow === false) || account.type !== AccountTypes.CreditCard) {
          // Category or month has changed, so reset 'original' amount
          const originalCategoryMonth = await prisma.categoryMonth.findFirst({
            where: {
              categoryId: originalTransaction.categoryId,
              month: formatMonthFromDateString(originalTransaction.date),
            },
            include: { budgetMonth: true },
          })

          await CategoryMonths.updateActivity(originalCategoryMonth, { activity: originalTransaction.amount * -1 })
        }

        if (account.type === AccountTypes.CreditCard) {
          const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })

          /**
           * Don't update CC months for original or current CC category month
           * if this is inflow.
           */

          if (originalCategory.inflow === false) {
            const originalCCMonth = await prisma.categoryMonth.findFirst({
              where: {
                categoryId: ccCategory.id,
                month: formatMonthFromDateString(originalTransaction.date),
              },
            })
            await CategoryMonths.updateActivity(originalCCMonth, { activity: originalTransaction.amount })
          }
        }
      }

      // Apply to new category
      if (transaction.categoryId) {
        if (category.inflow === false || account.type !== AccountTypes.CreditCard) {
          const transactionCategoryMonth = await prisma.categoryMonth.findFirst({
            where: { categoryId: transaction.categoryId, month: formatMonthFromDateString(transaction.date) },
          })
          await CategoryMonths.updateActivity(transactionCategoryMonth, { activity })
        }

        if (account.type === AccountTypes.CreditCard) {
          const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })

          /**
           * Don't update CC months for original or current CC category month
           * if this is inflow.
           */

          if (category && category.inflow === false) {
            const currentCCMonth = await CategoryMonths.findOrCreate(
              transaction.budgetId,
              ccCategory.id,
              formatMonthFromDateString(transaction.date),
            )
            await CategoryMonths.updateActivity(currentCCMonth, { activity: transaction.amount * -1 })
          }
        }
      }
    } else {
      if (activity === 0) {
        return
      }

      if (!transaction.categoryId) {
        return
      }

      const category = await prisma.category.findUnique(transaction.categoryId)
      if (category.inflow === true && account.type === AccountTypes.CreditCard) {
        return
      }

      const categoryMonth = await prisma.categoryMonth.findFirst({
        where: { categoryId: category.id, month: formatMonthFromDateString(transaction.date) },
      })
      await CategoryMonths.updateActivity(categoryMonth, { activity })

      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
        const currentCCMonth = await CategoryMonths.findOrCreate(
          transaction.budgetId,
          ccCategory.id,
          formatMonthFromDateString(transaction.date),
        )
        await CategoryMonths.updateActivity(currentCCMonth, { activity: activity * -1 })
      }
    }
  }

  public static async updateAccountBalanceOnAdd(transaction: any, prisma: PrismaClient) {
    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    switch (transaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = account.uncleared + transaction.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = account.cleared + transaction.amount
        break
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        cleared: account.cleared,
        uncleared: account.uncleared,
      },
    })
  }

  public static async bookkeepingOnAdd(transaction: any, prisma: PrismaClient) {
    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    const payee = await prisma.payee.findUnique({ where: { id: transaction.payeeId } })
    const transferAccount = payee.transferAccountId
      ? await prisma.account.findUnique({ where: { id: payee.transferAccountId } })
      : null

    // If this is a transfer to a budget account, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!
    if (transaction.transferTransactionId !== null && transferAccount.type !== AccountTypes.Tracking) {
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
        const ccCategoryMonth = await CategoryMonths.findOrCreate(
          transaction.budgetId,
          ccCategory.id,
          formatMonthFromDateString(transaction.date),
        )
        await CategoryMonths.updateActivity(ccCategoryMonth, { activity: transaction.amount * -1 })
      }
      return
    }

    if (!transaction.categoryId) {
      return
    }

    const category = await prisma.category.findUnique({ where: { id: transaction.categoryId } })

    // If this is inflow and a CC, bail out - don't update budget or category months as the
    // 'inflow' will be accounted for in the difference of the payment you allocate.
    if (category.inflow === true && account.type === AccountTypes.CreditCard) {
      return
    }

    if (category.inflow === false || account.type !== AccountTypes.CreditCard) {
      // Cascade category month
      const transactionCategoryMonth = await prisma.categoryMonth.findFirst({
        where: { categoryId: transaction.categoryId, month: formatMonthFromDateString(transaction.date) },
      })
      await CategoryMonths.updateActivity(transactionCategoryMonth, { activity: transaction.amount })
    }

    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
      const currentCCMonth = await CategoryMonths.findOrCreate(
        transaction.budgetId,
        ccCategory.id,
        formatMonthFromDateString(transaction.date),
      )
      await CategoryMonths.updateActivity(currentCCMonth, { activity: transaction.amount * -1 })
    }
  }

  public static async createTransferTransaction(transaction: any, prisma: PrismaClient) {
    if (transaction.transferTransactionId !== '0') {
      return
    }

    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })
    const payee = await prisma.payee.findUnique({ where: { id: transaction.payeeId } })

    const transferTransaction = await prisma.transaction.create({
      data: {
        amount: transaction.amount * -1,
        date: transaction.date,
        status: TransactionStatus.Pending,
        budget: { connect: { id: transaction.budgetId } },
        account: { connect: { id: payee.transferAccountId } },
        payee: { connect: { id: account.transferPayeeId } },
        transferAccountId: account.id,
        transferTransactionId: transaction.id,
      },
    })

    const transferAccount = await prisma.account.findUnique({ where: { id: transferTransaction.accountId } })

    // @TODO listener hooks shouldn't get called here??? How can I prevent that. A flag on the object?
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        payee: { connect: { id: transferAccount.transferPayeeId } },
        transferAccountId: transferAccount.id,
        transferTransactionId: transferTransaction.id,
      },
    })
  }

  public static async updateAccountBalanceOnRemove(transaction: any, prisma: PrismaClient) {
    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    switch (transaction.status) {
      case TransactionStatus.Pending:
        account.uncleared = account.uncleared - transaction.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared = account.cleared - transaction.amount
        break
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        cleared: account.cleared,
        uncleared: account.uncleared,
      },
    })
  }

  public static async bookkeepingOnDelete(transaction: any, prisma: PrismaClient) {
    const account = await prisma.account.findUnique({ where: { id: transaction.accountId } })

    // No bookkeeping necessary for tracking accounts
    if (account.type === AccountTypes.Tracking) {
      return
    }

    const payee = await prisma.payee.findUnique({ where: { id: transaction.payeeId } })
    const transferAccount = payee.transferAccountId
      ? await prisma.account.findUnique({ where: { id: payee.transferAccountId } })
      : null

    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
    if (transaction.transferTransactionId !== null && transferAccount.type !== AccountTypes.Tracking) {
      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
        const ccCategoryMonth = await prisma.categoryMonth.findFirst({
          where: {
            categoryId: ccCategory.id,
            month: formatMonthFromDateString(transaction.date),
          },
        })
        await CategoryMonths.updateActivity(ccCategoryMonth, { activity: transaction.amount })
      }

      return
    }

    // Even if there's no category ID, still need to update the CC category month because transfers
    // affect the balance.
    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await prisma.category.findFirst({ where: { trackingAccountId: account.id } })
      const ccCategoryMonth = await prisma.categoryMonth.findFirst({
        where: {
          categoryId: ccCategory.id,
          month: formatMonthFromDateString(transaction.date),
        },
      })
      await CategoryMonths.updateActivity(ccCategoryMonth, { activity: transaction.amount })
    }

    if (!transaction.categoryId) {
      return
    }

    const category = await prisma.category.findUnique({ where: { id: transaction.categoryId } })

    if (category.inflow === true && account.type === AccountTypes.CreditCard) {
      return
    }

    if (transaction.categoryId) {
      const originalCategoryMonth = await prisma.categoryMonth.findFirst({
        where: { categoryId: transaction.categoryId, month: formatMonthFromDateString(transaction.date) },
        include: { budgetMonth: true },
      })
      await CategoryMonths.updateActivity(originalCategoryMonth, { activity: transaction.amount * -1 })
    }
  }
}
