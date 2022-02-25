import { BudgetMonthModel } from '../models/BudgetMonth'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, OneToMany } from 'typeorm'
import { Budget } from './Budget'
import { CategoryMonth } from './CategoryMonth'

@Entity('budget_months')
export class BudgetMonth {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  budgetId: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  month: string

  @Column({
    type: 'int',
    default: 0,
  })
  income: number = 0

  @Column({
    type: 'int',
    default: 0,
  })
  budgeted: number = 0

  @Column({
    type: 'int',
    default: 0,
  })
  activity: number = 0

  @Column({
    type: 'int',
    default: 0,
  })
  underfunded: number = 0

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.months, { onDelete: 'CASCADE' })
  budget: Promise<Budget>

  /**
   * Has man category months
   */
  @OneToMany(() => CategoryMonth, categoryMonth => categoryMonth.budgetMonth)
  categories: Promise<CategoryMonth[]>

  public getUpdatePayload() {
    return {
      id: this.id,
      budgetId: this.budgetId,
      month: this.month,
      income: this.income,
      budgeted: this.budgeted,
      activity: this.activity,
      underfunded: this.underfunded,
    }
  }

  public async toResponseModel(): Promise<BudgetMonthModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      month: this.month,
      income: this.income,
      budgeted: this.budgeted,
      activity: this.activity,
      underfunded: this.underfunded,
      created: this.created ? this.created.toISOString() : new Date().toISOString(),
      updated: this.updated ? this.updated.toISOString() : new Date().toISOString(),
    }
  }
}
