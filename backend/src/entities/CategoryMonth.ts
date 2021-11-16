import { CategoryMonthModel } from '../schemas/category_month'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, Index } from 'typeorm'
import { BudgetMonth } from './BudgetMonth'
import { Category } from './Category'

@Entity('category_months')
export class CategoryMonth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'string', nullable: false })
  @Index()
  categoryId: string

  @Column({ type: 'string', nullable: false })
  @Index()
  budgetMonthId: string

  @Column({ nullable: false })
  @Index()
  month: string

  @Column({ default: 0 })
  budgeted: number

  @Column({ default: 0 })
  activity: number

  @Column({ default: 0 })
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

  /**
   * Belongs to a budget month
   */
  @ManyToOne(() => BudgetMonth, budgetMonth => budgetMonth.categories)
  budgetMonth: BudgetMonth

  public static async findOrCreate(categoryId: string, budgetMonth: BudgetMonth ): Promise<CategoryMonth> {
    let categoryMonth: CategoryMonth = await CategoryMonth.findOne({ categoryId, month: budgetMonth.month }, { relations: ["budgetMonth"] })
    if (!categoryMonth) {
      console.log('attempting to create category month')
      categoryMonth = CategoryMonth.create({
        categoryId,
        month: budgetMonth.month,
        // @TODO: I DON'T KNOW WHY I HAVE TO SPECIFY 0s HERE AND NOT ABOVE WHEN CREATING BUDGET MONTH!!! AHHH!!!
        activity: 0,
        balance: 0,
        budgeted: 0,
      })
      categoryMonth.budgetMonth = budgetMonth
    }

    return categoryMonth
  }

  public async updateActivity(activity: number = 0) {
    this.activity += activity
    this.balance += activity
  }

  public async sanitize(): Promise<CategoryMonthModel> {
    return {
      id: this.id,
      categoryId: this.categoryId,
      month: this.month,
      budgeted: this.budgeted,
      activity: this.activity,
      balance: this.balance,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
