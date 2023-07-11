import { redis } from '../app'
import { getRepository } from "typeorm";
import { Account } from '../entities/Account';

export class AccountCacheModel {

}

export class AccountCache {
  public static async getById(id: string): Promise<Account> {
    const payload = await redis.get(`account-${id}`);
    if (payload) {
      console.log('cache hit')
      return new Account(JSON.parse(payload))
    }

    console.log('cache miss')
    const account = await getRepository(Account).findOne(id)
    redis.set(`account-${id}`, JSON.stringify(account.toResponseModel()))

    return account
  }
}
