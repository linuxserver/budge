import { CreditCardGroupName } from '../../entities/CategoryGroup'
import { AccountTypes } from '../../entities/Account'
import { prisma } from '../prisma'
import { getDateFromString, formatMonthFromDateString } from '../../utils'
import { CategoryMonthCache } from '../../entities/CategoryMonth'
import { CategoryMonth } from '../../entities/CategoryMonth'

export default class CategoryMonthMiddleware {
  /**
   * Get the previous month's 'balance' as this will be the 'carry over' amount for this new month
   */
  public static async beforeInsert(categoryMonth: any) {
    const prevMonth = getDateFromString(categoryMonth.month).minus({ month: 1 })
    const prevCategoryMonth = await prisma.categoryMonth.findFirst({
      where: {
        categoryId: categoryMonth.categoryId,
        month: formatMonthFromDateString(prevMonth.toJSDate()),
      },
    })

    const category = await prisma.category.findUnique({
      where: {
        id: categoryMonth.categoryId,
      },
    })

    if (prevCategoryMonth && (category.trackingAccountId || prevCategoryMonth.balance > 0)) {
      categoryMonth.balance = prevCategoryMonth.balance + categoryMonth.budgeted + categoryMonth.activity
    }
  }

  /**
   * == RECURSIVE ==
   *
   * Cascade the new assigned and activity amounts up into the parent budget month for new totals.
   * Also, cascade the new balance of this month into the next month to update the carry-over amount.
   */
  public static async bookkeeping(categoryMonth: any) {
    const category = await prisma.category.findUnique({ where: { id: categoryMonth.categoryId } })
    const originalCategoryMonth = CategoryMonthCache.get(categoryMonth.id)

    // Update budget month activity and and budgeted
    const budgetMonth = await prisma.budgetMonth.findUnique({ where: { id: categoryMonth.budgetMonthId } })

    budgetMonth.budgeted = budgetMonth.budgeted + (categoryMonth.budgeted - originalCategoryMonth.budgeted)

    if (category.inflow === false && category.trackingAccountId === null) {
      // Don't update budget month activity for CC transactions. These are 'inverse' transactions of other
      // category transactions, so this would 'negate' them.
      budgetMonth.activity = budgetMonth.activity + (categoryMonth.activity - originalCategoryMonth.activity)
    }

    const budgetedDifference = originalCategoryMonth.budgeted - categoryMonth.budgeted
    const activityDifference = categoryMonth.activity - originalCategoryMonth.activity
    if (budgetedDifference !== 0 || activityDifference !== 0) {
      const budget = await prisma.budget.findUnique({ where: { id: budgetMonth.budgetId } })
      budget.toBeBudgeted = budget.toBeBudgeted + budgetedDifference

      if (category.inflow) {
        budget.toBeBudgeted = budget.toBeBudgeted + activityDifference
      }

      await prisma.budget.update({ where: { id: budget.id }, data: budget })
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

    await prisma.budgetMonth.update({ where: { id: budgetMonth.id }, data: budgetMonth })

    const nextMonth = getDateFromString(categoryMonth.month).plus({ month: 1 })

    const nextBudgetMonth = await prisma.budgetMonth.findFirst({
      where: {
        budgetId: category.budgetId,
        month: formatMonthFromDateString(nextMonth.toJSDate()),
      },
    })

    if (!nextBudgetMonth) {
      return
    }

    const nextCategoryMonth = await CategoryMonth.findOrCreate(
      nextBudgetMonth.budgetId,
      categoryMonth.categoryId,
      nextBudgetMonth.month,
    )

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
    await prisma.categoryMonth.update({ where: { id: nextCategoryMonth.id }, data: nextCategoryMonth })
  }
}
