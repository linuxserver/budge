import { BudgetModel } from '../schemas/budget'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { User } from './User'
import { Account } from './Account'
import { CategoryGroup } from './CategoryGroup'
import { Category } from './Category'
import { BudgetMonth } from './BudgetMonth'

@Entity('budgets')
export class Budget extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'string', nullable: false })
  userId: string

  @Column()
  name: string

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
  @OneToMany(() => Account, account => account.budget)
  accounts: Promise<Account[]>

  /**
   * Has many categories
   */
  @OneToMany(() => Category, category => category.budget)
  categories: Promise<Category[]>

  /**
   * Has many category groups
   */
  @OneToMany(() => CategoryGroup, categoryGroup => categoryGroup.budget)
  categoryGroups: Promise<CategoryGroup[]>

  /**
   * Has many budget months
   */
  @OneToMany(() => BudgetMonth, budgetMonth => budgetMonth.budget)
  months: Promise<BudgetMonth[]>

  public async sanitize(): Promise<BudgetModel> {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      accounts: await Promise.all((await this.accounts).map(account => account.sanitize())),
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }

  public async getMonths(): Promise<string[]> {
    return (await this.months).map(month => month.month).sort()
  }
}
