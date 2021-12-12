import { TransactionModel } from '../models/Transaction'
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
  PrimaryColumn,
  getRepository,
  Index,
} from 'typeorm'
import { Account, AccountTypes } from './Account'
import { Category } from './Category'
import { formatMonthFromDateString } from '../utils'
import { CategoryMonth } from './CategoryMonth'
import { Budget } from '.'
import { Payee } from './Payee'
import { Dinero } from '@dinero.js/core'
import { add, dinero, multiply, subtract, isPositive } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'
import { Base } from './Base'

export enum TransactionStatus {
  Pending,
  Cleared,
  Reconciled,
}

export type TransactionFlags = {
  handleTransfers: boolean
  eventsEnabled: boolean
}

export type TransactionOriginalValues = {
  payeeId: string
  categoryId: string
  amount: Dinero<number>
  date: Date
  status: TransactionStatus
}

@Entity('transactions')
export class Transaction extends Base {
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

  @Index()
  @Column({ type: 'varchar', nullable: true, default: null })
  transferTransactionId: string

  @Column({ type: 'varchar', nullable: true })
  categoryId: string

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  amount: Dinero<number> = dinero({ amount: 0, currency: USD })

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

  flags: TransactionFlags = {
    handleTransfers: false,
    eventsEnabled: true,
  }

  original: TransactionOriginalValues = {
    payeeId: '',
    categoryId: '',
    amount: dinero({ amount: 0, currency: USD }),
    date: new Date(),
    status: 0,
  }

  @AfterLoad()
  private storeOriginalValues() {
    this.original.payeeId = this.payeeId
    this.original.categoryId = this.categoryId
    this.original.amount = { ...this.amount }
    this.original.date = { ...this.date }
    this.original.status = this.status
  }

  public getHandleTransfers(): boolean {
    return this.flags.handleTransfers
  }

  public setHandleTransfers(enabled: boolean) {
    this.flags.handleTransfers = enabled
  }

  public getEventsEnabled(): boolean {
    return this.flags.eventsEnabled
  }

  public setEventsEnabled(enabled: boolean) {
    this.flags.eventsEnabled = enabled
  }

  public update(partial: DeepPartial<Transaction>) {
    Object.assign(this, partial)
  }

  public async toResponseModel(): Promise<TransactionModel> {
    return {
      id: this.id,
      accountId: this.accountId,
      payeeId: this.payeeId,
      amount: this.amount.toJSON().amount,
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
