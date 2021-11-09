import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne } from 'typeorm'
import { Category } from './Category'

@Entity('category_months')
export class CategoryMonth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'string', nullable: false })
  categoryId: string

  @Column()
  month: string

  @Column()
  budgeted: number

  @Column()
  activity: number

  @Column()
  balance: number

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a category
   */
  @ManyToOne(() => Category, category => category.categoryMonths)
  category: Category
}
