import {
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  OneToMany,
} from 'typeorm'
import { Account } from '.'
import { PayeeModel } from '../models/Payee'
import { Transaction } from './Transaction'

@Entity('payees')
export class Payee extends BaseEntity {
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

  public async toResponseModel(): Promise<PayeeModel> {
    return {
      id: this.id,
      transferAccountId: this.transferAccountId,
      name: this.name,
      internal: this.internal,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
