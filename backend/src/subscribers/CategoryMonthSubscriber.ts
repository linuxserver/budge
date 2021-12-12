import { Budget } from "../entities/Budget";
import { EntityManager, EntitySubscriberInterface, EventSubscriber, getManager, InsertEvent, Repository, UpdateEvent } from "typeorm";
import { formatMonthFromDateString, getDateFromString, getMonthString, getMonthStringFromNow } from "../utils";
import { BudgetMonth } from "../entities/BudgetMonth";
import { CategoryGroup, CreditCardGroupName } from "../entities/CategoryGroup";
import { Category } from "../entities/Category";
import { Payee } from "../entities/Payee";
import { Account, AccountTypes } from "../entities/Account";
import { add, equal, isNegative, isPositive, subtract } from "dinero.js";
import { CategoryMonth, CategoryMonthOriginalValues } from "../entities/CategoryMonth";
import { CategoryMonths } from "../repositories/CategoryMonths";

let originalValues: CategoryMonthOriginalValues

@EventSubscriber()
export class CategoryMonthSubscriber implements EntitySubscriberInterface<CategoryMonth> {
  listenTo() {
      return CategoryMonth;
  }

  storeTransientValues(entity: CategoryMonth) {
    originalValues = entity.original
    delete entity.original
  }

  restoreTransientValues(entity: CategoryMonth) {
    entity.original = originalValues
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

    this.storeTransientValues(event.entity)
  }

  async beforeUpdate(event: UpdateEvent<CategoryMonth>) {
    this.storeTransientValues(event.entity as CategoryMonth)
  }

  async afterInsert(event: InsertEvent<CategoryMonth>) {
    this.restoreTransientValues(event.entity)

    await this.bookkeeping(event.entity as CategoryMonth, event.manager)
  }

  async afterUpdate(event: UpdateEvent<CategoryMonth>) {
    this.restoreTransientValues(event.entity as CategoryMonth)

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

    // Update budget month activity and and budgeted
    const budgetMonth = await manager.findOne(BudgetMonth, categoryMonth.budgetMonthId)
    const budget = await manager.findOne(Budget, budgetMonth.budgetId)

    budgetMonth.budgeted = add(budgetMonth.budgeted, subtract(categoryMonth.budgeted, categoryMonth.original.budgeted))
    budgetMonth.activity = add(budgetMonth.activity, subtract(categoryMonth.activity, categoryMonth.original.activity))
    budget.toBeBudgeted = add(budget.toBeBudgeted, subtract(categoryMonth.original.budgeted, categoryMonth.budgeted))

    if (category.inflow) {
      budgetMonth.income = add(budgetMonth.income, subtract(categoryMonth.activity, categoryMonth.original.activity))
      budget.toBeBudgeted = add(budget.toBeBudgeted, subtract(categoryMonth.activity, categoryMonth.original.activity))
    }

    // Underfunded only counts for non-CC accounts as a negative CC value could mean cash bach for that month
    if (!category.trackingAccountId) {
      if (isNegative(categoryMonth.original.balance)) {
        budgetMonth.underfunded = add(budgetMonth.underfunded, categoryMonth.original.balance)
      }
      if (isNegative(categoryMonth.balance)) {
        budgetMonth.underfunded = subtract(budgetMonth.underfunded, categoryMonth.balance)
      }
    }

    await manager.save(Budget, budget)
    await manager.save(BudgetMonth, budgetMonth)

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
    await manager.save(CategoryMonth, nextCategoryMonth)
  }
}
