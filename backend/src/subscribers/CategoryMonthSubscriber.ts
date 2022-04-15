import { Budget } from '../entities/Budget'
import { EntityManager, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm'
import { formatMonthFromDateString, getDateFromString } from '../utils'
import { BudgetMonth } from '../entities/BudgetMonth'
import { Category } from '../entities/Category'
import { CategoryMonth, CategoryMonthCache } from '../entities/CategoryMonth'
import { CategoryMonths } from '../repositories/CategoryMonths'

@EventSubscriber()
export class CategoryMonthSubscriber implements EntitySubscriberInterface<CategoryMonth> {
  listenTo() {
    return CategoryMonth
  }

  /**
   * Get the previous month's 'balance' as this will be the 'carry over' amount for this new month
   */
  async beforeInsert(event: InsertEvent<CategoryMonth>) {
    const categoryMonth = event.entity
    const manager = event.manager

    const prevMonth = getDateFromString(categoryMonth.month).minus({ month: 1 })
    const prevCategoryMonth = await manager.findOne(CategoryMonth, {
      categoryId: categoryMonth.categoryId,
      month: formatMonthFromDateString(prevMonth.toJSDate()),
    })

    const category = await event.manager.findOne(Category, {
      id: event.entity.categoryId,
    })

    if (prevCategoryMonth && (category.trackingAccountId || prevCategoryMonth.balance > 0)) {
      categoryMonth.balance = prevCategoryMonth.balance + categoryMonth.budgeted + categoryMonth.activity
    }
  }

  async afterInsert(event: InsertEvent<CategoryMonth>) {
    if (event.entity.balance === 0) {
      return
    }

    await this.bookkeeping(event.entity as CategoryMonth, event.manager)
  }

  async afterUpdate(event: UpdateEvent<CategoryMonth>) {
    await this.bookkeeping(event.entity as CategoryMonth, event.manager)
  }

  /**
   * == RECURSIVE ==
   *
   * Cascade the new assigned and activity amounts up into the parent budget month for new totals.
   * Also, cascade the new balance of this month into the next month to update the carry-over amount.
   */
  private async bookkeeping(categoryMonth: CategoryMonth, manager: EntityManager) {
    const category = await manager.findOne(Category, categoryMonth.categoryId)
    const originalCategoryMonth = CategoryMonthCache.get(categoryMonth.id)

    // Update budget month activity and and budgeted
    const budgetMonth = await manager.findOne(BudgetMonth, categoryMonth.budgetMonthId)

    budgetMonth.budgeted = budgetMonth.budgeted + (categoryMonth.budgeted - originalCategoryMonth.budgeted)

    if (category.inflow === false && category.trackingAccountId === null) {
      // Don't update budget month activity for CC transactions. These are 'inverse' transactions of other
      // category transactions, so this would 'negate' them.
      budgetMonth.activity = budgetMonth.activity + (categoryMonth.activity - originalCategoryMonth.activity)
    }

    const budgetedDifference = originalCategoryMonth.budgeted - categoryMonth.budgeted
    const activityDifference = categoryMonth.activity - originalCategoryMonth.activity
    if (budgetedDifference !== 0 || activityDifference !== 0) {
      const budget = await manager.findOne(Budget, budgetMonth.budgetId)
      budgetMonth.available += budgetedDifference

      if (category.inflow) {
        budgetMonth.available += activityDifference
      }

      await manager.update(Budget, budget.id, budget.getUpdatePayload())
    }

    if (category.inflow) {
      budgetMonth.income = budgetMonth.income + (categoryMonth.activity - originalCategoryMonth.activity)
    }

    // Underfunded only counts for non-CC accounts as a negative CC value could mean cash bach for that month
    if (!category.trackingAccountId) {
      if (originalCategoryMonth.balance < 0) {
        budgetMonth.underfunded = budgetMonth.underfunded + originalCategoryMonth.balance
      }
      if (categoryMonth.balance < 0) {
        budgetMonth.underfunded = budgetMonth.underfunded - categoryMonth.balance
      }
    }

    await manager.update(BudgetMonth, budgetMonth.id, budgetMonth.getUpdatePayload())

    const nextMonth = getDateFromString(categoryMonth.month).plus({ month: 1 })

    const nextBudgetMonth = await manager.findOne(BudgetMonth, {
      budgetId: category.budgetId,
      month: formatMonthFromDateString(nextMonth.toJSDate()),
    })

    if (!nextBudgetMonth) {
      return
    }

    const nextCategoryMonth = await manager
      .getCustomRepository(CategoryMonths)
      .findOrCreate(nextBudgetMonth.budgetId, categoryMonth.categoryId, nextBudgetMonth.month)

    if (categoryMonth.balance > 0 || category.trackingAccountId) {
      nextCategoryMonth.balance = categoryMonth.balance + nextCategoryMonth.budgeted + nextCategoryMonth.activity
    } else {
      // If the next month's balance already matched it's activity, no need to keep cascading
      const calculatedNextMonth = nextCategoryMonth.budgeted + nextCategoryMonth.activity
      if (nextCategoryMonth.balance === calculatedNextMonth) {
        return
      }

      nextCategoryMonth.balance = calculatedNextMonth
    }

    // await CategoryMonth.update(nextCategoryMonth.id, { balance: nextCategoryMonth.balance })
    await manager.update(CategoryMonth, nextCategoryMonth.id, nextCategoryMonth.getUpdatePayload())
  }
}
