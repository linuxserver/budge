import { Get, Put, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest, UserCreateRequest, UserUpdateRequest } from './requests'
import { ErrorResponse } from './responses'
import { BudgetRequest, BudgetResponse, BudgetsResponse } from '../schemas/budget'
import { Account, AccountTypes } from '../entities/Account'
import { AccountResponse } from '../schemas/account'
import { AccountRequest } from '../schemas/account'

@Tags('Budgets')
@Route('budgets')
export class BudgetController extends Controller {
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
      console.log(budgets)
      return {
        message: 'success',
        data: budgets.map(budget => budget.sanitize()),
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

      return {
        message: 'success',
        data: budget.sanitize(),
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
      budget = await Budget.merge(budget, { ...requestBody })

      return {
        message: 'success',
        data: budget.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Create a new account
   */
  @Security('jwtRequired')
  @Post("{id}/accounts")
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      name: 'Checking Account',
      type: AccountTypes.Bank,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createAccount(
    @Path() id: string,
    @Body() requestBody: AccountRequest,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const account: Account = Account.create({
        ...requestBody,
        budgetId: id,
      })
      await account.save()

      return {
        message: 'success',
        data: account.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
