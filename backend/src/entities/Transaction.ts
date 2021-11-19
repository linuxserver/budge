import { TransactionModel } from '../schemas/transaction'
import { Entity, AfterLoad, AfterRemove, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, DeepPartial, AfterInsert, BeforeInsert, AfterUpdate, BeforeUpdate } from 'typeorm'
import { Account } from './Account'
import { Category } from './Category'
import { formatMonthFromDateString } from '../utils'
import { CategoryMonth } from './CategoryMonth'
import { Budget } from '.'

export enum TransactionStatus {
  Pending,
  Cleared,
  Reconciled,
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'string', nullable: false })
  budgetId: string

  @Column({ type: 'string', nullable: false })
  accountId: string

  @Column({ type: 'string', nullable: false })
  payeeId: string

  @Column({ default: true })
  categoryId: string

  @Column()
  amount: number

  @Column()
  date: Date

  @Column({ default: '' })
  memo: string

  @Column()
  status: TransactionStatus

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
   @ManyToOne(() => Budget, budget => budget.transactions)
   budget: Budget

  /**
   * Belongs to an account
   */
  @ManyToOne(() => Account, account => account.transactions)
  account: Account

  /**
   * Belongs to a payee (account type)
   */
  @ManyToOne(() => Account, account => account.transactions)
  payee: Account

  /**
   * Belongs to a category
   */
  @ManyToOne(() => Category, category => category.transactions)
  category: Category

  /**
   * Variable only used in bookkeeping inside of this class
   */
  exists: boolean = false

  categoryMonth: CategoryMonth

  originalCategoryId: string = ''

  originalAmount: number = 0

  originalDate: Date = new Date()

  originalState: TransactionStatus

  @AfterLoad()
  private storeOriginalValues() {
    this.exists === true
    this.originalCategoryId = this.categoryId
    this.originalAmount = this.amount
    this.originalDate = this.date
  }

  public static async createNew(partial: DeepPartial<Transaction>): Promise<Transaction> {
    // Create transaction
    const transaction = Transaction.create(partial)
    await transaction.save()
    console.log('saved transaction')

    return transaction
  }

  public async update(partial: DeepPartial<Transaction>): Promise<Transaction> {
    Object.assign(this, partial)
    await this.save()

    return this
  }

  @BeforeInsert()
  @BeforeUpdate()
  private async createCategoryMonth(): Promise<void> {
    this.categoryMonth = await CategoryMonth.findOrCreate(
      this.budgetId,
      this.categoryId,
      formatMonthFromDateString(this.date)
    )
  }

  @AfterInsert()
  private async bookkeepingOnAdd(): Promise<void> {
    // Cascade category month
    await this.categoryMonth.update({ activity: this.amount })
  }

  @AfterUpdate()
  private async bookkeepingOnUpdate(): Promise<void> {
    let activity = this.amount - this.originalAmount

    if (this.originalCategoryId !== this.categoryId || formatMonthFromDateString(this.originalDate) !== formatMonthFromDateString(this.date)) {
      // Cat or month has changed so the activity is the entirety of the transaction
      activity = this.amount

      // Category or month has changed, so reset 'original' amount
      const originalCategoryMonth = await CategoryMonth.findOne({ categoryId: this.originalCategoryId, month: formatMonthFromDateString(this.originalDate) }, { relations: ["budgetMonth"] })
      await originalCategoryMonth.update({ activity: this.originalAmount * -1 })
    }

    await this.categoryMonth.update({ activity })
  }

  @AfterRemove()
  private async bookkeepingOnDelete(): Promise<void> {
    console.log(this)
    const originalCategoryMonth = await CategoryMonth.findOne({ categoryId: this.categoryId, month: formatMonthFromDateString(this.date) }, { relations: ["budgetMonth"] })
    await originalCategoryMonth.update({ activity: this.amount * -1 })
  }

  public async sanitize(): Promise<TransactionModel> {
    return {
      id: this.id,
      accountId: this.accountId,
      payeeId: this.payeeId,
      amount: this.amount,
      date: this.date.toISOString(),
      memo: this.memo,
      categoryId: this.categoryId,
      status: this.status,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }

  public getMonth(): string {
    return formatMonthFromDateString(this.date)
  }
}
