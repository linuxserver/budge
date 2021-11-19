import { Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { Account } from '.'
import { PayeeModel } from '../schemas/payee'
import { Transaction } from './Transaction'

@Entity('payees')
export class Payee extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  budgetId: string

  @Column({ nullable: true })
  transferAccountId: string

  @Column()
  name: string

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  @OneToOne(() => Account, account => account.transferPayee)
  @JoinColumn()
  transferAccount: Promise<Account>;

  /**
   * Has many transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Promise<Transaction[]>

  public async sanitize(): Promise<PayeeModel> {
    return {
      id: this.id,
      transferAccountId: this.transferAccountId,
      name: this.name,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
