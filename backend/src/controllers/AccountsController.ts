import { Get, Put, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account, AccountTypes } from '../entities/Account'
import { AccountResponse, AccountsResponse, CreateAccountRequest } from '../schemas/account'
import { AccountRequest } from '../schemas/account'
import { Payee } from '../entities/Payee'
import { Transaction } from '../entities/Transaction'
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
      balance: 0,
      cleared: 0,
      uncleared: 0,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createAccount(
    @Path() budgetId: string,
    @Body() requestBody: CreateAccountRequest,
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

      const account: Account = Account.create({
        ...requestBody,
        budgetId,
      })
      await account.save()

      // Create a transaction for the starting balance of the account
      if (requestBody.balance !== 0) {
        let categoryId = null
        let amount = requestBody.balance * -1 // Inverse for CCs
        if (account.type === AccountTypes.Bank) {
          const inflowCategory = await Category.findOne({ inflow: true })
          categoryId = inflowCategory.id
          amount = requestBody.balance
        }

        const startingBalancePayee = await Payee.findOne({ budgetId, name: 'Starting Balance', internal: true })
        const startingBalanceTransaction = Transaction.create({
          budgetId,
          accountId: account.id,
          payeeId: startingBalancePayee.id,
          categoryId: categoryId,
          amount,
          date: new Date(),
          memo: 'Starting Balance',
        })
        await startingBalanceTransaction.save()
      }

      return {
        message: 'success',
        data: await account.toResponseModel(),
      }
    } catch (err) {
      console.log(err)
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
        balance: 0,
        cleared: 0,
        uncleared: 0,
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
        data: await Promise.all(accounts.map(account => account.toResponseModel())),
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
      balance: 0,
      cleared: 0,
      uncleared: 0,
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
        data: await account.toResponseModel(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
