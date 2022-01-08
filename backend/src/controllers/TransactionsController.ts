import { Get, Put, Delete, Route, Path, Security, Post, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities/Budget'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account } from '../entities/Account'
import { Transaction, TransactionCache, TransactionStatus } from '../entities/Transaction'
import { TransactionModel, TransactionRequest, TransactionResponse, TransactionsDeleteRequest, TransactionsRequest, TransactionsResponse } from '../models/Transaction'
import { dinero } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { getManager, getRepository, In } from 'typeorm'

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
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transaction = await getManager().transaction(async transactionalEntityManager => {
        const transaction = transactionalEntityManager.getRepository(Transaction).create({
          budgetId,
          ...requestBody,
          amount: dinero({ amount: requestBody.amount, currency: USD }),
          date: new Date(requestBody.date),
        })
        TransactionCache.enableTransfers(transaction.id)
        await transactionalEntityManager.getRepository(Transaction).insert(transaction)

        return transaction
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
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      // Load in original transaction to check if the amount has been altered
      // and updated the category month accordingly
      // @TODO: remove relation to test db transactions
      const transaction = await getManager().transaction(async transactionalEntityManager => {
        const transaction = await transactionalEntityManager.getRepository(Transaction).findOne(transactionId, { relations: ['account'] })
        transaction.update({
          ...requestBody,
          amount: dinero({ amount: requestBody.amount, currency: USD }),
          ...requestBody.date && { date: new Date(requestBody.date) }, // @TODO: this is hacky and I don't like it, but the update keeps date as a string and breaks the sanitize function
        })
        TransactionCache.enableTransfers(transaction.id)
        await transactionalEntityManager.getRepository(Transaction).update(transaction.id, transaction.getUpdatePayload())

        return transaction
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
  @Put('transactions')
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
  public async updateTransactions(
    @Path() budgetId: string,
    @Body() requestBody: TransactionsRequest,
    @Request() request: ExpressRequest,
  ): Promise<TransactionsResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transactionsMap = requestBody.transactions.reduce((acc: { [key: string]: TransactionRequest }, transaction: TransactionRequest) => {
        acc[transaction.id] = transaction
        return acc
      }, {})

      const transactions = await getManager().transaction(async transactionalEntityManager => {
        const transactions = await transactionalEntityManager.getRepository(Transaction).find({ where: { id: In(Object.keys(transactionsMap)) } })
        transactions.map(transaction => transaction.update({
          ...transactionsMap[transaction.id],
          amount: transaction.amount,
          date: transaction.date,
        }))

        await transactionalEntityManager.getRepository(Transaction).save(transactions)

        return transactions
      })

      return {
        message: 'success',
        data: await Promise.all(transactions.map(transaction => transaction.toResponseModel())),
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
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transaction = await getRepository(Transaction).findOne(transactionId)
      TransactionCache.enableTransfers(transactionId)
      await getRepository(Transaction).remove(transaction)

      return {
        message: 'success',
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
  @Delete('transactions')
  @Example<TransactionsResponse>({
    message: 'success',
  })
  public async deleteTransactions(
    @Path() budgetId: string,
    @Body() requestBody: TransactionsDeleteRequest,
    @Request() request: ExpressRequest,
  ): Promise<TransactionsResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transactions = await getManager().getRepository(Transaction).find({ where: { id: In(requestBody.ids) } })
      requestBody.ids.map(id => TransactionCache.enableTransfers(id))
      await getManager().getRepository(Transaction).remove(transactions)

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
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await getRepository(Account).findOne(accountId, { relations: ['transactions'] })

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
