import { Get, Put, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account, AccountTypes } from '../entities/Account'
import { AccountResponse, AccountsResponse } from '../schemas/account'
import { AccountRequest } from '../schemas/account'
import { CategoryGroup, CreditCardGroupName } from '../entities/CategoryGroup'
import { Category } from '../entities/Category'

@Tags('Accounts')
@Route('budgets/{budgetId}/accounts')
export class AccountsController extends Controller {
  /**
   * Create a new account
   */
  @Security('jwtRequired')
  @Post()
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
    @Path() budgetId: string,
    @Body() requestBody: AccountRequest,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const account: Account = Account.create({
        ...requestBody,
        budgetId,
      })
      await account.save()

      if (account.type === AccountTypes.CreditCard) {
        // Create CC payments category if it doesn't exist
        const ccGroup = await CategoryGroup.findOne({ budgetId, name: CreditCardGroupName }) || CategoryGroup.create({ budgetId, name: CreditCardGroupName })
        await ccGroup.save()

        const paymentCategory = Category.create({
          budgetId,
          categoryGroupId: ccGroup.id,
          name: account.name,
        })
        await paymentCategory.save()
      }

      return {
        message: 'success',
        data: await account.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find all budget accounts
   */
  @Security('jwtRequired')
  @Get()
  @Example<AccountsResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        budgetId: 'def456',
        name: 'Checking Account',
        type: AccountTypes.Bank,
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      }
    ],
  })
  public async getAccounts(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<AccountsResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const accounts = await Account.find({ where: { budgetId }})

      return {
        message: 'success',
        data: await Promise.all(accounts.map(account => account.sanitize())),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find a single budget account
   */
  @Security('jwtRequired')
  @Get("{accountId}")
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
      name: 'Checking Account',
      type: AccountTypes.Bank,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    }
  })
  public async getAccount(
    @Path() budgetId: string,
    @Path() accountId: string,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await Account.findOne(accountId)

      return {
        message: 'success',
        data: await account.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
