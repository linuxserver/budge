import { CategoryGroupModel } from '../models/CategoryGroup'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm'
import { Budget } from './Budget'
import { Category } from './Category'

export const CreditCardGroupName = 'Credit Card Payments'

@Entity('category_groups')
export class CategoryGroup {
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

  @Column({ type: 'int', default: 0 })
  order: number = 0

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

  public static sort(categoryGroups: any[]): any[] {
    categoryGroups = categoryGroups.sort((a, b) => {
      if (a.order === b.order) {
        return a.name > b.name ? -1 : 1
      }
      return a.order < b.order ? -1 : 1
    })

    return categoryGroups.map((group, index) => {
      group.order = index
      return group
    })
  }
}
