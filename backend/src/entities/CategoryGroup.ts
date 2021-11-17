import { CategoryGroupModel } from '../schemas/category_group'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'

export const CreditCardGroupName = 'Credit Card Payments'

@Entity('category_groups')
export class CategoryGroup extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'string', nullable: false })
  @Index()
  budgetId: string

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
  @OneToMany(() => Category, category => category.categoryGroup, { eager: true })
  categories: Promise<Category[]>

  public async sanitize(): Promise<CategoryGroupModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      name: this.name,
      categories: await Promise.all((await this.categories).map(category => category.sanitize())),
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
