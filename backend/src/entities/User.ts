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
