import { TransactionModel } from '../schemas/transaction'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne } from 'typeorm'
import { Account } from './Account'
import { Category } from './Category'
import { formatMonthFromDateString } from '../utils'

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
  accountId: string

  @Column({ type: 'string', nullable: false })
  payeeId: string

  @Column()
  amount: number

  @Column()
  date: Date

  @Column({ default: '' })
  memo: string

  @Column({ default: true })
  categoryId: string

  @Column()
  status: TransactionStatus

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

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
