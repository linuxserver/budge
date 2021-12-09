import { BudgetMonthModel } from '../models/BudgetMonth'
import {
  Entity,
  AfterLoad,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  PrimaryColumn,
} from 'typeorm'
import { Budget } from './Budget'
import { CategoryMonth } from './CategoryMonth'
import { getMonthStringFromNow } from '../utils'
import { Dinero, toSnapshot } from '@dinero.js/core'
import { dinero } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'
import { Base } from './Base'

@Entity('budget_months')
export class BudgetMonth extends BaseEntity {
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
  @OneToMany(() => CategoryMonth, categoryMonth => categoryMonth.budgetMonth, { cascade: true })
  categories: Promise<CategoryMonth[]>

  originalIncome: Dinero<number> = dinero({ amount: 0, currency: USD })

  originalBudgeted: Dinero<number> = dinero({ amount: 0, currency: USD })

  originalActivity: Dinero<number> = dinero({ amount: 0, currency: USD })

  @AfterLoad()
  private async loadInitialValues(): Promise<void> {
    this.originalIncome = this.income
    this.originalBudgeted = this.budgeted
    this.originalActivity = this.activity
  }

  @BeforeUpdate()
  private async test(): Promise<void> {
    // console.log(this)
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
        await newBudgetMonth.save({ transaction: false })
        newBudgetMonth.budget = Promise.resolve(budget)
        counter = counter + direction
      } while (newBudgetMonth.month !== month)

      return newBudgetMonth
    }

    return budgetMonth
  }
}
