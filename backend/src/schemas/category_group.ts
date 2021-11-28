import { DataResponse } from '../controllers/responses'
import { CategoryModel } from './category'

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
   * Child categories
   */
  categories: CategoryModel[]

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
 *  "categoryGroupId": "abc123",
 *  "name": "Emergency Fund",
 *  "categories": []
 * }
 */
export interface CategoryGroupRequest {
  name: string
}

export type CategoryGroupResponse = DataResponse<CategoryGroupModel>

export type CategoryGroupsResponse = DataResponse<CategoryGroupModel[]>
