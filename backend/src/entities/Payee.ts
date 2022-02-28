import { Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { Account } from './Account'
import { PayeeModel } from '../models/Payee'
import { Transaction } from './Transaction'

@Entity('payees')
export class Payee {
}
