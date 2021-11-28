import { AccountModel } from '../schemas/account'
import {
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  AfterInsert,
  BeforeUpdate,
} from 'typeorm'
import { Budget } from './Budget'
import { Transaction } from './Transaction'
import { Payee } from './Payee'
import { Category } from './Category'
import { CategoryGroup, CreditCardGroupName } from './CategoryGroup'

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

  @Column({ type: 'int' })
  balance: number = 0

  @Column({ type: 'int' })
  cleared: number = 0

  @Column({ type: 'int' })
  uncleared: number = 0

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
  transferPayee: Promise<Payee>

  @AfterInsert()
  private async createCreditCardCategory(): Promise<void> {
    if (this.type === AccountTypes.CreditCard) {
      // Create CC payments category if it doesn't exist
      const ccGroup =
        (await CategoryGroup.findOne({
          budgetId: this.budgetId,
          name: CreditCardGroupName,
        })) ||
        CategoryGroup.create({
          budgetId: this.budgetId,
          name: CreditCardGroupName,
          locked: true,
        })

      await ccGroup.save()

      // Create payment tracking category
      const paymentCategory = Category.create({
        budgetId: this.budgetId,
        categoryGroupId: ccGroup.id,
        trackingAccountId: this.id,
        name: this.name,
        locked: true,
      })
      await paymentCategory.save()
    }
  }

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

  @BeforeUpdate()
  private calculateBalance(): void {
    this.balance = this.cleared + this.uncleared
  }

  public async toResponseModel(): Promise<AccountModel> {
    return {
      id: this.id,
      budgetId: this.budgetId,
      name: this.name,
      type: this.type,
      balance: this.balance,
      cleared: this.cleared,
      uncleared: this.uncleared,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }
}
