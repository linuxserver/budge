import { DataResponse } from '../controllers/responses'
import { CategoryMonthModel } from './category_month'

/**
 * @example {
 *   id: "abc123",
 *   budgetId: "def456",
 *   month: "2021-10-01",
 *   income: 0,
 *   budgeted: 0,
 *   activity: 0,
 *   toBeBudgetd: 0,
 *   created: "2011-10-05T14:48:00.000Z",
 *   updated: "2011-10-05T14:48:00.000Z",
 * }
 */
export interface BudgetMonthModel {
  /**
   * Unique ID
   */
  id: string

  /**
   * Budget ID
   */
  budgetId: string

  /**
   * Date string
   */
  month: string

  /**
   * Month income
   */
  income: number

  /**
   * Amount budgeted
   */
  budgeted: number

  /**
   * Activity amount
   */
  activity: number

  /**
   * Amount left to budget
   */
  toBeBudgeted: number

  /**
   * Date created
   */
  created: string

  /**
   * Date updated
   */
  updated: string
}

export interface BudgetMonthWithCategoriesModel extends BudgetMonthModel {
  /**
   * All categories for this month
   */
  categories: CategoryMonthModel[]
}

export type BudgetMonthResponse = DataResponse<BudgetMonthModel>

export type BudgetMonthsResponse = DataResponse<BudgetMonthModel[]>

export type BudgetMonthWithCategoriesResponse = DataResponse<BudgetMonthWithCategoriesModel>

export type BudgetMonthsWithCategoriesResponse = DataResponse<BudgetMonthWithCategoriesModel[]>
