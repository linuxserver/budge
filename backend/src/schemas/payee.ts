import { DataResponse } from '../controllers/responses'

/**
 * @example {
 *   id: "abc123",
 *   budgetId: "abc456",
 *   name: "Random Store Name",
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface PayeeModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Budget name
   */
  name: string

  /**
   * Account associated with the payee for transfers
   */
  transferAccountId: string | null

  /**
   * Flag that payee is for internal use only
   */
  internal: boolean

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
 *  "name": "Random Store Name",
 * }
 */
export interface PayeeRequest {
  name: string
}

export type PayeeResponse = DataResponse<PayeeModel>

export type PayeesResponse = DataResponse<PayeeModel[]>
