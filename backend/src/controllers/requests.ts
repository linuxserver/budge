import express from 'express'
import { User } from '../entities/User'

export interface ExpressRequest extends express.Request {
  user?: User
}

/**
 * @example {
 *  "email": "alex\u0040example.com",
 *  "password": "supersecurepassword"
 * }
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * @example {
 *  "email": "alex\u0040example.com",
 *  "password": "supersecurepassword"
 * }
 */
export interface UserCreateRequest {
  email: string
  password: string
}

/**
 * @example {
 *  "currentPassword": "oldPassword",
 *  "password": "myUpdatedPassword"
 * }
 */
export interface UserUpdateRequest {
  /**
   * Updated email address
   */
  email?: string

  /**
   * Current password if updating to a new password
   */
  currentPassword?: string

  /**
   * New password
   */
  password?: string
}
