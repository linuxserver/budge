import { Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { Account } from './Account'
import { PayeeModel } from '../models/Payee'
import { Transaction } from './Transaction'

@Entity('payees')
export class Payee {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  budgetId: string

  @Column({ type: 'varchar', nullable: true })
  transferAccountId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'boolean' })
  internal: boolean = false

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  @OneToOne(() => Account, account => account.transferPayee)
  @JoinColumn()
  transferAccount: Promise<Account>

  /**
   * Has many transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Promise<Transaction[]>
}
