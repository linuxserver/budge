import { Get, Route, Path, Security, Post, Body, Controller, Tags, Request, Example } from 'tsoa'
import { Budget } from '../entities/Budget'
import { ExpressRequest } from './requests'
import { ErrorResponse } from './responses'
import { PayeeRequest, PayeeResponse, PayeesResponse } from '../models/Payee'
import { Payee } from '../entities/Payee'
import { getRepository } from 'typeorm'

@Tags('Payees')
@Route('budgets/{budgetId}/payees')
export class PayeesController extends Controller {
  /**
   * Create a new payee
   */
  @Security('jwtRequired')
  @Post()
  @Example<PayeeResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      transferAccountId: null,
      name: 'Random Store Name',
      internal: false,
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async createPayee(
    @Path() budgetId: string,
    @Body() requestBody: PayeeRequest,
    @Request() request: ExpressRequest,
  ): Promise<PayeeResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const payee = getRepository(Payee).create({
        ...requestBody,
        budgetId,
      })
      await getRepository(Payee).insert(payee)

      return {
        message: 'success',
        data: await payee.toResponseModel(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find all budget payees
   */
  @Security('jwtRequired')
  @Get()
  @Example<PayeesResponse>({
    message: 'success',
    data: [
      {
        id: 'abc123',
        transferAccountId: null,
        name: 'Random Store Name',
        internal: false,
        created: new Date('2011-10-05T14:48:00.000Z'),
        updated: new Date('2011-10-05T14:48:00.000Z'),
      },
    ],
  })
  public async getPayees(
    @Path() budgetId: string,
    @Request() request: ExpressRequest,
  ): Promise<PayeesResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const payees = await getRepository(Payee).find({ where: { budgetId } })

      return {
        message: 'success',
        data: await Promise.all(payees.map(payee => payee.toResponseModel())),
      }
    } catch (err) {
      return { message: err.message }
    }
  }

  /**
   * Find a single budget payee
   */
  @Security('jwtRequired')
  @Get('{payeeId}')
  @Example<PayeeResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      transferAccountId: null,
      name: 'Random Store Name',
      internal: false,
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async getPayee(
    @Path() budgetId: string,
    @Path() payeeId: string,
    @Request() request: ExpressRequest,
  ): Promise<PayeeResponse | ErrorResponse> {
    try {
      const budget = await getRepository(Budget).findOne(budgetId)
      if (!budget || budget.userId !== request.user.id) {
        this.setStatus(404)
        return {
          message: 'Not found',
        }
      }

      const payee = await getRepository(Payee).findOne(payeeId)

      return {
        message: 'success',
        data: await payee.toResponseModel(),
      }
    } catch (err) {
      return { message: err.message }
    }
  }
}
