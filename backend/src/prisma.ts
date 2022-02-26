import { PrismaClient } from '@prisma/client'
import AccountMiddleware from './database/middleware/Account'
import BudgetMiddleware from './database/middleware/Budget'
import BudgetMonthMiddleware from './database/middleware/BudgetMonth'
import CategoryMiddleware from './database/middleware/Category'
import CategoryMonthMiddleware from './database/middleware/CategoryMonth'
import TransactionMiddleware from './database/middleware/Transaction'

export const prisma = new PrismaClient({log: ['query', 'info', 'warn', 'error'],})

prisma.$use(async (params: any, next: any) => {
  if (params.model === 'Account') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)
      await Promise.all([
        AccountMiddleware.createAccountPayee(params.args.data, prisma),
        AccountMiddleware.createCreditCardCategory(params.args.data, prisma),
      ])

      return result
    }

    if (params.action.match(/update/i)) {
      params.args.data.balance = params.args.data.cleared + params.args.data.uncleared
      return next(params)
    }
  }

  if (params.model === 'Budget') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)

      BudgetMiddleware.afterInsert(params.args.data, prisma)

      return result
    }
  }

  if (params.model === 'BudgetMonth') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)

      await BudgetMonthMiddleware.afterInsert(params.args.data, prisma)

      return result
    }
  }

  if (params.model === 'Category') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)
      console.log(result)

      await CategoryMiddleware.afterInsert(params.args.data, prisma)

      return result
    }
  }

  if (params.model === 'CategoryMonth') {
    if (params.action.match(/insert/i)) {
      await CategoryMonthMiddleware.beforeInsert(params.args.data, prisma)
      const result = await next(params)

      if (params.args.data.balance !== 0) {
        await CategoryMonthMiddleware.bookkeeping(params.args.data, prisma)
      }

      return result
    }

    if (params.action.match(/update/i)) {
      const result = await next(params)
      await CategoryMonthMiddleware.bookkeeping(params.args.data, prisma)
      return result
    }
  }

  if (params.model === 'Transaction') {
    if (params.action.match(/insert/i)) {
      await Promise.all([
        TransactionMiddleware.checkCreateTransferTransaction(params.args.data, prisma),
        TransactionMiddleware.createCategoryMonth(params.args.data, prisma),
      ])

      const result = await next(params)

      await Promise.all([
        TransactionMiddleware.updateAccountBalanceOnAdd(params.args.data, prisma),
        TransactionMiddleware.bookkeepingOnAdd(params.args.data, prisma),
        TransactionMiddleware.createTransferTransaction(params.args.data, prisma),
      ])

      return result
    }

    if (params.action.match(/update/i)) {
      await Promise.all([
        TransactionMiddleware.createCategoryMonth(params.args.data, prisma),
        TransactionMiddleware.updateTransferTransaction(params.args.data, prisma),
        TransactionMiddleware.updateAccountBalanceOnUpdate(params.args.data, prisma),
        TransactionMiddleware.bookkeepingOnUpdate(params.args.data, prisma),
      ])

      return await next(params)
    }

    if (params.action.match(/delete/i)) {
      await TransactionMiddleware.beforeDelete(params.args.data, prisma)

      const result = await next(params)

      await Promise.all([
        TransactionMiddleware.updateAccountBalanceOnRemove(params.args.data, prisma),
        TransactionMiddleware.bookkeepingOnDelete(params.args.data, prisma),
      ])

      return result
    }
  }
})
