import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  AfterLoad,
  BeforeUpdate,
  BeforeInsert,
  Index,
  CreateDateColumn,
  OneToMany,
} from 'typeorm'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from '../config'
import { UserModel } from '../models/User'
import { Budget } from './Budget'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  @Index({ unique: true })
  email: string

  @Column({ type: 'varchar' })
  password: string

  private currentPassword: string

  @OneToMany(() => Budget, budget => budget.user)
  budgets: Budget[]

  @CreateDateColumn()
  created: Date

  @CreateDateColumn()
  updated: Date

  @AfterLoad()
  private storeCurrentPassword(): void {
    this.currentPassword = this.password
  }

  @BeforeInsert()
  @BeforeUpdate()
  private encryptPassword(): void {
    if (this.currentPassword !== this.password) {
      this.password = User.hashPassword(this.password)
    }
  }

  public static checkPassword(currentPassword: string, comparison: string): boolean {
    return bcrypt.compareSync(comparison, currentPassword)
  }

  public static generateJWT(user: any): string {
    return jwt.sign({ userId: user.id, email: user.email, timestamp: Date.now() }, config.jwtSecret, {
      expiresIn: '1h',
    })
  }

  public static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10)
  }
}
