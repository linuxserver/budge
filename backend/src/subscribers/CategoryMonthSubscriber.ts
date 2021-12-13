import { Budget } from "../entities/Budget";
import { EntityManager, EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "typeorm";
import { formatMonthFromDateString, getDateFromString } from "../utils";
import { BudgetMonth } from "../entities/BudgetMonth";
import { Category } from "../entities/Category";
import { add, isZero, isNegative, isPositive, subtract, equal } from "dinero.js";
import { CategoryMonth, CategoryMonthCache } from "../entities/CategoryMonth";
import { CategoryMonths } from "../repositories/CategoryMonths";

@EventSubscriber()
export class CategoryMonthSubscriber implements EntitySubscriberInterface<CategoryMonth> {
  listenTo() {
      return CategoryMonth;
  }

  /**
   * Get the previous month's 'balance' as this will be the 'carry over' amount for this new month
   */
  async beforeInsert(event: InsertEvent<CategoryMonth>) {
    const categoryMonth = event.entity
    const manager = event.manager

    const prevMonth = getDateFromString(categoryMonth.month)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevCategoryMonth = await manager.findOne(CategoryMonth, {
      categoryId: categoryMonth.categoryId,
      month: formatMonthFromDateString(prevMonth),
    })
    if (prevCategoryMonth && isPositive(prevCategoryMonth.balance)) {
      categoryMonth.balance = add(prevCategoryMonth.balance, add(categoryMonth.budgeted, categoryMonth.activity))
    }
  }

  async afterInsert(event: InsertEvent<CategoryMonth>) {
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

    budgetMonth.budgeted = add(budgetMonth.budgeted, subtract(categoryMonth.budgeted, originalCategoryMonth.budgeted))
    budgetMonth.activity = add(budgetMonth.activity, subtract(categoryMonth.activity, originalCategoryMonth.activity))

    const budgetedDifference = subtract(originalCategoryMonth.budgeted, categoryMonth.budgeted)
    const activityDifference = subtract(categoryMonth.activity, originalCategoryMonth.activity)
    if (!isZero(budgetedDifference) || !isZero(activityDifference)) {
      const budget = await manager.findOne(Budget, budgetMonth.budgetId)
      budget.toBeBudgeted = add(budget.toBeBudgeted, budgetedDifference)

      if (category.inflow) {
        budget.toBeBudgeted = add(budget.toBeBudgeted, activityDifference)
      }

      await manager.update(Budget, budget.id, budget.getUpdatePayload())
    }

    if (category.inflow) {
      budgetMonth.income = add(budgetMonth.income, subtract(categoryMonth.activity, originalCategoryMonth.activity))
    }

    // Underfunded only counts for non-CC accounts as a negative CC value could mean cash bach for that month
    if (!category.trackingAccountId) {
      if (isNegative(originalCategoryMonth.balance)) {
        budgetMonth.underfunded = add(budgetMonth.underfunded, originalCategoryMonth.balance)
      }
      if (isNegative(categoryMonth.balance)) {
        budgetMonth.underfunded = subtract(budgetMonth.underfunded, categoryMonth.balance)
      }
    }

    await manager.update(BudgetMonth, budgetMonth.id, budgetMonth.getUpdatePayload())

    const nextMonth = getDateFromString(categoryMonth.month)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const nextBudgetMonth = await manager.findOne(BudgetMonth, {
      budgetId: category.budgetId,
      month: formatMonthFromDateString(nextMonth),
    })

    if (!nextBudgetMonth) {
      return
    }

    const nextCategoryMonth = await manager.getCustomRepository(CategoryMonths).findOrCreate(
      nextBudgetMonth.budgetId,
      categoryMonth.categoryId,
      nextBudgetMonth.month,
    )

    if (isPositive(categoryMonth.balance) || category.trackingAccountId) {
      nextCategoryMonth.balance = add(categoryMonth.balance, add(nextCategoryMonth.budgeted, nextCategoryMonth.activity))
    } else {
      // If the next month's balance already matched it's activity, no need to keep cascading
      const calculatedNextMonth = add(nextCategoryMonth.budgeted, nextCategoryMonth.activity)
      if (equal(nextCategoryMonth.balance, calculatedNextMonth)) {
        return
      }

      nextCategoryMonth.balance = calculatedNextMonth
    }

    // await CategoryMonth.update(nextCategoryMonth.id, { balance: nextCategoryMonth.balance })
    await manager.update(CategoryMonth, nextCategoryMonth.id, nextCategoryMonth.getUpdatePayload())
  }
}
