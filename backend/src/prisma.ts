import { PrismaClient } from '@prisma/client'
import AccountMiddleware from './database/middleware/Account'
import BudgetMiddleware from './database/middleware/Budget'
import BudgetMonthMiddleware from './database/middleware/BudgetMonth'
import CategoryMiddleware from './database/middleware/Category'
import CategoryMonthMiddleware from './database/middleware/CategoryMonth'
import TransactionMiddleware from './database/middleware/Transaction'
import { CategoryMonthCache } from './entities/CategoryMonth'
import { TransactionCache } from './entities/Transaction'

export const prisma = new PrismaClient()

prisma.$use(async (params: any, next: any) => {
  let result = null

  if (params.model === 'Account') {
    if (params.action.match(/create/i)) {
      result = await next(params)
      await AccountMiddleware.createAccountPayee(result, prisma)
      await AccountMiddleware.createCreditCardCategory(result, prisma)
    }

    if (params.action.match(/update/i)) {
      params.args.data.balance = params.args.data.cleared + params.args.data.uncleared
    }
  }

  if (params.model === 'Budget') {
    if (params.action.match(/create/i)) {
      result = await next(params)

      BudgetMiddleware.afterInsert(result, prisma)
    }
  }

  if (params.model === 'BudgetMonth') {
    if (params.action.match(/create/i)) {
      result = await next(params)

      await BudgetMonthMiddleware.afterInsert(result, prisma)
    }
  }

  if (params.model === 'Category') {
    if (params.action.match(/create/i)) {
      result = await next(params)

      await CategoryMiddleware.afterInsert(result, prisma)
    }
  }

  if (params.model === 'CategoryMonth') {
    if (params.action.match(/create/i)) {
      await CategoryMonthMiddleware.beforeInsert(params.args.data, prisma)
      result = await next(params)

      if (result.balance !== 0) {
        await CategoryMonthMiddleware.bookkeeping(result, prisma)
      }
    }

    if (params.action.match(/update/i)) {
      result = await next(params)
      await CategoryMonthMiddleware.bookkeeping(result, prisma)
    }
  }

  if (params.model === 'Transaction') {
    if (params.action.match(/create/i)) {
      await TransactionMiddleware.checkCreateTransferTransaction(params.args.data, prisma)
      await TransactionMiddleware.createCategoryMonth(params.args.data, prisma)

      result = await next(params)

      await TransactionMiddleware.updateAccountBalanceOnAdd(result, prisma)
      await TransactionMiddleware.bookkeepingOnAdd(result, prisma)
      await TransactionMiddleware.createTransferTransaction(result, prisma)
    }

    if (params.action.match(/update/i)) {
      await TransactionMiddleware.createCategoryMonth(params.args.data, prisma)
      await TransactionMiddleware.updateTransferTransaction(params.args.data, prisma)
      await TransactionMiddleware.updateAccountBalanceOnUpdate(params.args.data, prisma)
      await TransactionMiddleware.bookkeepingOnUpdate(params.args.data, prisma)
    }

    if (params.action.match(/delete/i)) {
      await TransactionMiddleware.beforeDelete(params.args.data, prisma)

      result = await next(params)

      await TransactionMiddleware.updateAccountBalanceOnRemove(result, prisma)
      await TransactionMiddleware.bookkeepingOnDelete(result, prisma)
    }
  }

  if (!result) {
    result = await next(params)
  }

  // After load
  if (params.action.match(/find/i)) {
    if (params.model === 'CategoryMonth' && result) {
      CategoryMonthCache.set(result)
    }

    if (params.model === 'Transaction' && result) {
      TransactionCache.set(result)
    }
  }

  return result
})