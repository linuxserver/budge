import { Budget } from "../entities/Budget"
import { EntityRepository, Repository } from "typeorm"
import { BudgetMonth } from "../entities/BudgetMonth"
import { formatMonthFromDateString } from "../utils"

@EntityRepository(BudgetMonth)
export class BudgetMonths extends Repository<BudgetMonth> {
  async findOrCreate(budgetId: string, month: string): Promise<BudgetMonth> {
    let budgetMonth: BudgetMonth = await this.findOne({ budgetId, month })
    if (!budgetMonth) {
      const budget = await this.manager.getRepository(Budget).findOne(budgetId)
      const months = await budget.getMonths()

      let newBudgetMonth
      let direction = 1
      let monthFrom = new Date()
      monthFrom.setDate(1)

      if (month < months[0]) {
        monthFrom = new Date(`${months[0]}T12:00:00`)
        direction = -1
      } else if (month > months[months.length - 1]) {
        monthFrom = new Date(`${months[months.length - 1]}T12:00:00`)
      }

      // iterate over all months until we hit the first budget month
      do {
        monthFrom.setMonth(monthFrom.getMonth() + direction)
        newBudgetMonth = this.create({
          budgetId,
          month: formatMonthFromDateString(monthFrom),
        })
        await this.insert(newBudgetMonth)
      } while (newBudgetMonth.month !== month)

      return newBudgetMonth
    }

    return budgetMonth
  }
}
