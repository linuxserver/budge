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
import { CategoryMonth, CategoryMonthCache } from '../entities/CategoryMonth'
import { CategoryMonths } from '../repositories/CategoryMonths'

@EventSubscriber()
export class BudgetMonthSubscriber implements EntitySubscriberInterface<BudgetMonth> {
  listenTo() {
    return BudgetMonth
  }

  async afterInsert(event: InsertEvent<BudgetMonth>) {
    const budgetMonth = event.entity
    const manager = event.manager
    const prevMonth = getDateFromString(budgetMonth.month).minus({ month: 1 })

    const prevBudgetMonth = await manager.findOne(BudgetMonth, {
      budgetId: budgetMonth.budgetId,
      month: formatMonthFromDateString(prevMonth.toJSDate()),
    })

    if (!prevBudgetMonth) {
      return
    }

    // Find all categories with previous balances to update the new month with
    const previousCategoryMonths = await manager.getRepository(CategoryMonth).find({
      budgetMonthId: prevBudgetMonth.id,
    })

    // Create a category month for each category in this new budget month
    for (const previousCategoryMonth of previousCategoryMonths) {
      let prevBalance = 0
      if (previousCategoryMonth.balance > 0) {
        prevBalance = previousCategoryMonth.balance
      } else {
        const category = await manager.findOne(Category, {
          id: previousCategoryMonth.categoryId,
        })

        if (previousCategoryMonth.balance < 0 && category.trackingAccountId) {
          prevBalance = previousCategoryMonth.balance
        }
      }

      await manager.insert(CategoryMonth, {
        budgetMonthId: budgetMonth.id,
        categoryId: previousCategoryMonth.categoryId,
        month: budgetMonth.month,
        balance: prevBalance,
        activity: 0,
        budgeted: 0,
      })
    }
  }
}
