import jwt from 'jsonwebtoken'
import { Request } from 'express'
import { User } from '../entities/User'
import config from '../config'
import { logger } from '../config/winston'
import { getRepository } from 'typeorm'
import prisma from '../database'

export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[] | undefined,
): Promise<any> {
  const token =
    request.body.token ||
    request.query.token ||
    request.headers['x-access-token'] ||
    request.headers['authorization'] ||
    request.cookies['jwt']

  let user
  if (token) {
    let jwtPayload = null
    try {
      jwtPayload = jwt.verify(token, config.jwtSecret) as any
      const { userId, email } = jwtPayload

      user = await prisma.user.findUnique({ where: { id: userId } })
    } catch (err) {}
  }

  if (!user) {
    logger.debug('User is not authenticated')
    if (securityName === 'jwtRequired') {
      throw new Error('You must be logged in to do that')
    }

    return null
  }

  return user
}
