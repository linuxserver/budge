import { BudgetMonthModel, BudgetMonthWithCategoriesModel } from '../schemas/budget_month'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, Index, OneToMany } from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'
import { CategoryMonth } from './CategoryMonth'
import { getMonthStringFromNow } from '../utils'

@Entity('budget_months')
export class BudgetMonth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'string', nullable: false })
  @Index()
  budgetId: string

  @Column({ nullable: false })
  @Index()
  month: string

  @Column({ default: 0 })
  income: number

  @Column({ default: 0 })
  budgeted: number

  @Column({ default: 0 })
  activity: number

  @Column({ default: 0 })
  toBeBudgeted: number

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.months)
  budget: Budget

  /**
   * Has man category months
   */
  @OneToMany(() => CategoryMonth, categoryMonth => categoryMonth.budgetMonth)
  categories: CategoryMonth[]

  public async sanitize(): Promise<BudgetMonthModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      month: this.month,
      income: this.income,
      budgeted: this.budgeted,
      activity: this.activity,
      toBeBudgeted: this.toBeBudgeted,
      created: this.created ? this.created.toISOString() : (new Date()).toISOString(),
      updated: this.updated ? this.updated.toISOString() : (new Date()).toISOString(),
    }
  }

  public static async findOrCreate(budgetId: string, month: string): Promise<BudgetMonth> {
    let budgetMonth: BudgetMonth = await BudgetMonth.findOne({ budgetId, month })
    if (!budgetMonth) {
      const budget = await Budget.findOne(budgetId)
      const months = await budget.getMonths()

      let newBudgetMonth
      if (months[0] > month) {
        let counter = -1

        // iterate over all months until we hit the first budget month
        do {
          newBudgetMonth = BudgetMonth.create({
            budgetId,
            month: getMonthStringFromNow(counter),
          })
          await newBudgetMonth.save()
          counter = counter - 1
        } while (newBudgetMonth.month !== month)
      } else {
        let counter = 1
        // add months to end of budget month until we get to target month
        do {
          newBudgetMonth = BudgetMonth.create({
            budgetId,
            month: getMonthStringFromNow(counter),
          })
          await newBudgetMonth.save()
          counter = counter + 1
        } while (newBudgetMonth.month !== month)
      }

      return newBudgetMonth
    }

    return budgetMonth
  }
}
