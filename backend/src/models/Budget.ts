import { DataResponse } from '../controllers/responses'
import { AccountModel } from './Account'

/**
 * @example {
 *   id: "abc123",
 *   name: "My Budget",
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface BudgetModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Budget name
   */
  name: string

  /**
   * Currency setting of the budget
   */
  currency: string

  /**
   * Budget's accounts
   */
  accounts: AccountModel[]

  /**
   * Datetime user was created
   */
  created: Date

  /**
   * Datetime user was updated
   */
  updated: Date
}

/**
 * @example {
 *  "name": "My Budget",
 *  "currency": "USD",
 * }
 */
export interface BudgetRequest {
  name: string
  currency?: string
}

export type BudgetResponse = DataResponse<BudgetModel>

export type BudgetsResponse = DataResponse<BudgetModel[]>
