import { redis } from '../app'
import { getRepository } from "typeorm";
import { Budget } from '../entities/Budget';
import { BudgetModel } from '../models/Budget';

export class BudgetCache {
  public static dehydrate(budget: Budget): string {
    return JSON.stringify({
        id: budget.id,
        userId: budget.userId,
        name: budget.name,
        currency: budget.currency,
        created: budget.created,
        updated: budget.updated,
    })
  }

  public static hydrate(payload: string): Budget {
    return getRepository(Budget).create({
        id: payload.id,
        userId: payload.userId,
        name: payload.name,
        currency: payload.currency,
        created: new Date(payload.created),
        updated: new Date(payload.updated),
    })
  }
}
