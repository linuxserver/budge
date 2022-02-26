import { CreditCardGroupName } from '../../entities/CategoryGroup'
import { AccountTypes } from '../../entities/Account'
import { PrismaClient } from '@prisma/client'

export default class CategoryMiddleware {
  public static async afterInsert(category: any, prisma: PrismaClient) {
    // Create a category month for all existing months
    const budgetMonths = await prisma.budgetMonth.findMany({ where: { budgetId: category.budgetId } })

    // @TODO::: we need the ID here ,can we get it fro mthe result above?
    for (const budgetMonth of budgetMonths) {
      await prisma.categoryMonth.create({
        data: {
          month: budgetMonth.month,
          category: { connect: { id: category.id } },
          budgetMonth: { connect: { id: budgetMonth.id } },
        },
      })
    }
  }
}
