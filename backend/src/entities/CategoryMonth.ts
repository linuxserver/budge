import { CategoryMonthModel } from '../models/CategoryMonth'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index, AfterLoad } from 'typeorm'
import { BudgetMonth } from './BudgetMonth'
import { Category } from './Category'

export type CategoryMonthOriginalValues = {
  budgeted: number
  activity: number
  balance: number
}

export class CategoryMonthCache {
  static cache: { [key: string]: CategoryMonthOriginalValues } = {}

  public static get(id: string): CategoryMonthOriginalValues | null {
    if (CategoryMonthCache.cache[id]) {
      return CategoryMonthCache.cache[id]
    }

    return {
      budgeted: 0,
      activity: 0,
      balance: 0,
    }
  }

  public static set(categoryMonth: CategoryMonth) {
    CategoryMonthCache.cache[categoryMonth.id] = {
      budgeted: categoryMonth.budgeted,
      activity: categoryMonth.activity,
      balance: categoryMonth.balance,
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
  balance: number = 0

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a category
   */
  @ManyToOne(() => Category, category => category.categoryMonths, { onDelete: 'CASCADE' })
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

  public update({ activity, budgeted }: { [key: string]: number }) {
    if (activity !== undefined) {
      this.activity = this.activity + activity
      this.balance = this.balance + activity
    }
    if (budgeted !== undefined) {
      const budgetedDifference = budgeted - this.budgeted
      this.budgeted = this.budgeted + budgetedDifference
      this.balance = this.balance + budgetedDifference
    }
  }

  public async toResponseModel(): Promise<CategoryMonthModel> {
    return {
      id: this.id,
      categoryId: this.categoryId,
      month: this.month,
      budgeted: this.budgeted,
      activity: this.activity,
      balance: this.balance,
      created: this.created,
      updated: this.updated,
    }
  }
}
