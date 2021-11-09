import { AccountModel } from '../schemas/account'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { Budget } from './Budget'
import { Transaction } from './Transaction'

export enum AccountTypes {
  Bank,
  CreditCard,
  Payee,
}

@Entity('accounts')
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'string', nullable: false })
  budgetId: string

  @Column()
  name: string

  @Column()
  type: AccountTypes

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.accounts)
  budget: Budget

  /**
   * Has many transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Transaction[]

  public sanitize(): AccountModel {
    return {
      id: this.id,
      budgetId: this.budgetId,
      name: this.name,
      type: this.type,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
