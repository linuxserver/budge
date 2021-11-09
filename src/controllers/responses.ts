export interface BaseResponse {
  message?: string
}

export interface DataResponse<T> extends BaseResponse {
  data?: T
}

/**
 * @example {
 *   message: "Not allowed",
 * }
 */
export interface ErrorResponse {
  /**
   * Message of the error
   */
  message: string
}
