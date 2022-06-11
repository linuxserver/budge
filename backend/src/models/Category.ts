import { AccountTypes } from '../entities/Account'
import { DataResponse } from '../controllers/responses'
import { TransactionStatus } from '../entities/Transaction'
import { TransactionModel } from './Transaction'
import { CategoryMonthModel } from './CategoryMonth'

/**
 * @example {
 *   id: "abc123",
 *   categoryGroupId: "def456",
 *   name: "My Budget",
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface CategoryModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Group ID
   */
  categoryGroupId: string

  /**
   * ID of tracking account (for CCs)
   */
  trackingAccountId: string

  /**
   * Name
   */
  name: string

  /**
   * Inflow category flag
   */
  inflow: boolean

  /**
   * Locked flag
   */
  locked: boolean

  /**
   * Category ordering
   */
  order: number

  /**
   * Hidden flag
   */
  hidden: boolean

  /**
   * Datetime transaction was created
   */
  created: Date

  /**
   * Datetime transaction was updated
   */
  updated: Date
}

/**
 * @example {
 *  "categoryGroupId": "abc123",
 *  "name": "Emergency Fund",
 * }
 */
export interface CategoryRequest {
  categoryGroupId: string
  name: string
  order: number
  hidden?: boolean
}

export interface DeleteCategoryRequest {
  newCategoryId: string
}

export interface DeleteCategoryModel {
  /**
   * All updated transactions
   */
  transactions: TransactionModel[]

  /**
   * All updated category months
   */
  categoryMonths: CategoryMonthModel[]
}

export type CategoryResponse = DataResponse<CategoryModel>

export type DeleteCategoryResponse = DataResponse<DeleteCategoryModel>
