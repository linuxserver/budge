import { CategoryModel } from '../schemas/category'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany, Index, OneToOne, JoinColumn, AfterLoad } from 'typeorm'
import { CategoryGroup } from './CategoryGroup'
import { CategoryMonth } from './CategoryMonth'
import { Transaction } from './Transaction'
import { Budget } from '.'
import { Account } from './Account'

@Entity('categories')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  budgetId: string

  @Column({ type: 'varchar', nullable: false })
  categoryGroupId: string

  @Column({ type: 'varchar', nullable: true })
  trackingAccountId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'boolean', default: false })
  inflow: boolean

  @Column({ type: 'boolean', default: false })
  locked: boolean

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.categories)
  budget: Budget

  /**
   * Belongs to a category group
   */
  @ManyToOne(() => CategoryGroup, categoryGroup => categoryGroup.categories)
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

  public async toResponseModel(): Promise<CategoryModel> {
    return {
      id: this.id,
      categoryGroupId: this.categoryGroupId,
      trackingAccountId: this.trackingAccountId,
      name: this.name,
      inflow: this.inflow,
      locked: this.locked,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
