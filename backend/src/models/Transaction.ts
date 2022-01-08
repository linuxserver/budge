import { DataResponse } from '../controllers/responses'
import { TransactionStatus } from '../entities/Transaction'

/**
 * @example {
 *   id: "abc123",
 *   accountId: "def456",
 *   name: "My Budget",
 *   type: 0,
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface TransactionModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Parent account ID
   */
  accountId: string

  /**
   * Payee account ID
   */
  payeeId: string

  /**
   * Category ID
   */
  categoryId: string | null

  /**
   * Transaction amount
   */
  amount: number

  /**
   * Date of the transaction
   */
  date: string

  /**
   * Transaction notes / memo
   */
  memo: string

  /**
   * Transaction status
   */
  status: TransactionStatus

  /**
   * Datetime transaction was created
   */
  created: string

  /**
   * Datetime transaction was updated
   */
  updated: string
}

/**
 * @example {
 *  "name": "My Budget",
 * }
 */
export interface TransactionRequest {
  id?: string
  accountId: string
  payeeId: string
  amount: number
  date: string
  memo?: string
  categoryId?: string | null
  status: TransactionStatus
}

/**
 * @example {
 *  "transactions": [
 *    {
 *      "name": "My Budget",
 *    }
 *  ],
 * }
 */
 export interface TransactionsRequest {
  transactions: TransactionRequest[]
}

/**
 * @example {
 *   ids: ["abc123"]
 * }
 */
export interface TransactionsDeleteRequest {
  ids: string[]
}

export type TransactionResponse = DataResponse<TransactionModel>

export type TransactionsResponse = DataResponse<TransactionModel[]>
