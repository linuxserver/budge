import { TransactionModel } from '../schemas/transaction'
import {
  Entity,
  AfterLoad,
  AfterRemove,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  DeepPartial,
  AfterInsert,
  BeforeInsert,
  AfterUpdate,
  BeforeUpdate,
  BeforeRemove,
} from 'typeorm'
import { Account, AccountTypes } from './Account'
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

  @Column({ type: 'varchar', nullable: false })
  budgetId: string

  @Column({ type: 'varchar', nullable: false })
  accountId: string

  @Column({ type: 'varchar', nullable: false })
  payeeId: string

  @Column({ type: 'varchar', nullable: true })
  transferAccountId: string

  @Column({ type: 'varchar', nullable: true, default: null })
  transferTransactionId: string

  @Column({ type: 'varchar', nullable: true })
  categoryId: string

  @Column({ type: 'int' })
  amount: number

  @Column({ type: 'datetime' })
  date: Date

  @Column({ type: 'varchar', default: '' })
  memo: string

  @Column({ type: 'int', default: TransactionStatus.Pending })
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

  originalPayeeId: string | null = null

  originalTransferTransactionId: string | null = null

  categoryMonth: CategoryMonth

  originalCategoryId: string = ''

  originalAmount: number = 0

  originalDate: Date = new Date()

  originalStatus: TransactionStatus = null

  @AfterLoad()
  private storeOriginalValues() {
    this.originalPayeeId = this.payeeId
    this.originalCategoryId = this.categoryId
    this.originalAmount = this.amount
    this.originalDate = this.date
    this.originalStatus = this.status
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
  private async checkCreateTransferTransaction() {
    if (this.handleTransfers === false) {
      return
    }
    this.handleTransfers = false

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
        formatMonthFromDateString(this.date),
      )
    }
  }

  @AfterInsert()
  private async bookkeepingOnAdd(): Promise<void> {
    const account = await Account.findOne({ id: this.accountId })

    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!
    if (this.transferTransactionId !== null) {
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        const ccCategory = await Category.findOne({ trackingAccountId: account.id })
        const ccCategoryMonth = await CategoryMonth.findOrCreate(this.budgetId, ccCategory.id, this.getMonth())
        await ccCategoryMonth.update({ activity: this.amount * -1 })
      }
      return
    }

    if (!this.categoryId) {
      return
    }

    // Cascade category month
    await this.categoryMonth.update({ activity: this.amount })

    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await Category.findOne({ trackingAccountId: account.id })
      const ccCategoryMonth = await CategoryMonth.findOrCreate(this.budgetId, ccCategory.id, this.getMonth())
      await ccCategoryMonth.update({ activity: this.amount * -1 })
    }
  }

  @AfterInsert()
  private async createTransferTransaction(): Promise<void> {
    if (this.transferTransactionId !== '0') {
      return
    }

    const transferTransaction = Transaction.create({
      budgetId: this.budgetId,
      accountId: (await this.getPayee()).transferAccountId,
      payeeId: (await this.getAccount()).transferPayeeId,
      transferAccountId: (await this.getAccount()).id,
      transferTransactionId: this.id,
      amount: this.amount * -1,
      date: this.date,
      status: TransactionStatus.Pending,
    })

    await transferTransaction.save()

    this.payeeId = (await transferTransaction.getAccount()).transferPayeeId
    this.transferAccountId = (await transferTransaction.getAccount()).id
    this.transferTransactionId = transferTransaction.id

    // Perform update here so that the listener hooks don't get called
    await Transaction.update(this.id, {
      payeeId: this.payeeId,
      transferAccountId: this.transferAccountId,
      transferTransactionId: this.transferTransactionId,
    })
  }

  @AfterInsert()
  private async updateAccountBalanceOnAdd(): Promise<void> {
    const account = await this.getAccount()

    switch (this.status) {
      case TransactionStatus.Pending:
        account.uncleared += this.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared += this.amount
        break
    }

    await account.save()
  }

  @AfterUpdate()
  private async updateAccountBalanceOnUpdate(): Promise<void> {
    if (this.amount === this.originalAmount && this.status === this.originalStatus) {
      // amount and status hasn't changed, no balance update necessary
      return
    }

    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await Account.findOne(this.accountId)

    switch (this.originalStatus) {
      case TransactionStatus.Pending:
        account.uncleared -= this.originalAmount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared -= this.originalAmount
        break
    }

    switch (this.status) {
      case TransactionStatus.Pending:
        account.uncleared += this.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared += this.amount
        break
    }

    await account.save()
  }

  @AfterRemove()
  private async updateAccountBalanceOnRemove(): Promise<void> {
    // First, 'undo' the original amount / status then add in new. Easier than a bunch of if statements
    const account = await this.getAccount()

    console.log(`updating account ${account.name} with ${this.amount}`)
    switch (this.status) {
      case TransactionStatus.Pending:
        account.uncleared -= this.amount
        break
      case TransactionStatus.Cleared:
      case TransactionStatus.Reconciled:
      default:
        account.cleared -= this.amount
        break
    }

    await account.save()
  }

  @BeforeUpdate()
  private async updateTransferTransaction() {
    if (this.handleTransfers === false) {
      return
    }
    this.handleTransfers = false

    // If the payees, dates, and amounts haven't changed, bail
    if (
      this.payeeId === this.originalPayeeId &&
      this.amount === this.originalAmount &&
      formatMonthFromDateString(this.date) === formatMonthFromDateString(this.originalDate)
    ) {
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
  }

  @AfterUpdate()
  private async bookkeepingOnUpdate(): Promise<void> {
    const account = await this.account

    if (this.transferTransactionId !== null) {
      // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
      if (account.type === AccountTypes.CreditCard) {
        // Update CC category
        const ccCategory = await Category.findOne({ trackingAccountId: account.id })
        const originalCCMonth = await CategoryMonth.findOne({
          categoryId: ccCategory.id,
          month: formatMonthFromDateString(this.originalDate),
        })
        await originalCCMonth.update({ activity: this.originalAmount })

        const currentCCMonth = await CategoryMonth.findOrCreate(this.budgetId, ccCategory.id, this.getMonth())
        await currentCCMonth.update({ activity: this.amount * -1 })
      }

      return
    }

    if (!this.categoryId) {
      return
    }

    let activity = this.amount - this.originalAmount

    if (
      this.originalCategoryId !== this.categoryId ||
      formatMonthFromDateString(this.originalDate) !== formatMonthFromDateString(this.date)
    ) {
      // Cat or month has changed so the activity is the entirety of the transaction
      activity = this.amount

      // Category or month has changed, so reset 'original' amount
      const originalCategoryMonth = await CategoryMonth.findOne(
        { categoryId: this.originalCategoryId, month: formatMonthFromDateString(this.originalDate) },
        { relations: ['budgetMonth'] },
      )

      await originalCategoryMonth.update({ activity: this.originalAmount * -1 })
      await this.categoryMonth.update({ activity })

      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await Category.findOne({ trackingAccountId: account.id })
        const originalCCMonth = await CategoryMonth.findOne({
          categoryId: ccCategory.id,
          month: formatMonthFromDateString(this.originalDate),
        })
        await originalCCMonth.update({ activity: this.originalAmount })

        const currentCCMonth = await CategoryMonth.findOrCreate(this.budgetId, ccCategory.id, this.getMonth())
        await currentCCMonth.update({ activity: this.amount * -1 })
      }
    } else {
      await this.categoryMonth.update({ activity: this.amount - this.originalAmount })

      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await Category.findOne({ trackingAccountId: account.id })
        const currentCCMonth = await CategoryMonth.findOrCreate(this.budgetId, ccCategory.id, this.getMonth())
        await currentCCMonth.update({ activity: this.amount * -1 })
      }
    }
  }

  @BeforeRemove()
  private async deleteTransferTransaction() {
    if (this.transferTransactionId === null) {
      return
    }

    const transferTransaction = await Transaction.findOne({ transferTransactionId: this.id })
    transferTransaction.transferTransactionId = null
    await transferTransaction.remove()
  }

  @AfterRemove()
  private async bookkeepingOnDelete(): Promise<void> {
    const account = await Account.findOne(this.accountId)

    // If this is a transfer, no need to update categories and budgets. Money doesn't 'go anywhere'. UNLESS it's a CC!!!
    if (this.transferTransactionId !== null) {
      if (account.type === AccountTypes.CreditCard) {
        const ccCategory = await Category.findOne({ trackingAccountId: account.id })
        const ccCategoryMonth = await CategoryMonth.findOne({ categoryId: ccCategory.id, month: this.getMonth() })
        await ccCategoryMonth.update({ activity: this.amount })
      }

      return
    }

    if (this.categoryId) {
      const originalCategoryMonth = await CategoryMonth.findOne(
        { categoryId: this.categoryId, month: formatMonthFromDateString(this.date) },
        { relations: ['budgetMonth'] },
      )
      await originalCategoryMonth.update({ activity: this.amount * -1 })
    }

    // Check if we need to update a CC category
    if (account.type === AccountTypes.CreditCard) {
      // Update CC category
      const ccCategory = await Category.findOne({ trackingAccountId: account.id })
      const ccCategoryMonth = await CategoryMonth.findOne({ categoryId: ccCategory.id, month: this.getMonth() })
      await ccCategoryMonth.update({ activity: this.amount })
    }
  }

  private async buildTransferTransaction(): Promise<Transaction> {
    return Transaction.create({
      budgetId: this.budgetId,
      accountId: (await (await this.getPayee()).transferAccount).id,
      payeeId: (await this.getAccount()).transferPayeeId,
      transferAccountId: (await this.getAccount()).id,
      transferTransactionId: this.id,
      amount: this.amount * -1,
      date: this.date,
      status: TransactionStatus.Pending,
    })
  }

  public async getAccount(): Promise<Account> {
    if (this.account === undefined) {
      const account = await Account.findOne(this.accountId)
      this.account = Promise.resolve(account)

      return this.account
    }

    return this.account
  }

  public async getPayee(): Promise<Payee> {
    if (this.payee === undefined) {
      const payee = await Payee.findOne(this.payeeId)
      this.payee = Promise.resolve(payee)

      return payee
    }

    return this.payee
  }

  public async toResponseModel(): Promise<TransactionModel> {
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
