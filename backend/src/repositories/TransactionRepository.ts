import { DeepPartial, EntityRepository, Repository } from 'typeorm'
import { Transaction } from '../entities/Transaction'
import { formatMonthFromDateString } from '../utils'
import { CategoryMonth } from '../entities/CategoryMonth'

@EntityRepository()
export class TransactionRepository extends Repository<Transaction> {
  public static async foobar(budgetId: string, partial: DeepPartial<Transaction>): Promise<Transaction> {
    // Create transaction
    const transaction = Transaction.create(partial)

    const categoryMonth = await CategoryMonth.findOrCreate(
      budgetId,
      transaction.categoryId,
      formatMonthFromDateString(transaction.date),
    )

    await categoryMonth.update({ activity: transaction.amount })

    return transaction
  }
}
