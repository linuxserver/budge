import { prisma } from '../prisma'
import { DateTime } from 'luxon'
import { formatMonthFromDateString } from '../utils'

export const BudgetMonths = Object.assign(prisma.budgetMonth, {
  findOrCreate: async (budgetId: string, month: string): Promise<any> => {
    const existingBudgetMonth = await prisma.budgetMonth.findFirst({ where: { budgetId, month } })
    if (existingBudgetMonth) {
      return existingBudgetMonth
    }

    const budget = await prisma.budget.findUnique({ where: { id: budgetId }, include: { budgetMonths: true } })
    const months = budget.budgetMonths.map((budgetMonth: any) => budgetMonth.month)

    let newBudgetMonth
    let direction = 1
    let monthFrom = DateTime.now().set({ day: 1 })

    if (month < months[0]) {
      monthFrom = DateTime.fromISO(months[0])
      direction = -1
    } else if (month > months[months.length - 1]) {
      monthFrom = DateTime.fromISO(months[months.length - 1])
    }

    // iterate over all months until we hit the first budget month
    do {
      monthFrom = monthFrom.plus({ month: direction })
      newBudgetMonth = await prisma.budgetMonth.create({
        data: {
          month: formatMonthFromDateString(monthFrom.toJSDate()),
          budget: { connect: { id: budgetId } },
        },
      })
    } while (newBudgetMonth.month !== month)

    return newBudgetMonth
  },
})
