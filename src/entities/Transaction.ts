import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne } from 'typeorm'
import { Account } from './Account'
import { Category } from './Category'

export enum TransactionStatus {
  pending,
  cleared,
  reconciled,
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

  @Column()
  memo: string

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
}
