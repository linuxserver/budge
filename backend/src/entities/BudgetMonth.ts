import { BudgetMonthModel, BudgetMonthWithCategoriesModel } from '../schemas/budget_month'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, Index, OneToMany } from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'
import { CategoryMonth } from './CategoryMonth'

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
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }

  public static async findOrCreate(budgetId: string, month: string): Promise<BudgetMonth> {
    let budgetMonth: BudgetMonth = await BudgetMonth.findOne({ budgetId, month })
    if (!budgetMonth) {
      budgetMonth = BudgetMonth.create({
        budgetId,
        month,
      })
      await budgetMonth.save()
    }

    return budgetMonth
  }
}
