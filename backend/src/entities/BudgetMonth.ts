import { BudgetMonthModel } from '../models/BudgetMonth'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  OneToMany,
} from 'typeorm'
import { Budget } from './Budget'
import { CategoryMonth } from './CategoryMonth'
import { Dinero } from '@dinero.js/core'
import { dinero } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'

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
    transformer: new CurrencyDBTransformer()
  })
  income: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer()
  })
  budgeted: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer()
  })
  activity: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer()
  })
  underfunded: Dinero<number> = dinero({ amount: 0, currency: USD })

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.months)
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
      income: {...this.income},
      budgeted: {...this.budgeted},
      activity: {...this.activity},
      underfunded: {...this.underfunded},
    }
  }

  public async toResponseModel(): Promise<BudgetMonthModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      month: this.month,
      income: this.income.toJSON().amount,
      budgeted: this.budgeted.toJSON().amount,
      activity: this.activity.toJSON().amount,
      underfunded: this.underfunded.toJSON().amount,
      created: this.created ? this.created.toISOString() : new Date().toISOString(),
      updated: this.updated ? this.updated.toISOString() : new Date().toISOString(),
    }
  }
}
