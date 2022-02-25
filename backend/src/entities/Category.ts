import { CategoryModel } from '../models/Category'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { CategoryGroup } from './CategoryGroup'
import { CategoryMonth } from './CategoryMonth'
import { Transaction } from './Transaction'
import { Budget } from './Budget'

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  budgetId: string

  @Column({ type: 'varchar', nullable: false })
  categoryGroupId: string

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  trackingAccountId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'boolean', default: false })
  inflow: boolean

  @Column({ type: 'boolean', default: false })
  locked: boolean

  @Column({ type: 'int', default: 0 })
  order: number = 0

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.categories, { onDelete: 'CASCADE' })
  budget: Budget

  /**
   * Belongs to a category group
   */
  @ManyToOne(() => CategoryGroup, categoryGroup => categoryGroup.categories, { onDelete: 'CASCADE' })
  categoryGroup: CategoryGroup

  /**
   * Has many months
   */
  @OneToMany(() => CategoryMonth, categoryMonth => categoryMonth.category)
  categoryMonths: CategoryMonth[]

  /**
   * Has many transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.category)
  transactions: Transaction[]

  public getUpdatePayload() {
    return {
      id: this.id,
      budgetId: this.budgetId,
      categoryGroupId: this.categoryGroupId,
      trackingAccountId: this.trackingAccountId,
      name: this.name,
      inflow: this.inflow,
      locked: this.locked,
      order: this.order,
    }
  }

  public async toResponseModel(): Promise<CategoryModel> {
    return {
      id: this.id,
      categoryGroupId: this.categoryGroupId,
      trackingAccountId: this.trackingAccountId,
      name: this.name,
      inflow: this.inflow,
      locked: this.locked,
      order: this.order,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }

  public static sort(categories: Category[]): Category[] {
    categories.sort((a, b) => {
      if (a.order === b.order) {
        return a.name < b.name ? -1 : 1
      }
      return a.order < b.order ? -1 : 1
    })

    return categories.map((cat, index) => {
      cat.order = index
      return cat
    })
  }
}
