import { redis } from '../app'
import { getRepository } from "typeorm";
import { User } from '../entities/User';
import { UserCacheModel, UserModel } from '../models/User';

export class UserCache {
  public static async getById(id: string): Promise<User> {
    const payload = await redis.get(`user-${id}`);
    if (payload) {
      console.log('cache hit')
      return getRepository(User).create(UserCache.hydrate(payload))
    }

    console.log('cache miss')
    const user = await getRepository(User).findOne(id)
    await redis.set(`user-${id}`, JSON.stringify(UserCache.dehydrate(user)))

    return user
  }

  public static async getByEmail(email: string): Promise<User> {
    const payload = await redis.get(`user-${email}`);
    if (payload) {
      console.log('cache hit')
      return getRepository(User).create(UserCache.hydrate(payload))
    }

    console.log('cache miss')
    const user = await getRepository(User).findOne({ email })
    await redis.set(`user-${email}`, JSON.stringify(UserCache.dehydrate(user)))

    return user
  }

  public static dehydrate(user: User): UserCacheModel {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      created: user.created,
      updated: user.updated,
    }
  }

  public static hydrate(payload: string): UserCacheModel {
    const props = JSON.parse(payload)
    return {
      id: props.id,
      email: props.email,
      password: props.password,
      created: props.created,
      updated: props.updated,
    }
  }
}
