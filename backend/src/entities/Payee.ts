import {
  Entity,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  OneToMany,
  PrimaryColumn,
  BeforeInsert,
} from 'typeorm'
import { Account } from '.'
import { PayeeModel } from '../models/Payee'
import { Transaction } from './Transaction'
import { Base } from './Base'

@Entity('payees')
export class Payee extends Base {
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
  @OneToMany(() => Transaction, transaction => transaction.account, { cascade: true })
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
