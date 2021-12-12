import { BudgetModel } from '../models/Budget'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  AfterInsert,
} from 'typeorm'
import { User } from './User'
import { Account } from './Account'
import { CategoryGroup } from './CategoryGroup'
import { Category } from './Category'
import { BudgetMonth } from './BudgetMonth'
import { Transaction } from './Transaction'
import { getMonthString, getMonthStringFromNow } from '../utils'
import { Payee } from './Payee'
import { Dinero } from '@dinero.js/core'
import { dinero } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { CurrencyDBTransformer } from '../models/Currency'
import { Base } from './Base'

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', nullable: false })
  userId: string

  @Column({ type: 'varchar' })
  name: string

  @Column({
    type: 'int',
    default: 0,
    transformer: new CurrencyDBTransformer(),
  })
  toBeBudgeted: Dinero<number> = dinero({ amount: 0, currency: USD })

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  /**
   * Belongs to a user
   */
  @ManyToOne(() => User, user => user.budgets)
  user: User

  /**
   * Has many accounts
   */
  @OneToMany(() => Account, account => account.budget, { cascade: true })
  accounts: Promise<Account[]>

  /**
   * Has many categories
   */
  @OneToMany(() => Category, category => category.budget, { cascade: true })
  categories: Promise<Category[]>

  /**
   * Has many category groups
   */
  @OneToMany(() => CategoryGroup, categoryGroup => categoryGroup.budget, { cascade: true })
  categoryGroups: Promise<CategoryGroup[]>

  /**
   * Has many budget months
   */
  @OneToMany(() => BudgetMonth, budgetMonth => budgetMonth.budget, { cascade: true })
  months: Promise<BudgetMonth[]>

  /**
   * Has many budget transactions
   */
  @OneToMany(() => Transaction, transaction => transaction.budget, { cascade: true })
  transactions: Promise<Transaction[]>

  public async toResponseModel(): Promise<BudgetModel> {
    return {
      id: this.id,
      name: this.name,
      toBeBudgeted: this.toBeBudgeted.toJSON().amount,
      accounts: await Promise.all((await this.accounts).map(account => account.toResponseModel())),
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }

  public async getMonths(): Promise<string[]> {
    return (await this.months).map(month => month.month).sort()
  }
}
