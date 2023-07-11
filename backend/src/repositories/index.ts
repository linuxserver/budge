import { BudgetMonths } from  '../repositories/BudgetMonths'
import { CategoryMonths } from  '../repositories/CategoryMonths'
import { Budget} from '../entities/Budget'
import { Account } from '../entities/Account'
import { EntityRepository, Repository } from 'typeorm'

export {
    BudgetMonths,
    CategoryMonths,
}

@EntityRepository(Account)
export class AccountRepository extends Repository<Account> {
}

@EntityRepository(Budget)
export class BudgetRepository extends Repository<Budget> {
}
