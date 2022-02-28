import { Get, Put, Route, Path, Security, Post, Body, Controller, Tags, Request, Example } from 'tsoa'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { Accounts, AccountTypes } from '../entities/Account'
import { AccountResponse, AccountsResponse, CreateAccountRequest, EditAccountRequest } from '../models/Account'
import { Transaction, TransactionStatus } from '../entities/Transaction'
import { getRepository } from 'typeorm'
import { prisma } from '../prisma'

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
  })
  public async createAccount(
    @Path() budgetId: string,
    @Body() { date, ...requestBody }: CreateAccountRequest,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId: request.user.id } })
      if (!budget) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await prisma.account.create({
        data: {
          ...requestBody,
          budget: { connect: { id: budgetId } },
        },
      })

      // Create a transaction for the starting balance of the account
      if (requestBody.balance !== 0) {
        let categoryId = null

        let amount = requestBody.balance
        switch (account.type) {
          case AccountTypes.CreditCard:
            amount = amount * -1 // Inverse balance for CCs
            break
          case AccountTypes.Bank:
            const inflowCategory = await prisma.category.findFirst({
              where: { budgetId: account.budgetId, inflow: true },
            })
            categoryId = inflowCategory.id
            break
        }

        const startingBalancePayee = await prisma.payee.findFirst({
          where: {
            budgetId,
            name: 'Starting Balance',
            internal: true,
          },
        })

        const startingBalanceTransaction = await prisma.transaction.create({
          data: {
            budgetId,
            accountId: account.id,
            payeeId: startingBalancePayee.id,
            categoryId: categoryId,
            amount,
            date: date,
            memo: 'Starting Balance',
            status: TransactionStatus.Reconciled,
          },
        })
      }

      // Reload account to get the new balanace after the 'initial' transaction was created
      // await account.reload()

      return {
        message: 'success',
        data: await prisma.account.findUnique({ where: { id: account.id } }),
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Update an account's name or balance. Updating a balance will result in a possible
   * reconciled transaction.
   */
  @Security('jwtRequired')
  @Put('{id}')
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
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
  })
  public async updateAccount(
    @Path() budgetId: string,
    @Path() id: string,
    @Body() requestBody: EditAccountRequest,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findUnique({ where: { id: budgetId } })
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      let account = await prisma.account.findUnique({ where: { id } })
      if (!account) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      if (requestBody.name !== account.name || requestBody.order !== account.order) {
        account.name = requestBody.name

        if (account.order !== requestBody.order) {
          account.order = requestBody.order

          // Update all accounts because of order change
          let accounts = (await prisma.account.findMany({ where: { budgetId } })).map((act: any) => {
            if (account.id === act.id) {
              return account
            }

            return act
          })

          accounts = Accounts.sort(accounts)
          for (const account of accounts) {
            await prisma.account.update({
              where: { id: account.id },
              data: {
                name: account.name,
                order: account.order,
              },
            })
          }
        } else {
          await prisma.account.update({
            where: { id: account.id },
            data: {
              name: account.name,
              order: account.order,
            },
          })
        }
      }

      if (typeof requestBody.balance === 'number') {
        // Reconcile the account
        const difference = requestBody.balance - account.cleared
        if (difference !== 0) {
          const reconciliationPayee = await prisma.payee.findFirst({
            where: {
              budgetId,
              name: 'Reconciliation Balance Adjustment',
              internal: true,
            },
          })
          const inflowCategory = await prisma.category.findFirst({
            where: { budgetId: account.budgetId, inflow: true },
          })
          const startingBalanceTransaction = await prisma.transaction.create({
            data: {
              budgetId,
              accountId: account.id,
              payeeId: reconciliationPayee.id,
              categoryId: inflowCategory.id,
              amount: difference,
              date: new Date(),
              memo: 'Reconciliation Transaction',
              status: TransactionStatus.Reconciled,
            },
          })
        }

        const clearedTransactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id,
            status: TransactionStatus.Cleared,
          },
        })
        for (const transaction of clearedTransactions) {
          transaction.status = TransactionStatus.Reconciled
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.Reconciled,
            },
          })
        }

        account = await prisma.account.findUnique({ where: { id: account.id } })
      }

      return {
        message: 'success',
        data: account,
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
  })
  public async getAccounts(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<AccountsResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId: request.user.id } })
      if (!budget) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const accounts = await prisma.account.findMany({ where: { budgetId } })

      return {
        message: 'success',
        data: accounts,
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find a single budget account
   */
  @Security('jwtRequired')
  @Get('{accountId}')
  @Example<AccountResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      budgetId: 'def456',
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
  })
  public async getAccount(
    @Path() budgetId: string,
    @Path() accountId: string,
    @Request() request: ExpressRequest,
  ): Promise<AccountResponse | ErrorResponse> {
    try {
      const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId: request.user.id } })
      if (!budget) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const account = await prisma.account.findUnique({ where: { id: accountId } })

      return {
        message: 'success',
        data: account,
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
