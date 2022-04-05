import { BudgetMonthModel } from '../models/BudgetMonth'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  OneToMany,
  AfterLoad,
} from 'typeorm'
import { Budget } from './Budget'
import { CategoryMonth } from './CategoryMonth'

export type BudgetMonthOriginalValues = {
  income: number
  budgeted: number
  activity: number
  available: number
  underfunded: number
}

export class BudgetMonthCache {
  static cache: { [key: string]: BudgetMonthOriginalValues } = {}

  public static get(id: string): BudgetMonthOriginalValues | null {
    if (BudgetMonthCache.cache[id]) {
      return BudgetMonthCache.cache[id]
    }

    return {
      income: 0,
      budgeted: 0,
      activity: 0,
      available: 0,
      underfunded: 0,
    }
  }

  public static set(budgetMonth: BudgetMonth) {
    BudgetMonthCache.cache[budgetMonth.id] = {
      income: budgetMonth.income,
      budgeted: budgetMonth.budgeted,
      activity: budgetMonth.activity,
      available: budgetMonth.available,
      underfunded: budgetMonth.underfunded,
    }
  }
}

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
  available: number = 0

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
  @ManyToOne(() => Budget, budget => budget.months)
  budget: Promise<Budget>

  /**
   * Has many category months
   */
  @OneToMany(() => CategoryMonth, categoryMonth => categoryMonth.budgetMonth)
  categories: Promise<CategoryMonth[]>

  @AfterLoad()
  private storeOriginalValues(): void {
    BudgetMonthCache.set(this)
  }

  public getUpdatePayload() {
    return {
      id: this.id,
      budgetId: this.budgetId,
      month: this.month,
      income: this.income,
      budgeted: this.budgeted,
      activity: this.activity,
      available: this.available,
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
      available: this.available,
      underfunded: this.underfunded,
      created: this.created,
      updated: this.updated,
    }
  }
}
