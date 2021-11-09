import { UserResponse } from '../schemas/user'
import { Get, Route, Path, Security, Post, Patch, Body, Controller, Tags, Request, Example } from 'tsoa'
import { User } from '../entities'
import { ExpressRequest, UserCreateRequest, UserUpdateRequest } from './requests'
import { ErrorResponse } from './responses'

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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async createUser(@Body() requestBody: UserCreateRequest): Promise<UserResponse | ErrorResponse> {
    const { email } = requestBody

    const emailCheck: User = await User.findOne({ email })
    if (emailCheck) {
      this.setStatus(400)
      return { message: 'Email already exists' }
    }

    try {
      const newUser: User = User.create({ ...requestBody })
      await newUser.save()
      return {
        message: 'success',
        data: newUser.sanitize(),
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
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async getUserByEmail(@Path() email: string): Promise<UserResponse | ErrorResponse> {
    try {
      const user: User = await User.findOne({ email })

      return {
        data: user.sanitize(),
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
  @Patch('{email}')
  @Example<UserResponse>({
    message: 'success',
    data: {
      id: 'abc123',
      email: 'alex@example.com',
      created: '2011-10-05T14:48:00.000Z',
      updated: '2011-10-05T14:48:00.000Z',
    },
  })
  public async updateUser(
    @Path() email: string,
    @Body() requestBody: UserUpdateRequest,
    @Request() request: ExpressRequest,
  ): Promise<UserResponse | ErrorResponse> {
    // currently, only allowed to edit your own user
    if (request.user.email !== email) {
      this.setStatus(401)
      return {
        message: 'Not allowed',
      }
    }

    if (requestBody.password && requestBody.currentPassword) {
      if (!request.user.checkPassword(requestBody.currentPassword)) {
        this.setStatus(400)
        return {
          message: 'Your current password is incorrect',
        }
      }

      requestBody.password = User.hashPassword(requestBody.password)
    } else {
      delete requestBody.password
    }

    delete requestBody.currentPassword

    try {
      let user: User = await User.findOne(request.user.id)
      user = await User.merge(user, { ...requestBody })
      return {
        data: user.sanitize(),
        message: 'success',
      }
    } catch (err) {
      return {
        message: err.message,
      }
    }
  }
}
