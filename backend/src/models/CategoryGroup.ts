import { DataResponse } from '../controllers/responses'
import { CategoryModel } from './Category'

/**
 * @example {
 *   id: "abc123",
 *   budgetId: "def456",
 *   name: "Expenses",
 *   categories: [],
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface CategoryGroupModel {
  /**
   * Unique id
   */
  id: string

  /**
   * Budget ID
   */
  budgetId: string

  /**
   * Name
   */
  name: string

  /**
   * Flag for internal use only
   */
  internal: boolean

  /**
   * Flag for locked accounts - prevents renaming and other actions
   */
  locked: boolean

  /**
   * Category group ordering
   */
  order: number

  /**
   * Child categories
   */
  categories: CategoryModel[]

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
 *  "order": 0,
 * }
 */
export interface CategoryGroupRequest {
  name: string
  order: number
}

export type CategoryGroupResponse = DataResponse<CategoryGroupModel>

export type CategoryGroupsResponse = DataResponse<CategoryGroupModel[]>
