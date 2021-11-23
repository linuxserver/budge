import { AccountTypes } from '../entities/Account'
import { DataResponse } from '../controllers/responses'

/**
 * @example {
 *   id: "abc123",
 *   budgetId: "abc456",
 *   name: "My Budget",
 *   type: 0,
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface AccountModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Parent budget ID
   */
  budgetId: string

  /**
   * Budget name
   */
  name: string

  /**
   * Account type
   */
  type: AccountTypes

  /**
   * Account balance (cleared + uncleared)
   */
  balance: number

  /**
   * Cleared account balance
   */
  cleared: number

  /**
   * Pending account balance
   */
  uncleared: number

  /**
   * Datetime user was created
   */
  created: string

  /**
   * Datetime user was updated
   */
  updated: string
}

/**
 * @example {
 *  "name": "My Budget",
 *  "type": 0,
 * }
 */
export interface AccountRequest {
  name: string,
  type: AccountTypes,
}

/**
 * @example {
 *  "name": "My Budget",
 *  "type": 0,
 *  "initialBalance": 100,
 * }
 */
export interface CreateAccountRequest {
  name: string,
  type: AccountTypes,
  balance: number,
}

export type AccountResponse = DataResponse<AccountModel>

export type AccountsResponse = DataResponse<AccountModel[]>
