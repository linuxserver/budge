import { CategoryGroupModel } from '../models/CategoryGroup'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  PrimaryColumn,
  BeforeInsert,
} from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'
import { Base } from './Base'

export const CreditCardGroupName = 'Credit Card Payments'

@Entity('category_groups')
export class CategoryGroup extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  @Index()
  budgetId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'boolean', default: false })
  internal: boolean

  @Column({ type: 'boolean', default: false })
  locked: boolean

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.categoryGroups)
  budget: Budget

  /**
   * Has many categories
   */
  @OneToMany(() => Category, category => category.categoryGroup, { cascade: true, eager: true })
  categories: Promise<Category[]>

  public async toResponseModel(): Promise<CategoryGroupModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      name: this.name,
      internal: this.internal,
      locked: this.locked,
      categories: await Promise.all((await this.categories).map(category => category.toResponseModel())),
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
