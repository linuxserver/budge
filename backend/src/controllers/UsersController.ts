import { UserResponse } from '../models/User'
import { Get, Route, Path, Security, Post, Put, Body, Controller, Tags, Request, Example } from 'tsoa'
import { User } from '../entities/User'
import { ExpressRequest, UserCreateRequest, UserUpdateRequest } from './requests'
import { ErrorResponse } from './responses'
import { getManager, getRepository } from 'typeorm'
import { UserCache } from '../cache'

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
    if (process.env.REGISTRATION_DISABLED?.match(/true|1/i)) {
      this.setStatus(400)
      return { message: 'Registration is disabled' }
    }

    const { email } = requestBody

    const emailCheck: User = await await UserCache.getByEmail(email)
    if (emailCheck) {
      this.setStatus(400)
      return { message: 'Email already exists' }
    }

    try {
      const newUser = await getManager().transaction(async transactionalEntityManager => {
        const newUser: User = transactionalEntityManager.getRepository(User).create({ ...requestBody })
        await transactionalEntityManager.getRepository(User).insert(newUser)
        return newUser
      })

      return {
        message: 'success',
        data: await newUser.toResponseModel(),
      }
    } catch (err) {
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
      const user: User = await UserCache.getByEmail(email)

      return {
        data: await user.toResponseModel(),
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
      if (!request.user.checkPassword(requestBody.currentPassword)) {
        this.setStatus(400)
        return {
          message: 'Your current password is incorrect',
        }
      }

      request.user.password = requestBody.password
    } else {
      delete requestBody.password
    }

    delete requestBody.currentPassword

    if (requestBody.email) {
      request.user.email = requestBody.email
    }

    try {
      await getRepository(User).save(request.user)

      return {
        data: await request.user.toResponseModel(),
        message: 'success',
      }
    } catch (err) {
      return {
        message: err.message,
      }
    }
  }
}
