import { BudgetModel } from '../models/Budget'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  AfterInsert,
  PrimaryColumn,
  BeforeInsert,
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

export class Base extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // @BeforeInsert()
  // private setId(): void {
  //   if (!this.id) {
  //     this.id = uuidv4()
  //   }
  // }
}
