import { Get, Put, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { BudgetRequest, BudgetResponse, BudgetsResponse } from '../schemas/budget'
import { AccountTypes } from '../entities/Account'
import { BudgetMonth } from '../entities/BudgetMonth'
import { BudgetMonthsResponse, BudgetMonthWithCategoriesResponse } from '../schemas/budget_month'
import { getMonthString, getMonthStringFromNow } from '../utils'

@Tags('Budgets')
@Route('budgets')
export class BudgetsController extends Controller {
  /**
   * Get all active user's budgets
   */
  @Security('jwtRequired')
  @Get()
  @Example<BudgetsResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        userId: 'def456',
        name: 'My Budget',
        accounts: [
          {
            id: "def123",
            budgetId: "abc123",
            name: "Checking Account",
            type: AccountTypes.Bank,
            created: '2011-10-05T14:48:00.000Z',
            updated: '2011-10-05T14:48:00.000Z',
          }
        ],
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      },
      {
        id: 'abc456',
        userId: 'def456',
        name: 'Another Budget',
        accounts: [],
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      },
    ],
  })
  public async getBudgets(@Request() request: ExpressRequest): Promise<BudgetsResponse | ErrorResponse> {
    try {
      const budgets = await Budget.find({ where: { userId: request.user.id }, relations: ["accounts"] })
      return {
        message: 'success',
        data: await Promise.all(budgets.map(budget => budget.sanitize())),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Create a new budget
   */
  @Security('jwtRequired')
  @Post()
  @Example<BudgetResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      userId: 'def456',
      name: 'My Budget',
      accounts: [],
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createBudget(
    @Body() requestBody: BudgetRequest,
    @Request() request: ExpressRequest,
  ): Promise<BudgetResponse | ErrorResponse> {
    try {
      const budget: Budget = Budget.create({ ...requestBody })
      budget.user = request.user
      await budget.save()

      const today = getMonthString()
      const prevMonth = getMonthStringFromNow(-1)
      const nextMonth = getMonthStringFromNow(1)

      await Promise.all([prevMonth, today, nextMonth].map(month => {
        return BudgetMonth.create({ budgetId: budget.id, month }).save()
      }))

      return {
        message: 'success',
        data: await budget.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Edit an existing budget
   */
  @Security('jwtRequired')
  @Put('{id}')
  @Example<BudgetResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      userId: 'def456',
      name: 'My Budget',
      accounts: [],
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async editBudget(
    @Path() id: string,
    @Body() requestBody: BudgetRequest,
    @Request() request: ExpressRequest,
  ): Promise<BudgetResponse | ErrorResponse> {
    try {
      let budget: Budget = await Budget.findOne(id)

      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      budget = await Budget.merge(budget, { ...requestBody })

      return {
        message: 'success',
        data: await budget.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Get all budget months
   */
  @Security('jwtRequired')
  @Get("{budgetId}/months")
  @Example<BudgetMonthsResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        budgetId: 'def456',
        month: '2021-10-01',
        income: 0,
        activity: 0,
        budgeted: 0,
        toBeBudgeted: 0,
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      }
    ]
  })
  public async getBudgetMonths(
    @Path() budgetId: string,
    @Request() request: ExpressRequest
  ): Promise<BudgetMonthsResponse | ErrorResponse> {
    let budget: Budget = await Budget.findOne(budgetId)

    if (!budget || budget.userId !== request.user.id) {
      this.setStatus(404)
      return {
        message: 'Not found',
      }
    }

    const budgetMonths = await BudgetMonth.find({ budgetId })

    // Create budget months for current, previous, and next month
    // @TODO: I don't know if this is needed.
    // await Promise.all([-1, 0, 1].map(monthsAway => {
    //   const month = getMonthFromNow(monthsAway)
    //   if (budgetMonths.filter(budgetMonth => budgetMonth.month === month).length === 0) {
    //     const budgetMonth = BudgetMonth.create({
    //       budgetId: budget.id,
    //       month: month,
    //     })

    //     return budgetMonth.save()
    //   }
    // }))

    return {
      message: 'success',
      data: await Promise.all(budgetMonths.map(budgetMonth => budgetMonth.sanitize())),
    }
  }

  /**
   * Get budget month
   */
  @Security('jwtRequired')
  @Get("{budgetId}/months/{month}")
  @Example<BudgetMonthWithCategoriesResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      month: '2021-10-01',
      income: 0,
      activity: 0,
      budgeted: 0,
      toBeBudgeted: 0,
      categories: [
        {
          id: "jkl789",
          categoryId: "ghi135",
          month: "2021-10-01",
          budgeted: 0,
          activity: 0,
          balance: 0,
          created: '2011-10-05T14:48:00.000Z',
          updated: '2011-10-05T14:48:00.000Z',
        }
      ],
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    }
  })
  public async getBudgetMonth(
    @Path() budgetId: string,
    @Path() month: string,
    @Request() request: ExpressRequest
  ): Promise<BudgetMonthWithCategoriesResponse | ErrorResponse> {
    let budget: Budget = await Budget.findOne(budgetId)

    if (!budget || budget.userId !== request.user.id) {
      this.setStatus(404)
      return {
        message: 'Not found',
      }
    }

    let budgetMonth = await BudgetMonth.findOne({ budgetId, month }, { relations: ['categories'] })
    if (!budgetMonth) {
      // If we don't have a budget month, then no transactions were created against that month,
      // so send down an 'empty' budget month for the UI to work with
      budgetMonth = BudgetMonth.create({
        budgetId,
        month,
      })
      budgetMonth.categories = []
    }

    return {
      message: 'success',
      data: {
        ...await budgetMonth.sanitize(),
        categories: await Promise.all((await budgetMonth.categories).map(categoryMonth => categoryMonth.sanitize())),
      }
    }
  }
}
