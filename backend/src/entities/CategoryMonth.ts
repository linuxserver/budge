import { CategoryMonthModel } from '../schemas/category_month'
import { Entity, BeforeInsert, AfterInsert, AfterUpdate, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, Index, AfterLoad } from 'typeorm'
import { BudgetMonth } from './BudgetMonth'
import { Category } from './Category'
import { formatMonthFromDateString, getDateFromString } from '../utils'

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

  originalBudgeted: number = 0

  originalActivity: number = 0

  @AfterLoad()
  private storeOriginalValues(): void {
    this.originalBudgeted = this.budgeted
  }

  public static async findOrCreate(budgetId: string, categoryId: string, month: string ): Promise<CategoryMonth> {
    let categoryMonth: CategoryMonth = await CategoryMonth.findOne({ categoryId, month: month }, { relations: ["budgetMonth"] })
    if (!categoryMonth) {
      const budgetMonth = await BudgetMonth.findOrCreate(budgetId, month)
      categoryMonth = CategoryMonth.create({
        categoryId,
        month: month,
        // @TODO: I DON'T KNOW WHY I HAVE TO SPECIFY 0s HERE AND NOT ABOVE WHEN CREATING BUDGET MONTH!!! AHHH!!!
        activity: 0,
        balance: 0,
        budgeted: 0,
      })
      categoryMonth.budgetMonth = budgetMonth
    }

    return categoryMonth
  }

  /**
   * Get the previous month's 'balance' as this will be the 'carry over' amount for this new month
   */
  @BeforeInsert()
  private async getInitialBalance(): Promise<void> {
    const prevMonth = getDateFromString(this.month)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevCategoryMonth = await CategoryMonth.findOne({ categoryId: this.categoryId, month: formatMonthFromDateString(prevMonth) })
    if (prevCategoryMonth && prevCategoryMonth.balance > 0) {
      this.balance = prevCategoryMonth.balance + this.budgeted + this.activity
    }
  }

  /**
   * == RECURSIVE ==
   *
   * Cascade the new assigned and activity amounts up into the parent budget month for new totals.
   * Also, cascade the new balance of this month into the next month to update the carry-over amount.
   */
  @AfterInsert()
  @AfterUpdate()
  public async bookkeeping(): Promise<void> {
    // Update budget month activity and and budgeted
    this.budgetMonth.budgeted = this.budgeted - this.originalBudgeted
    this.budgetMonth.activity += this.activity - this.originalActivity
    this.budgetMonth.save()

    const nextMonth = getDateFromString(this.month)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextBudgetMonth = await BudgetMonth.findOne({ budgetId: this.budgetMonth.budgetId, month: formatMonthFromDateString(nextMonth) })
    if (!nextBudgetMonth) {
      return
    }

    const nextCategorymonth = await CategoryMonth.findOrCreate(nextBudgetMonth.budgetId, this.categoryId, nextBudgetMonth.month )

    if (this.balance > 0) {
      nextCategorymonth.balance = this.balance + nextCategorymonth.budgeted + nextCategorymonth.activity
    } else {
      // If the next month's balance already matched it's activity, no need to keep cascading
      if (nextCategorymonth.balance === nextCategorymonth.budgeted + nextCategorymonth.activity) {
        return
      }

      nextCategorymonth.balance = nextCategorymonth.budgeted + nextCategorymonth.activity
    }

    await nextCategorymonth.save()
  }

  public async update({ activity, budgeted }: {[key: string]: number}): Promise<CategoryMonth> {
    if (activity !== undefined) {
      this.activity += activity
      this.balance += activity
    }
    if (budgeted !== undefined) {
      const budgetedDifference = budgeted - this.budgeted
      this.budgeted += budgetedDifference
      this.balance += budgetedDifference
    }

    await this.save()

    return this
  }

  public async toResponseModel(): Promise<CategoryMonthModel> {
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
