import { TransactionModel } from '../models/Transaction'
import {
  Entity,
  AfterLoad,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  DeepPartial,
  Index,
} from 'typeorm'
import { Account } from './Account'
import { Category } from './Category'
import { formatMonthFromDateString } from '../utils'
import { Budget } from './Budget'
import { Payee } from './Payee'

export enum TransactionStatus {
  Pending,
  Cleared,
  Reconciled,
}

export type TransactionOriginalValues = {
  payeeId: string
  categoryId: string
  amount: number
  date: Date
  status: TransactionStatus
}

export class TransactionCache {
  static cache: { [key: string]: TransactionOriginalValues } = {}

  static transfers: string[] = []

  public static get(id: string): TransactionOriginalValues | null {
    if (TransactionCache.cache[id]) {
      return TransactionCache.cache[id]
    }

    return null
  }

  public static set(transaction: Transaction) {
    TransactionCache.cache[transaction.id] = {
      payeeId: transaction.payeeId,
      categoryId: transaction.categoryId,
      amount: transaction.amount,
      date: new Date(transaction.date.getTime()),
      status: transaction.status,
    }
  }

  public static enableTransfers(id: string) {
    const index = TransactionCache.transfers.indexOf(id)
    if (index === -1) {
      TransactionCache.transfers.push(id)
    }
  }

  public static disableTransfers(id: string) {
    const index = TransactionCache.transfers.indexOf(id)
    if (index > -1) {
      TransactionCache.transfers.splice(index, 1)
    }
  }

  public static transfersEnabled(id: string): boolean {
    const index = TransactionCache.transfers.indexOf(id)
    if (index > -1) {
      return true
    }

    return false
  }
}

@Entity('transactions')
export class Transaction {
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
  })
  amount: number = 0

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

  @AfterLoad()
  private storeOriginalValues() {
    TransactionCache.set(this)
  }

  public update(partial: DeepPartial<Transaction>): Transaction {
    Object.assign(this, partial)
    return this
  }

  public getUpdatePayload() {
    return {
      id: this.id,
      budgetId: this.budgetId,
      accountId: this.accountId,
      payeeId: this.payeeId,
      transferAccountId: this.transferAccountId,
      transferTransactionId: this.transferTransactionId,
      categoryId: this.categoryId,
      amount: this.amount,
      date: this.date,
      memo: this.memo,
      status: this.status,
    }
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

  public static getMonth(date: Date): string {
    return formatMonthFromDateString(date)
  }
}
