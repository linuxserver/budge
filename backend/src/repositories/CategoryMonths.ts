import { EntityRepository, EntityTarget, ObjectType, Repository, UpdateResult } from "typeorm";
import { CategoryMonth } from "../entities/CategoryMonth";
import { dinero } from "dinero.js";
import { USD } from "@dinero.js/currencies";
import { BudgetMonths } from "./BudgetMonths";

@EntityRepository(CategoryMonth)
export class CategoryMonths extends Repository<CategoryMonth> {
  async findOrCreate(budgetId: string, categoryId: string, month: string): Promise<CategoryMonth> {
    let categoryMonth: CategoryMonth = await this.findOne(
      { categoryId, month: month },
      { relations: ['budgetMonth'] },
    )

    if (!categoryMonth) {
      const budgetMonth = await this.manager.getCustomRepository(BudgetMonths).findOrCreate(budgetId, month)
      categoryMonth = this.create({
        budgetMonthId: budgetMonth.id,
        categoryId,
        month: month,
        // @TODO: I DON'T KNOW WHY I HAVE TO SPECIFY 0s HERE AND NOT ABOVE WHEN CREATING BUDGET MONTH!!! AHHH!!!
        activity: dinero({ amount: 0, currency: USD }),
        balance: dinero({ amount: 0, currency: USD }),
        budgeted: dinero({ amount: 0, currency: USD }),
      })
      await this.insert(categoryMonth)
      categoryMonth.budgetMonth = Promise.resolve(budgetMonth)
    }

    return categoryMonth
  }
}
