import { Get, Put, Delete, Route, Path, Security, Post, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account } from '../entities/Account'
import { Transaction, TransactionStatus } from '../entities/Transaction'
import { TransactionRequest, TransactionResponse, TransactionsResponse } from '../schemas/transaction'

@Tags('Budgets')
@Route('budgets/{budgetId}')
export class TransactionsController extends Controller {
  /**
   * Create a transaction
   */
  @Security('jwtRequired')
  @Post('transactions')
  @Example<TransactionResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      accountId: 'def456',
      payeeId: 'xyz890',
      amount: 10000,
      date: '2011-10-05T14:48:00.000Z',
      memo: 'Mortgage payment',
      categoryId: null,
      status: TransactionStatus.Pending,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createTransaction(
    @Path() budgetId: string,
    @Body() requestBody: TransactionRequest,
    @Request() request: ExpressRequest,
  ): Promise<TransactionResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transaction = await Transaction.createNew({
        budgetId,
        ...requestBody,
        date: new Date(requestBody.date),
        handleTransfers: true,
      })

      return {
        message: 'success',
        data: await transaction.toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Update a transaction
   */
  @Security('jwtRequired')
  @Put('transactions/{transactionId}')
  @Example<TransactionResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      accountId: 'def456',
      payeeId: 'xyz890',
      amount: 10000,
      date: '2011-10-05T14:48:00.000Z',
      memo: 'Mortgage payment',
      categoryId: null,
      status: TransactionStatus.Pending,
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async updateTransaction(
    @Path() budgetId: string,
    @Path() transactionId: string,
    @Body() requestBody: TransactionRequest,
    @Request() request: ExpressRequest,
  ): Promise<TransactionResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      // Load in original transaction to check if the amount has been altered
      // and updated the category month accordingly
      // @TODO: remove relation to test db transactions
      const transaction = await Transaction.findOne(transactionId, { relations: ['account'] })
      await transaction.update({
        ...requestBody,
        date: new Date(requestBody.date), // @TODO: this is hacky and I don't like it, but the update keeps date as a string and breaks the sanitize function
        handleTransfers: true,
      })

      return {
        message: 'success',
        data: await transaction.toResponseModel(),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Delete a transaction
   */
  @Security('jwtRequired')
  @Delete('transactions/{transactionId}')
  @Example<TransactionResponse>({
    message: 'success',
  })
  public async deleteTransaction(
    @Path() budgetId: string,
    @Path() transactionId: string,
    @Request() request: ExpressRequest,
  ): Promise<TransactionResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transaction = await Transaction.findOne(transactionId)
      transaction.handleTransfers = true
      await transaction.remove()

      return {
        message: 'success',
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Find all account's transactions
   */
  @Security('jwtRequired')
  @Get('accounts/{accountId}/transactions')
  @Example<TransactionsResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        accountId: 'def456',
        payeeId: 'xyz890',
        amount: 10000,
        date: '2011-10-05T14:48:00.000Z',
        memo: 'Mortgage payment',
        categoryId: null,
        status: TransactionStatus.Pending,
        created: '2011-10-05T14:48:00.000Z',
        updated: '2011-10-05T14:48:00.000Z',
      },
    ],
  })
  public async getTransactions(
    @Path() budgetId: string,
    @Path() accountId: string,
    @Request() request: ExpressRequest,
  ): Promise<TransactionsResponse | ErrorResponse> {
    try {
      const budget = await Budget.findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await Account.findOne(accountId, { relations: ['transactions'] })

      return {
        message: 'success',
        data: await Promise.all((await account.transactions).map(transaction => transaction.toResponseModel())),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }
}
