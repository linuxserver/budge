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
import { prisma } from '../prisma'
import BaseEntity from './BaseEntity'
import { PrismaClient } from '@prisma/client'

export enum AccountTypes {
  Bank,
  CreditCard,
  Tracking,
}

export const Accounts = Object.assign(prisma.account, {
  sort(accounts: any[]): any[] {
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
  },
})
