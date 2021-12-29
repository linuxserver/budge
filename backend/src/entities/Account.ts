import { AccountModel } from '../models/Account'
import {
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { Budget } from './Budget'
import { Transaction } from './Transaction'
import { Payee } from './Payee'
import { Dinero } from '@dinero.js/core'
import { dinero } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'

export enum AccountTypes {
  Bank,
  CreditCard,
  Tracking,
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  budgetId: string

  @Column({ type: 'varchar', nullable: true })
  transferPayeeId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({ type: 'int' })
  type: AccountTypes

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  balance: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  cleared: Dinero<number> = dinero({ amount: 0, currency: USD })

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  uncleared: Dinero<number> = dinero({ amount: 0, currency: USD })

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a budget
   */
  @ManyToOne(() => Budget, budget => budget.accounts)
  budget: Promise<Budget>

  /**
   * Has many transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Promise<Transaction[]>

  /**
   * Can have one payee
   */
  @OneToOne(() => Payee, payee => payee.transferAccount)
  @JoinColumn()
  transferPayee: Promise<Payee>

  public getUpdatePayload() {
    return {
      id: this.id,
      budgetId: this.budgetId,
      transferPayeeId: this.transferPayeeId,
      name: this.name,
      type: this.type,
      balance: {...this.balance},
      cleared: {...this.cleared},
      uncleared: {...this.uncleared},
    }
  }

  public async toResponseModel(): Promise<AccountModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      transferPayeeId: this.transferPayeeId,
      name: this.name,
      type: this.type,
      balance: this.balance.toJSON().amount,
      cleared: this.cleared.toJSON().amount,
      uncleared: this.uncleared.toJSON().amount,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
