import { Budget } from "../entities/Budget";
import { EntitySubscriberInterface, EventSubscriber, getManager, InsertEvent } from "typeorm";
import { getMonthString, getMonthStringFromNow } from "../utils";
import { BudgetMonth } from "../entities/BudgetMonth";
import { CategoryGroup } from "../entities/CategoryGroup";
import { Category } from "../entities/Category";
import { Payee } from "../entities/Payee";

@EventSubscriber()
export class BudgetSubscriber implements EntitySubscriberInterface<Budget> {
  listenTo() {
    return Budget;
  }

  async afterInsert(event: InsertEvent<Budget>) {
    const manager = event.manager
    const budget = event.entity

    const today = getMonthString()
    const prevMonth = getMonthStringFromNow(-1)
    const nextMonth = getMonthStringFromNow(1)

    // Create initial budget months
    for (const month of [prevMonth, today, nextMonth]) {
      const newBudgetMonth = manager.create(BudgetMonth, { budgetId: budget.id, month })
      await manager.save(BudgetMonth, newBudgetMonth)
    }

    // Create internal categories
    const internalCategoryGroup = manager.create(CategoryGroup, {
      budgetId: budget.id,
      name: 'Internal Category',
      internal: true,
      locked: true,
    })
    await manager.save(CategoryGroup, internalCategoryGroup)

    await Promise.all(
      ['To be Budgeted'].map(name => {
        const internalCategory = manager.create(Category, {
          budgetId: budget.id,
          name: name,
          categoryGroupId: internalCategoryGroup.id,
          inflow: true,
          locked: true,
        })
        return manager.save(Category, internalCategory)
      }),
    )

    // Create special 'Starting Balance' payee
    const startingBalancePayee = manager.create(Payee, {
      budgetId: budget.id,
      name: 'Starting Balance',
      internal: true,
    })
    await manager.save(Payee, startingBalancePayee)

    const reconciliationPayee = manager.create(Payee, {
      budgetId: budget.id,
      name: 'Reconciliation Balance Adjustment',
      internal: true,
    })
    await manager.save(Payee, reconciliationPayee)
  }
}
