import { PrismaClient } from '@prisma/client'
import { getDateFromString, formatMonthFromDateString } from '../../utils'

export default class BudgetMonthMiddleware {
  public static async afterInsert(budgetMonth: any, prisma: PrismaClient) {
    const prevMonth = getDateFromString(budgetMonth.month).minus({ month: 1 })

    const prevBudgetMonth = await prisma.budgetMonth.findFirst({
      where: {
        budgetId: budgetMonth.budgetId,
        month: formatMonthFromDateString(prevMonth.toJSDate()),
      },
    })

    if (!prevBudgetMonth) {
      return
    }

    // Find all categories with previous balances to update the new month with
    const previousCategoryMonths = await prisma.categoryMonth.findMany({
      where: {
        budgetMonthId: prevBudgetMonth.id,
      },
    })

    // Create a category month for each category in this new budget month
    for (const previousCategoryMonth of previousCategoryMonths) {
      let prevBalance = 0
      if (previousCategoryMonth.balance > 0) {
        prevBalance = previousCategoryMonth.balance
      } else {
        const category = await prisma.category.findUnique({
          where: {
            id: previousCategoryMonth.categoryId,
          },
        })

        if (previousCategoryMonth.balance < 0 && category.trackingAccountId) {
          prevBalance = previousCategoryMonth.balance
        }
      }

      await prisma.categoryMonth.create({
        data: {
          month: budgetMonth.month,
          balance: prevBalance,
          budgetMonth: { connect: { id: budgetMonth.id } },
          category: { connect: { id: previousCategoryMonth.categoryId } },
        },
      })
    }
  }
}
