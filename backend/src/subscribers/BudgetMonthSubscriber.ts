import { Budget } from '../entities/Budget'
import {
  EntityManager,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  MoreThan,
  MoreThanOrEqual,
  Not,
  UpdateEvent,
} from 'typeorm'
import { formatMonthFromDateString, getDateFromString } from '../utils'
import { BudgetMonth } from '../entities/BudgetMonth'
import { Category } from '../entities/Category'
import { add, isZero, isNegative, isPositive, subtract, equal, dinero } from 'dinero.js'
import { CategoryMonth, CategoryMonthCache } from '../entities/CategoryMonth'
import { USD } from '@dinero.js/currencies'
import { CategoryMonths } from '../repositories/CategoryMonths'

@EventSubscriber()
export class BudgetMonthSubscriber implements EntitySubscriberInterface<BudgetMonth> {
  listenTo() {
    return BudgetMonth
  }

  async afterInsert(event: InsertEvent<BudgetMonth>) {
    // console.log('created new budget month')
    // const budgetMonth = event.entity
    // const manager = event.manager
    // const prevMonth = getDateFromString(budgetMonth.month)
    // prevMonth.setMonth(prevMonth.getMonth() - 1)
    // const prevBudgetMonth = await manager.findOne(BudgetMonth, {
    //   budgetId: budgetMonth.budgetId,
    //   month: formatMonthFromDateString(prevMonth),
    // })
    // if (!prevBudgetMonth) {
    //   return
    // }
    // // Find all categories with previous balances to update the new month with
    // const previousCategoryMonths = await manager.getRepository(CategoryMonth).find({
    //   budgetMonthId: prevBudgetMonth.id,
    // })
    // for (const previousCategoryMonth of previousCategoryMonths) {
    //   if (isZero(previousCategoryMonth.balance)) {
    //     continue
    //   }
    //   if (isPositive(previousCategoryMonth.balance)) {
    //     await manager.insert(CategoryMonth, {
    //       budgetMonthId: budgetMonth.id,
    //       month: budgetMonth.month,
    //       balance: previousCategoryMonth.balance,
    //     })
    //   }
    //   const category = await manager.findOne(Category, {
    //     id: previousCategoryMonth.categoryId,
    //   })
    //   if (isNegative(previousCategoryMonth.balance) && category.trackingAccountId) {
    //     await manager.insert(CategoryMonth, {
    //       budgetMonthId: budgetMonth.id,
    //       month: budgetMonth.month,
    //       balance: previousCategoryMonth.balance,
    //     })
    //   }
    // }
  }
}
