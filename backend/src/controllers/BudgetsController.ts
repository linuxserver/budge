import { Get, Put, Route, Path, Security, Post, Body, Controller, Tags, Request, Example, Query } from 'tsoa'
import { Budget } from '../entities/Budget'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { BudgetRequest, BudgetResponse, BudgetsResponse } from '../models/Budget'
import { AccountTypes } from '../entities/Account'
import { BudgetMonth } from '../entities/BudgetMonth'
import { BudgetMonthsResponse, BudgetMonthWithCategoriesResponse } from '../models/BudgetMonth'
import { getCustomRepository, getRepository, MoreThanOrEqual } from 'typeorm'
import { BudgetMonths } from '../repositories/BudgetMonths'
import { getMonthStringFromNow } from '../utils'
import {prisma} from '../prisma'
import { CategoryMonth } from '../entities/CategoryMonth'

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
        name: 'My Budget',
        toBeBudgeted: 0,
        accounts: [
          {
            id: 'def123',
            budgetId: 'abc123',
            transferPayeeId: 'xyz789',
            name: 'Checking Account',
            type: AccountTypes.Bank,
            balance: 0,
            cleared: 0,
            uncleared: 0,
            order: 0,
            created: new Date('2011-10-05T14:48:00.000Z'),
            updated: new Date('2011-10-05T14:48:00.000Z'),
          },
        ],
        created: new Date('2011-10-05T14:48:00.000Z'),
        updated: new Date('2011-10-05T14:48:00.000Z'),
      },
      {
        id: 'abc456',
        name: 'Another Budget',
        toBeBudgeted: 0,
        accounts: [],
        created: new Date('2011-10-05T14:48:00.000Z'),
        updated: new Date('2011-10-05T14:48:00.000Z'),
      },
    ],
  })
  public async getBudgets(@Request() request: ExpressRequest): Promise<BudgetsResponse | ErrorResponse> {
    try {
      const budgets = await prisma.budget.findMany({
        where: { userId: request.user.id },
        include: { accounts: true },
      })
      return {
        message: 'success',
        data: budgets,
      }
    } catch (err) {
      console.log(err)
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
      name: 'My Budget',
      toBeBudgeted: 0,
      accounts: [],
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async createBudget(
    @Body() requestBody: BudgetRequest,
    @Request() request: ExpressRequest,
  ): Promise<BudgetResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.create({
        data: {
          ...requestBody,
          userId: request.user.id,
        },
        include: {
          accounts: true,
        },
      })

      return {
        message: 'success',
        data: budget,
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Retrieve an existing budget
   */
  @Security('jwtRequired')
  @Get('{id}')
  @Example<BudgetResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      name: 'My Budget',
      toBeBudgeted: 0,
      accounts: [],
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async getBudget(
    @Path() id: string,
    @Request() request: ExpressRequest,
  ): Promise<BudgetResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id }, include: { accounts: true } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      // Ensure that a budget month for next month exists
      // @TODO: create ALL budget months since the last one - what if someone hasn't logged in for several months?
      await BudgetMonth.findOrCreate(id, getMonthStringFromNow(1))

      return {
        message: 'success',
        data: budget,
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
      name: 'My Budget',
      toBeBudgeted: 0,
      accounts: [],
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async editBudget(
    @Path() id: string,
    @Body() requestBody: BudgetRequest,
    @Request() request: ExpressRequest,
  ): Promise<BudgetResponse | ErrorResponse> {
    try {
      let budget = await prisma.budget.findUnique({ where: { id }, include: { accounts: true } })

      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      Object.assign(budget, requestBody)
      await prisma.budget.update({ where: { id: budget.id }, data: requestBody })

      return {
        message: 'success',
        data: budget,
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Get all budget months
   */
  @Security('jwtRequired')
  @Get('{budgetId}/months')
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
        underfunded: 0,
        created: new Date('2011-10-05T14:48:00.000Z'),
        updated: new Date('2011-10-05T14:48:00.000Z'),
      },
    ],
  })
  public async getBudgetMonths(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
    @Query() from?: string,
  ): Promise<BudgetMonthsResponse | ErrorResponse> {
    let budget = await prisma.budget.findUnique({ where: { id: budgetId } })

    if (!budget || budget.userId !== request.user.id) {
      this.setStatus(404)
      return {
        message: 'Not found',
      }
    }

    const budgetMonths = await prisma.budgetMonth.findMany({
      where: {
        budgetId,
        ...(from && { month: { gte: from } }),
      },
    })

    return {
      message: 'success',
      data: budgetMonths,
    }
  }

  /**
   * Get budget month
   */
  @Security('jwtRequired')
  @Get('{budgetId}/months/{month}')
  @Example<BudgetMonthWithCategoriesResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      month: '2021-10-01',
      income: 0,
      activity: 0,
      budgeted: 0,
      underfunded: 0,
      categories: [
        {
          id: 'jkl789',
          categoryId: 'ghi135',
          month: '2021-10-01',
          budgeted: 0,
          activity: 0,
          balance: 0,
          created: new Date('2011-10-05T14:48:00.000Z'),
          updated: new Date('2011-10-05T14:48:00.000Z'),
        },
      ],
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async getBudgetMonth(
    @Path() budgetId: string,
    @Path() month: string,
    @Request() request: ExpressRequest,
  ): Promise<BudgetMonthWithCategoriesResponse | ErrorResponse> {
    let budget = await prisma.budget.findUnique({ where: { id: budgetId } })

    if (!budget || budget.userId !== request.user.id) {
      this.setStatus(404)
      return {
        message: 'Not found',
      }
    }

    const existingBudgetMonth = await prisma.budgetMonth.findFirst({
      where: { budgetId, month },
      include: { categoryMonths: true },
    })
    if (existingBudgetMonth) {
      return {
        message: 'success',
        data: {
          ...existingBudgetMonth,
          categories: existingBudgetMonth.categoryMonths,
        },
      }
    }

    // If we don't have a budget month, then no transactions were created against that month,
    // so send down an 'empty' budget month for the UI to work with
    await prisma.budgetMonth.create({
      data: {
        budgetId,
        month,
      },
    })

    const budgetMonth = await prisma.budgetMonth.findFirst({
      where: { budgetId, month },
      include: { categoryMonths: true },
    })

    return {
      message: 'success',
      data: {
        ...budgetMonth,
        categories: budgetMonth.categoryMonths,
      },
    }
  }
}
