import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent } from 'typeorm'
import { BudgetMonth } from '../entities/BudgetMonth'
import { Category } from '../entities/Category'
import { CategoryMonth, CategoryMonthCache } from '../entities/CategoryMonth'

@EventSubscriber()
export class CategorySubscriber implements EntitySubscriberInterface<Category> {
  listenTo() {
    return Category
  }

  async afterInsert({ entity: category, manager }: InsertEvent<Category>) {
    // Create a category month for all existing months
    const budgetMonths = await manager.find(BudgetMonth, { budgetId: category.budgetId })

    const categoryMonths = budgetMonths.map(budgetMonth =>
      manager.create(CategoryMonth, {
        categoryId: category.id,
        budgetMonthId: budgetMonth.id,
        month: budgetMonth.month,
      }),
    )

    await manager.insert(CategoryMonth, categoryMonths)
  }
}
