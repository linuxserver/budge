import {
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm'
import { Account } from './Account'
import { PayeeModel } from '../models/Payee'
import { Transaction } from './Transaction'
import { Budget } from './Budget'

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

  @ManyToOne(() => Budget, budget => budget.payees, { onDelete: 'CASCADE' })
  budget: Promise<Budget>

  @OneToOne(() => Account, account => account.transferPayee, { onDelete: 'CASCADE' })
  @JoinColumn()
  transferAccount: Promise<Account>

  /**
   * Has many transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Promise<Transaction[]>

  public async toResponseModel(): Promise<PayeeModel> {
    return {
      id: this.id,
      transferAccountId: this.transferAccountId,
      name: this.name,
      internal: this.internal,
      created: this.created,
      updated: this.updated,
    }
  }
}
