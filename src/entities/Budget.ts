import { BudgetModel } from '../schemas/budget'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { User } from './User'
import { Account } from './Account'
import { CategoryGroup } from './CategoryGroup'

@Entity('budgets')
export class Budget extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'string', nullable: false })
  userId: string

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
  accounts: Account[]

  /**
   * Has many category groups
   */
  @OneToMany(() => CategoryGroup, categoryGroup => categoryGroup.budget)
  categoryGroups: CategoryGroup[]

  public sanitize(): BudgetModel {
    return {
      id: this.id,
      name: this.name,
      accounts: this.accounts.map(account => account.sanitize()),
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
