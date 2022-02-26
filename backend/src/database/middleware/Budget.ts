import { PrismaClient } from '@prisma/client'
import { CategoryGroup } from '../../entities/CategoryGroup'
import { getDateFromString, formatMonthFromDateString, getMonthString, getMonthStringFromNow } from '../../utils'

export default class BudgetMiddleware {
  public static async afterInsert(budget: any, prisma: PrismaClient) {
    const today = getMonthString()
    const prevMonth = getMonthStringFromNow(-1)
    const nextMonth = getMonthStringFromNow(1)

    // Create initial budget months
    for (const month of [prevMonth, today, nextMonth]) {
      const newBudgetMonth = await prisma.budgetMonth.create({
        data: { month, budget: { connect: { id: budget.id } } },
      })
    }

    // Create internal categories
    const internalCategoryGroup = await prisma.categoryGroup.create({
      data: {
        name: 'Internal Category',
        internal: true,
        locked: true,
        budget: { connect: { id: budget.id } },
      },
    })

    // Create internal categories
    await Promise.all(
      ['To be Budgeted'].map(name => {
        return prisma.category.create({
          data: {
            name: name,
            inflow: true,
            locked: true,
            budget: { connect: { id: budget.id } },
            categoryGroup: { connect: { id: internalCategoryGroup.id } },
          },
        })
      }),
    )

    // Create special 'Starting Balance' payee
    const startingBalancePayee = await prisma.payee.create({
      data: {
        name: 'Starting Balance',
        internal: true,
        budget: { connect: { id: budget.id } },
      },
    })

    const reconciliationPayee = await prisma.payee.create({
      data: {
        name: 'Reconciliation Balance Adjustment',
        internal: true,
        budget: { connect: { id: budget.id } },
      },
    })
  }
}
