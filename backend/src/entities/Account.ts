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
  })
  balance: number = 0

  @Column({
    type: 'int',
    default: 0,
  })
  cleared: number = 0

  @Column({
    type: 'int',
    default: 0,
  })
  uncleared: number = 0

  @Column({ type: 'int', default: 0 })
  order: number = 0

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

  public static sort(accounts: any[]): any[] {
    accounts = accounts.sort((a, b) => {
      if (a.order === b.order) {
        return a.name > b.name ? -1 : 1
      }
      return a.order < b.order ? -1 : 1
    })

    return accounts.map((group, index) => {
      group.order = index
      return group
    })
  }
}
