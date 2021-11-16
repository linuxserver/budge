import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
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
import { UserModel } from '../schemas/user'
import { Budget } from './Budget'

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  @Index()
  email: string

  @Column()
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

  public checkPassword(this: User, password: string): boolean {
    return bcrypt.compareSync(password, this.password)
  }

  public generateJWT(this: User): string {
    return jwt.sign({ userId: this.id, email: this.email, timestamp: Date.now() }, config.jwtSecret, {
      expiresIn: '1h',
    })
  }

  public async sanitize(): Promise<UserModel> {
    return {
      id: this.id,
      email: this.email,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
    }
  }

  public static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10)
  }
}
