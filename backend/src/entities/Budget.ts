import { BudgetModel } from '../models/Budget'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, DeepPartial } from 'typeorm'
import { User } from './User'
import { Account } from './Account'
import { CategoryGroup } from './CategoryGroup'
import { Category } from './Category'
import { BudgetMonth } from './BudgetMonth'
import { Transaction } from './Transaction'

@Entity('budgets')
export class Budget {
  public getUpdatePayload() {
    // return {
    //   id: this.id,
    //   userId: this.userId,
    //   name: this.name,
    //   toBeBudgeted: this.toBeBudgeted || 0,
    // }
  }
}
