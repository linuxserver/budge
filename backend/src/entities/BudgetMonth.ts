import { BudgetMonthModel, BudgetMonthWithCategoriesModel } from '../schemas/budget_month'
import { Entity, AfterLoad, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, Index, OneToMany, DeepPartial } from 'typeorm'
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

  originalIncome: number = 0

  originalBudgeted: number = 0

  originalActivity: number = 0

  originalToBeBudgeted: number = 0

  @AfterLoad()
  private loadInitialValues(): void {
    this.originalIncome = this.income
    this.originalBudgeted = this.budgeted
    this.originalActivity = this.activity
    this.originalToBeBudgeted = this.toBeBudgeted
  }

  public async toResponseModel(): Promise<BudgetMonthModel> {
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
      let counter = 1
      let direction = 1

      if (months[0] > month) {
        direction = -1
        counter = -1
      }

      // iterate over all months until we hit the first budget month
      do {
        newBudgetMonth = BudgetMonth.create({
          budgetId,
          month: getMonthStringFromNow(counter),
        })
        await newBudgetMonth.save()
        counter = counter + direction
      } while (newBudgetMonth.month !== month)

      return newBudgetMonth
    }

    return budgetMonth
  }
}
