import { TransactionModel } from '../schemas/transaction'
import { Entity, OneToOne, JoinTable, AfterLoad, AfterRemove, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, DeepPartial, AfterInsert, BeforeInsert, AfterUpdate, BeforeUpdate, BeforeRemove } from 'typeorm'
import { Account } from './Account'
import { Category } from './Category'
import { formatMonthFromDateString } from '../utils'
import { CategoryMonth } from './CategoryMonth'
import { Budget } from '.'
import { Payee } from './Payee'

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

  @Column({ nullable: true })
  transferAccountId: string

  @Column({ nullable: true, default: null })
  transferTransactionId: string

  @Column({ nullable: true })
  categoryId: string

  @Column()
  amount: number

  @Column()
  date: Date

  @Column({ default: '' })
  memo: string

  @Column({ default: TransactionStatus.Pending })
  status: TransactionStatus

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.transactions)
  budget: Promise<Budget>

  /**
   * Belongs to an account
   */
  @ManyToOne(() => Account, account => account.transactions)
  account: Promise<Account>

  /**
   * Belongs to a payee (account type)
   */
  @ManyToOne(() => Payee, payee => payee.transactions)
  payee: Promise<Payee>

  /**
   * Belongs to a category
   */
  @ManyToOne(() => Category, category => category.transactions)
  category: Promise<Category>

  handleTransfers: boolean = false

  originalPayeeId: string|null = null

  originalTransferTransactionId: string|null = null

  categoryMonth: CategoryMonth

  originalCategoryId: string = ''

  originalAmount: number = 0

  originalDate: Date = new Date()

  originalState: TransactionStatus

  @AfterLoad()
  private storeOriginalValues() {
    this.originalPayeeId = this.payeeId
    this.originalCategoryId = this.categoryId
    this.originalAmount = this.amount
    this.originalDate = this.date
  }

  public static async createNew(partial: DeepPartial<Transaction>): Promise<Transaction> {
    // Create transaction
    const transaction = Transaction.create(partial)
    if (partial.handleTransfers === true) {
      transaction.handleTransfers = true
    }

    await transaction.save()

    return transaction
  }

  public async update(partial: DeepPartial<Transaction>): Promise<Transaction> {
    Object.assign(this, partial)
    if (partial.handleTransfers === true) {
      this.handleTransfers = true
    }
    await this.save()

    return this
  }

  @BeforeInsert()
  private async createTransferTransaction() {
    if (this.handleTransfers === false) {
      return
    }


    const payee = await Payee.findOne(this.payeeId)
    if (payee.transferAccountId === null) {
      // No transfer needed
      return
    }

    // Set a dummy transfer transaction ID since we don't have one yet... hacky, but works
    this.transferTransactionId = '0'
  }

  @BeforeInsert()
  @BeforeUpdate()
  private async createCategoryMonth(): Promise<void> {
    if (this.categoryId) {
      // First, ensure category month exists
      this.categoryMonth = await CategoryMonth.findOrCreate(
        this.budgetId,
        this.categoryId,
        formatMonthFromDateString(this.date)
      )
    }
  }

  @AfterInsert()
  private async bookkeepingOnAdd(): Promise<void> {
    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'
    if (this.transferTransactionId === null) {
      // Cascade category month
      await this.categoryMonth.update({ activity: this.amount })
    } else {
      if (this.handleTransfers) {
        const transferTransaction = Transaction.create({
          budgetId: this.budgetId,
          accountId: (await this.payee).transferAccountId,
          payeeId: (await this.account).transferPayeeId,
          transferAccountId: (await this.account).id,
          transferTransactionId: this.id,
          amount: this.amount * -1,
          date: this.date,
          status: TransactionStatus.Pending,
        })

        await transferTransaction.save()

        this.payeeId = (await transferTransaction.account).transferPayeeId
        this.transferAccountId = (await transferTransaction.account).id
        this.transferTransactionId = transferTransaction.id

        this.handleTransfers = false

        await this.save()
      }
    }
  }

  private async buildTransferTransaction(): Promise<Transaction> {
    return Transaction.create({
      budgetId: this.budgetId,
      accountId: (await ((await this.payee).transferAccount)).id,
      payeeId: (await this.account).transferPayeeId,
      transferAccountId: (await this.account).id,
      transferTransactionId: this.id,
      amount: this.amount * -1,
      date: this.date,
      status: TransactionStatus.Pending,
    })
  }

  @BeforeUpdate()
  private async updateTransferTransaction() {
    if (this.handleTransfers === false) {
      return
    }

    // If the payees, dates, and amounts haven't changed, bail
    if (this.payeeId === this.originalPayeeId && this.amount === this.originalAmount && formatMonthFromDateString(this.date) === formatMonthFromDateString(this.originalDate)) {
      return
    }

    if (this.payeeId === this.originalPayeeId && this.transferTransactionId) {
      // Payees are the same, just update details
      const transferTransaction = await Transaction.findOne({ transferTransactionId: this.id })
      await transferTransaction.update({
        amount: this.amount * -1,
        date: this.date,
      })
      return
    }

    if (this.payeeId !== this.originalPayeeId) {
      // If the payee has changed, delete the transfer transaction before proceeding
      if (this.transferTransactionId) {
        const transferTransaction = await Transaction.findOne({ transferTransactionId: this.id })
        await transferTransaction.remove()
      }

      this.transferTransactionId = null

      // Now create a new transfer transaction if necessary
      const payee = await Payee.findOne(this.payeeId)
      if (payee.transferAccountId !== null) {
        const transferTransaction = await this.buildTransferTransaction()
        await transferTransaction.save()
        this.transferTransactionId = transferTransaction.id
      }
    }

    this.handleTransfers = false
  }

  @AfterUpdate()
  private async bookkeepingOnUpdate(): Promise<void> {
    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'
    if (this.transferTransactionId !== null) {
      return
    }

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

  @BeforeRemove()
  private async deleteTransferTransaction() {
    if (this.handleTransfers === false) {
      return
    }

    if (this.transferTransactionId === null) {
      return
    }

    const transferTransaction = await Transaction.findOne({ transferTransactionId: this.id })
    await transferTransaction.remove()
    this.handleTransfers = false
  }

  @AfterRemove()
  private async bookkeepingOnDelete(): Promise<void> {
    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'
    if (this.transferTransactionId !== null) {
      return
    }

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
