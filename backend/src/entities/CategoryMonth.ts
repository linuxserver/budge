import { CategoryMonthModel } from '../models/CategoryMonth'
import {
  Entity,
  BeforeInsert,
  AfterInsert,
  AfterUpdate,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  Index,
  AfterLoad,
  PrimaryColumn,
} from 'typeorm'
import { BudgetMonth } from './BudgetMonth'
import { Category } from './Category'
import { formatMonthFromDateString, getDateFromString } from '../utils'
import { Budget } from '.'
import { Dinero } from '@dinero.js/core'
import { add, equal, dinero, subtract, isPositive, isNegative } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'
import { Base } from './Base'

@Entity('category_months')
export class CategoryMonth extends BaseEntity {
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
    transformer: new CurrencyDBTransformer(),
  })
  budgeted: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  activity: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  balance: Dinero<number> = dinero({ amount: 0, currency: USD })

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a category
   */
  @ManyToOne(() => Category, category => category.categoryMonths)
  category: Promise<Category>

  /**
   * Belongs to a budget month
   */
  @ManyToOne(() => BudgetMonth, budgetMonth => budgetMonth.categories)
  budgetMonth: Promise<BudgetMonth>

  originalBudgeted: Dinero<number> = dinero({ amount: 0, currency: USD })

  originalActivity: Dinero<number> = dinero({ amount: 0, currency: USD })

  originalBalance: Dinero<number> = dinero({ amount: 0, currency: USD })

  @AfterLoad()
  private storeOriginalValues(): void {
    this.originalBudgeted = this.budgeted
    this.originalActivity = this.activity
    this.originalBalance = this.balance
  }

  public static async findOrCreate(budgetId: string, categoryId: string, month: string): Promise<CategoryMonth> {
    let categoryMonth: CategoryMonth = await CategoryMonth.findOne(
      { categoryId, month: month },
      { relations: ['budgetMonth'] },
    )
    if (!categoryMonth) {
      const budgetMonth = await BudgetMonth.findOrCreate(budgetId, month)
      categoryMonth = CategoryMonth.create({
        budgetMonthId: budgetMonth.id,
        categoryId,
        month: month,
        // @TODO: I DON'T KNOW WHY I HAVE TO SPECIFY 0s HERE AND NOT ABOVE WHEN CREATING BUDGET MONTH!!! AHHH!!!
        activity: dinero({ amount: 0, currency: USD }),
        balance: dinero({ amount: 0, currency: USD }),
        budgeted: dinero({ amount: 0, currency: USD }),
      })
      await categoryMonth.save()
      categoryMonth.budgetMonth = Promise.resolve(budgetMonth)
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
    const prevCategoryMonth = await CategoryMonth.findOne({
      categoryId: this.categoryId,
      month: formatMonthFromDateString(prevMonth),
    })
    if (prevCategoryMonth && isPositive(prevCategoryMonth.balance)) {
      this.balance = add(prevCategoryMonth.balance, add(this.budgeted, this.activity))
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
    const category = await Category.findOne(this.categoryId)

    // Update budget month activity and and budgeted
    const budgetMonth = await BudgetMonth.findOne(this.budgetMonthId)
    const budget = await Budget.findOne(budgetMonth.budgetId)

    budgetMonth.budgeted = add(budgetMonth.budgeted, subtract(this.budgeted, this.originalBudgeted))
    budgetMonth.activity = add(budgetMonth.activity, subtract(this.activity, this.originalActivity))
    budget.toBeBudgeted = add(budget.toBeBudgeted, subtract(this.originalBudgeted, this.budgeted))

    if (category.inflow) {
      budgetMonth.income = add(budgetMonth.income, subtract(this.activity, this.originalActivity))
      budget.toBeBudgeted = add(budget.toBeBudgeted, subtract(this.activity, this.originalActivity))
    }

    // Underfunded only counts for non-CC accounts as a negative CC value could mean cash bach for that month
    if (!category.trackingAccountId) {
      if (isNegative(this.originalBalance)) {
        budgetMonth.underfunded = add(budgetMonth.underfunded, this.originalBalance)
      }
      if (isNegative(this.balance)) {
        budgetMonth.underfunded = subtract(budgetMonth.underfunded, this.balance)
      }
    }

    await budget.save()
    await budgetMonth.save()

    const nextMonth = getDateFromString(this.month)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextBudgetMonth = await BudgetMonth.findOne({
      budgetId: category.budgetId,
      month: formatMonthFromDateString(nextMonth),
    })
    if (!nextBudgetMonth) {
      return
    }

    const nextCategoryMonth = await CategoryMonth.findOrCreate(
      nextBudgetMonth.budgetId,
      this.categoryId,
      nextBudgetMonth.month,
    )

    if (isPositive(this.balance) || category.trackingAccountId) {
      nextCategoryMonth.balance = add(this.balance, add(nextCategoryMonth.budgeted, nextCategoryMonth.activity))
    } else {
      // If the next month's balance already matched it's activity, no need to keep cascading
      const calculatedNextMonth = add(nextCategoryMonth.budgeted, nextCategoryMonth.activity)
      if (equal(nextCategoryMonth.balance, calculatedNextMonth)) {
        return
      }

      nextCategoryMonth.balance = calculatedNextMonth
    }

    // await CategoryMonth.update(nextCategoryMonth.id, { balance: nextCategoryMonth.balance })
    await nextCategoryMonth.save()
  }

  public async update({ activity, budgeted }: { [key: string]: Dinero<number> }): Promise<CategoryMonth> {
    if (activity !== undefined) {
      this.activity = add(this.activity, activity)
      this.balance = add(this.balance, activity)
    }
    if (budgeted !== undefined) {
      const budgetedDifference = subtract(budgeted, this.budgeted)
      this.budgeted = add(this.budgeted, budgetedDifference)
      this.balance = add(this.balance, budgetedDifference)
    }

    await this.save()

    return this
  }

  public async toResponseModel(): Promise<CategoryMonthModel> {
    return {
      id: this.id,
      categoryId: this.categoryId,
      month: this.month,
      budgeted: this.budgeted.toJSON().amount,
      activity: this.activity.toJSON().amount,
      balance: this.balance.toJSON().amount,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
