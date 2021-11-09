import { DataResponse } from '../controllers/responses'

/**
 * @example {
 *   id: "c3n8327rp8arhj8",
 *   email: "alex@example.com",
 *   name: "John Doe",
 *   role: 1,
 * }
 */
export interface UserModel {
  /**
   * Unique id
   */
  id?: string

  /**
   * User's email
   */
  email: string

  /**
   * Datetime user was created
   */
  created: string

  /**
   * Datetime user was updated
   */
  updated: string
}

export type UserResponse = DataResponse<UserModel>

export interface LoginResponse extends UserResponse {
  /**
   * JSON Web Token for authenticating requests
   */
  token: string
}

export interface LogoutResponse extends UserResponse {
}
