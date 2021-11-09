import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'

@Entity('category_groups')
export class CategoryGroup extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'string', nullable: false })
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
  @OneToMany(() => Category, category => category.categoryGroup)
  categories: Category[]
}
