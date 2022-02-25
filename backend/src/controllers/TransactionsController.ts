import { Get, Put, Delete, Route, Path, Security, Post, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities/Budget'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account } from '../entities/Account'
import { Transaction, TransactionCache, TransactionStatus } from '../entities/Transaction'
import {
  TransactionRequest,
  TransactionResponse,
  TransactionsDeleteRequest,
  TransactionsRequest,
  TransactionsResponse,
} from '../models/Transaction'
import { prisma } from '../prisma'

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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transaction = await prisma.transaction.create({
        data: {
          budgetId,
          ...requestBody,
          date: new Date(requestBody.date),
        },
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
   * Create multiple transaction
   */
  @Security('jwtRequired')
  @Post('transactions/bulk')
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
  public async createTransactions(
    @Path() budgetId: string,
    @Body() requestBody: TransactionsRequest,
    @Request() request: ExpressRequest,
  ): Promise<TransactionsResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transactions: Transaction[] = []
      for (const transaction of requestBody.transactions) {
        transactions.push(
          await prisma.transaction.create({
            data: {
              budgetId,
              ...transaction,
              date: new Date(transaction.date),
            },
          }),
        )
      }

      return {
        message: 'success',
        data: await Promise.all(transactions.map((transaction: Transaction) => transaction.toResponseModel())),
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
      const budget = await prisma.budget.findUnique({ where: { budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      // Load in original transaction to check if the amount has been altered
      // and updated the category month accordingly
      // @TODO: remove relation to test db transactions
      TransactionCache.enableTransfers(transactionId)
      const transaction: Transaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          ...requestBody,
          ...(requestBody.date && { date: new Date(requestBody.date) }), // @TODO: this is hacky and I don't like it, but the update keeps date as a string and breaks the sanitize function
        },
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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transactionsMap = requestBody.transactions.reduce(
        (acc: { [key: string]: TransactionRequest }, transaction: TransactionRequest) => {
          acc[transaction.id] = transaction
          return acc
        },
        {},
      )

      const transactions: Transaction[] = await prisma.transaction.find({
        where: { id: { in: Object.keys(transactionsMap) } },
      })

      for (const transaction of transactions) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            ...transactionsMap[transaction.id],
            amount: transaction.amount,
            date: transaction.date,
          },
        })
      }

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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transaction = await prisma.transaction.delete({ where: { id: transactionId } })

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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const transactions: Transaction[] = await prisma.transaction.find({ where: { id: { in: [requestBody.ids] } } })
      for (const transaction of transactions) {
        await prisma.transaction.delete({ where: { id: transaction.id } })
      }

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
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await prisma.account.findUnique({ where: { id: accountId }, include: { transactions: true } })

      return {
        message: 'success',
        data: await Promise.all(
          (await account.transactions).map((transaction: Transaction) => transaction.toResponseModel()),
        ),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }
}
