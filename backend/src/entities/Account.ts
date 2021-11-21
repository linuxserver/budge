import { AccountModel } from '../schemas/account'
import { Entity, OneToOne, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, AfterInsert, BeforeInsert } from 'typeorm'
import { Budget } from './Budget'
import { Transaction } from './Transaction'
import { Payee } from './Payee'

export enum AccountTypes {
  Bank,
  CreditCard,
}

@Entity('accounts')
export class Account extends BaseEntity {
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
  @OneToOne(() => Payee, payee => payee.transferAccount, { cascade: true })
  @JoinColumn()
  transferPayee: Promise<Payee>;

  @AfterInsert()
  private async createAccountPayee() {
    const payee = Payee.create({
      budgetId: this.budgetId,
      name: `Transfer : ${this.name}`,
      transferAccountId: this.id,
    })

    // @TODO: I wish there was a better way around this
    await payee.save()
    this.transferPayeeId = payee.id
    await this.save()
  }

  public async toResponseModel(): Promise<AccountModel> {
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
