import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm'
import { formatMonthFromDateString, getDateFromString } from '../utils'
import { BudgetMonth, BudgetMonthCache } from '../entities/BudgetMonth'
import { Category } from '../entities/Category'
import { CategoryMonth } from '../entities/CategoryMonth'

@EventSubscriber()
export class BudgetMonthSubscriber implements EntitySubscriberInterface<BudgetMonth> {
  listenTo() {
    return BudgetMonth
  }

  async beforeInsert({ entity: budgetMonth, manager }: InsertEvent<BudgetMonth>) {
    const prevMonth = getDateFromString(budgetMonth.month).minus({ month: 1 })

    const prevBudgetMonth = await manager.findOne(BudgetMonth, {
      budgetId: budgetMonth.budgetId,
      month: formatMonthFromDateString(prevMonth.toJSDate()),
    })

    if (!prevBudgetMonth) {
      return
    }

    budgetMonth.available = prevBudgetMonth.available
  }

  async afterUpdate({ entity: budgetMonth, manager }: UpdateEvent<BudgetMonth>) {
    const nextMonth = getDateFromString(budgetMonth.month).plus({ month: 1 })
    const nextBudgetMonth = await manager.findOne(BudgetMonth, {
      budgetId: budgetMonth.budgetId,
      month: formatMonthFromDateString(nextMonth.toJSDate()),
    })

    if (!nextBudgetMonth) {
      return
    }

    const originalBudgetMonth = BudgetMonthCache.get(budgetMonth.id)

    if (
      budgetMonth.income === originalBudgetMonth.income &&
      budgetMonth.budgeted === originalBudgetMonth.budgeted &&
      budgetMonth.underfunded === originalBudgetMonth.underfunded &&
      budgetMonth.available === originalBudgetMonth.available
    ) {
      return
    }

    // The carryover for next month needs to include the available cash
    // but also account for underfunded categories.
    const availableDiff =
      originalBudgetMonth.available -
      budgetMonth.available -
      (originalBudgetMonth.underfunded - budgetMonth.underfunded)

    nextBudgetMonth.available -= availableDiff

    await manager.getRepository(BudgetMonth).update(nextBudgetMonth.id, nextBudgetMonth.getUpdatePayload())
  }

  async afterInsert({ entity: budgetMonth, manager }: InsertEvent<BudgetMonth>) {
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
