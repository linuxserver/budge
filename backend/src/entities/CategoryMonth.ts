import { CategoryMonthModel } from '../models/CategoryMonth'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  AfterLoad,
} from 'typeorm'
import { BudgetMonth } from './BudgetMonth'
import { Category } from './Category'
import { Dinero } from '@dinero.js/core'
import { add, dinero, subtract } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'

export type CategoryMonthOriginalValues = {
  budgeted: Dinero<number>
  activity: Dinero<number>
  balance: Dinero<number>
}

export class CategoryMonthCache {
  static cache: { [key: string]: CategoryMonthOriginalValues } = {}

  static transfers: string[] = []

  public static get(id: string): CategoryMonthOriginalValues | null {
    if (CategoryMonthCache.cache[id]) {
      return CategoryMonthCache.cache[id]
    }

    return {
      budgeted: dinero({ amount: 0, currency: USD }),
      activity: dinero({ amount: 0, currency: USD }),
      balance: dinero({ amount: 0, currency: USD }),
    }
  }

  public static set(categoryMonth: CategoryMonth) {
    CategoryMonthCache.cache[categoryMonth.id] = {
      budgeted: {...categoryMonth.budgeted},
      activity: {...categoryMonth.activity},
      balance: {...categoryMonth.balance},
    }
  }
}

@Entity('category_months')
export class CategoryMonth {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  categoryId: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  budgetMonthId: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  month: string

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  budgeted: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  activity: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  balance: Dinero<number> = dinero({ amount: 0, currency: USD })

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a category
   */
  @ManyToOne(() => Category, category => category.categoryMonths)
  category: Promise<Category>

  /**
   * Belongs to a budget month
   */
  @ManyToOne(() => BudgetMonth, budgetMonth => budgetMonth.categories)
  budgetMonth: Promise<BudgetMonth>

  @AfterLoad()
  private storeOriginalValues(): void {
    CategoryMonthCache.set(this)
  }

  public getUpdatePayload() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      budgetMonthId: this.budgetMonthId,
      month: this.month,
      budgeted: this.budgeted,
      activity: this.activity,
      balance: this.balance,
    }
  }

  public update({ activity, budgeted }: { [key: string]: Dinero<number> }) {
    if (activity !== undefined) {
      this.activity = add(this.activity, activity)
      this.balance = add(this.balance, activity)
    }
    if (budgeted !== undefined) {
      const budgetedDifference = subtract(budgeted, this.budgeted)
      this.budgeted = add(this.budgeted, budgetedDifference)
      this.balance = add(this.balance, budgetedDifference)
    }
  }

  public async toResponseModel(): Promise<CategoryMonthModel> {
    return {
      id: this.id,
      categoryId: this.categoryId,
      month: this.month,
      budgeted: this.budgeted.toJSON().amount,
      activity: this.activity.toJSON().amount,
      balance: this.balance.toJSON().amount,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
