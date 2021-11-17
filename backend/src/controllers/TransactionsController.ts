import { Get, Put, Delete, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Account, AccountTypes } from '../entities/Account'
import { Transaction, TransactionStatus } from '../entities/Transaction'
import { TransactionRequest, TransactionResponse, TransactionsResponse } from '../schemas/transaction'
import { CategoryMonth } from '../entities/CategoryMonth'
import { formatMonthFromDateString } from '../utils'
import { BudgetMonth } from '../entities/BudgetMonth'
import { Category } from '../entities/Category'

@Tags('Budgets')
@Route('budgets/{budgetId}')
export class TransactionsController extends Controller {
  /**
   * Create a transaction
   */
  @Security('jwtRequired')
  @Post("transactions")
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
    }
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

      // New transaction, create budget month if it doesn't exist yet.
      let budgetMonth = await BudgetMonth.findOrCreate(
        budgetId,
        formatMonthFromDateString(new Date(requestBody.date))
      )

      const account = await Account.findOne(requestBody.accountId)
      const transaction: Transaction = Transaction.create({
        ...requestBody,
        date: new Date(requestBody.date)
      })
      await transaction.save()

      // Save budget month with update activity
      budgetMonth.activity += transaction.amount
      await budgetMonth.save()

      // Update or create category month
      let categoryMonth = await CategoryMonth.findOrCreate(transaction.categoryId, budgetMonth)
      await categoryMonth.updateActivity(transaction.amount)

      if (account.type === AccountTypes.CreditCard) {
        // If this is a credit card, update the category month for the payment
        let ccCategory = await Category.findOne({ budgetId, name: account.name })
        let ccCategoryMonth = await CategoryMonth.findOne({
          categoryId: ccCategory.id,
          month: transaction.getMonth(),
        }) || CategoryMonth.create({
          categoryId: ccCategory.id,
          month: transaction.getMonth(),
          budgetMonth: budgetMonth,
          activity: 0,
          balance: 0,
          budgeted: 0,
        })

        // CC activities are inversed
        await ccCategoryMonth.updateActivity(transaction.amount * -1)
      }

      return {
        message: 'success',
        data: await transaction.sanitize(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Update a transaction
   */
  @Security('jwtRequired')
  @Put("transactions/{transactionId}")
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
    }
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
      const transaction = await Transaction.findOne(transactionId, { relations: ["account"] })

      const originalAmount = transaction.amount
      const newAmount = requestBody.amount
      const originalMonth = transaction.getMonth()
      const newMonth = formatMonthFromDateString(new Date(requestBody.date))
      const originalCategoryId = transaction.categoryId
      const newCategoryId = requestBody.categoryId
      const difference = newAmount - originalAmount

      // If the category or the month has changed, "remove" the transaction from the original category month
      // and create / update the new category month
      if (originalCategoryId === newCategoryId && originalMonth === newMonth) {
        // Category month is the same, just calculate the difference of amounts

        // Only update amounts if amount has changed
        if (newAmount !== originalAmount) {
          const categoryMonth = await CategoryMonth.findOne({ categoryId: originalCategoryId, month: originalMonth }, { relations: ["budgetMonth"] })

          await categoryMonth.updateActivity(difference)

          categoryMonth.budgetMonth.activity += difference
          await categoryMonth.budgetMonth.save()
        }
      } else if (originalCategoryId !== newCategoryId || originalMonth !== newMonth) {
        // Category month has changed, so reset 'original' month's amount from original transaction and
        // add / create to new month
        const originalCategoryMonth = await CategoryMonth.findOne({ categoryId: originalCategoryId, month: originalMonth }, { relations: ["budgetMonth"] })
        await originalCategoryMonth.updateActivity(originalAmount * -1)

        originalCategoryMonth.budgetMonth.activity += originalAmount * -1
        await originalCategoryMonth.budgetMonth.save()

        const newBudgetMonth = await BudgetMonth.findOrCreate(budgetId, newMonth)
        const newCategoryMonth = await CategoryMonth.findOrCreate(newCategoryId, newBudgetMonth)
        await newCategoryMonth.updateActivity(newAmount)

        newCategoryMonth.activity += newAmount
        await newCategoryMonth.budgetMonth.save()
      }

      if (transaction.account.type === AccountTypes.CreditCard && difference !== 0) {
        // Update the CC month as well
        const ccCategory = await Category.findOne({ budgetId, name: transaction.account.name })
        const ccCategoryMonth = await CategoryMonth.findOne({ categoryId: ccCategory.id, month: originalMonth })

        // Again, inverse because it's a CC
        await ccCategoryMonth.updateActivity(difference * -1)
      }

      const updatedTransaction = Transaction.merge(transaction, {
        ...requestBody,
        date: new Date(requestBody.date), // @TODO: this is hacky and I don't like it, but the update keeps date as a string and breaks the sanitize function
      })
      await updatedTransaction.save()

      return {
        message: 'success',
        data: await updatedTransaction.sanitize(),
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
  @Delete("transactions/{transactionId}")
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

      const transaction = await Transaction.findOne(transactionId, { relations: ["account"] })
      const categoryMonth = await CategoryMonth.findOne({ categoryId: transaction.categoryId, month: transaction.getMonth() }, { relations: ["budgetMonth"] })
      await categoryMonth.updateActivity(transaction.amount * -1)

      categoryMonth.budgetMonth.activity += transaction.amount * -1
      await categoryMonth.budgetMonth.save()

      if (transaction.account.type === AccountTypes.CreditCard) {
        const ccCategory = await Category.findOne({ budgetId, name: transaction.account.name })
        const ccCategoryMonth = await CategoryMonth.findOne({ categoryId: ccCategory.id, month: transaction.getMonth() })
        await ccCategoryMonth.updateActivity(transaction.amount) // Inverse, remember
      }

      await Transaction.delete(transactionId)

      return {
        message: 'success',
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find all account's transactions
   */
  @Security('jwtRequired')
  @Get("accounts/{accountId}/transactions")
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
    ]
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

      const account = await Account.findOne(accountId, { relations: ["transactions"] })

      return {
        message: 'success',
        data: await Promise.all(account.transactions.map(transaction => transaction.sanitize())),
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
