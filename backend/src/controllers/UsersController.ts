import { UserResponse } from '../models/User'
import { Get, Route, Path, Security, Post, Put, Body, Controller, Tags, Request, Example } from 'tsoa'
import { User } from '../entities/User'
import { ExpressRequest, UserCreateRequest, UserUpdateRequest } from './requests'
import { ErrorResponse } from './responses'
import { prisma } from '../prisma'

@Tags('Users')
@Route('users')
export class UsersController extends Controller {
  /**
   * Create a new user
   */
  @Post()
  @Example<UserResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      email: 'alex@example.com',
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async createUser(@Body() requestBody: UserCreateRequest): Promise<UserResponse | ErrorResponse> {
    const { email } = requestBody

    const emailCheck = await prisma.user.findUnique({ where: { email } })
    if (emailCheck) {
      this.setStatus(400)
      return { message: 'Email already exists' }
    }

    try {
      requestBody.password = User.hashPassword(requestBody.password)
      const newUser = await prisma.user.create({ data: requestBody })

      return {
        message: 'success',
        data: newUser,
      }
    } catch (err) {
      console.log(err)
      return { message: err.message }
    }
  }

  /**
   * Retrieve an existing user
   *
   * @param email Email of the user you are retrieving
   * @example email "alex@example.com"
   */
  @Security('jwtRequired')
  @Get('{email}')
  @Example<UserResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      email: 'alex@example.com',
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async getUserByEmail(@Path() email: string): Promise<UserResponse | ErrorResponse> {
    try {
      const user = await prisma.user.findUnique({ where: { email } })

      return {
        data: user,
        message: 'success',
      }
    } catch (err) {
      return {
        message: 'failed',
      }
    }
  }

  /**
   * Update a user
   *
   * @param email Email of the user you are updating
   * @example email "alex@example.com"
   */
  @Security('jwtRequired')
  @Put()
  @Example<UserResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      email: 'alex@example.com',
      created: new Date('2011-10-05T14:48:00.000Z'),
      updated: new Date('2011-10-05T14:48:00.000Z'),
    },
  })
  public async updateUser(
    @Body() requestBody: UserUpdateRequest,
    @Request() request: ExpressRequest,
  ): Promise<UserResponse | ErrorResponse> {
    if (requestBody.password && requestBody.currentPassword) {
      if (!User.checkPassword(request.user.password, requestBody.currentPassword)) {
        this.setStatus(400)
        return {
          message: 'Your current password is incorrect',
        }
      }

      request.user.password = User.hashPassword(requestBody.password)
    } else {
      delete requestBody.password
    }

    delete requestBody.currentPassword

    if (requestBody.email) {
      request.user.email = requestBody.email
    }

    try {
      await prisma.user.update({ where: { id: request.user.id }, data: request.user })

      return {
        data: request.user,
        message: 'success',
      }
    } catch (err) {
      return {
        message: err.message,
      }
    }
  }
}
