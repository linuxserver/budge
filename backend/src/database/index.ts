import { prisma } from './prisma'
import AccountMiddleware from './middleware/Account'
import BudgetMiddleware from './middleware/Budget'
import BudgetMonthMiddleware from './middleware/BudgetMonth'
import CategoryMiddleware from './middleware/Category'
import CategoryMonthMiddleware from './middleware/CategoryMonth'
import TransactionMiddleware from './middleware/Transaction'
import { BroadcasterResult } from 'typeorm/subscriber/BroadcasterResult'

export default prisma

prisma.$use(async (params: any, next: any) => {
  if (params.model === 'Account') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)
      await Promise.all([
        AccountMiddleware.createAccountPayee(params.args.data),
        AccountMiddleware.createCreditCardCategory(params.args.data),
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

      BudgetMiddleware.afterInsert(params.args.data)

      return result
    }
  }

  if (params.model === 'BudgetMonth') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)

      await BudgetMonthMiddleware.afterInsert(params.args.data)

      return result
    }
  }

  if (params.model === 'Category') {
    if (params.action.match(/insert/i)) {
      const result = await next(params)
      console.log(result)

      await CategoryMiddleware.afterInsert(params.args.data)

      return result
    }
  }

  if (params.model === 'CategoryMonth') {
    if (params.action.match(/insert/i)) {
      await CategoryMonthMiddleware.beforeInsert(params.args.data)
      const result = await next(params)

      if (params.args.data.balance !== 0) {
        await CategoryMonthMiddleware.bookkeeping(params.args.data)
      }

      return result
    }

    if (params.action.match(/update/i)) {
      const result = await next(params)
      await CategoryMonthMiddleware.bookkeeping(params.args.data)
      return result
    }
  }

  if (params.model === 'Transaction') {
    if (params.action.match(/insert/i)) {
      await Promise.all([
        TransactionMiddleware.checkCreateTransferTransaction(params.args.data),
        TransactionMiddleware.createCategoryMonth(params.args.data),
      ])

      const result = await next(params)

      await Promise.all([
        TransactionMiddleware.updateAccountBalanceOnAdd(params.args.data),
        TransactionMiddleware.bookkeepingOnAdd(params.args.data),
        TransactionMiddleware.createTransferTransaction(params.args.data),
      ])

      return result
    }

    if (params.action.match(/update/i)) {
      await Promise.all([
        TransactionMiddleware.createCategoryMonth(params.args.data),
        TransactionMiddleware.updateTransferTransaction(params.args.data),
        TransactionMiddleware.updateAccountBalanceOnUpdate(params.args.data),
        TransactionMiddleware.bookkeepingOnUpdate(params.args.data),
      ])

      return await next(params)
    }

    if (params.action.match(/delete/i)) {
      await TransactionMiddleware.beforeDelete(params.args.data)

      const result = await next(params)

      await Promise.all([
        TransactionMiddleware.updateAccountBalanceOnRemove(params.args.data),
        TransactionMiddleware.bookkeepingOnDelete(params.args.data),
      ])

      return BroadcasterResult
    }
  }
})
