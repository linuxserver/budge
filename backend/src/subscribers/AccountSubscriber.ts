import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from "typeorm";
import { CategoryGroup, CreditCardGroupName } from "../entities/CategoryGroup";
import { Category } from "../entities/Category";
import { Payee } from "../entities/Payee";
import { Account, AccountTypes } from "../entities/Account";
import { add } from "dinero.js";

@EventSubscriber()
export class AccountSubscriber implements EntitySubscriberInterface<Account> {
  listenTo() {
    return Account;
  }

  async afterInsert(event: InsertEvent<Account>) {
    await Promise.all([
      this.createCreditCardCategory(event),
      this.createAccountPayee(event),
    ])
  }

  private async createAccountPayee(event: InsertEvent<Account>) {
    const account = event.entity
    const manager = event.manager

    const payee = manager.create(Payee, {
      budgetId: account.budgetId,
      name: `Transfer : ${account.name}`,
      transferAccountId: account.id,
    })

    // @TODO: I wish there was a better way around this
    await manager.insert(Payee, payee)
    account.transferPayeeId = payee.id
    await manager.update(Account, account.id, account.getUpdatePayload())
  }

  private async createCreditCardCategory(event: InsertEvent<Account>) {
    const account = event.entity
    const manager = event.manager

    if (account.type === AccountTypes.CreditCard) {
      // Create CC payments category if it doesn't exist
      const ccGroup =
        (await manager.findOne(CategoryGroup, {
          budgetId: account.budgetId,
          name: CreditCardGroupName,
        })) ||
        manager.create(CategoryGroup, {
          budgetId: account.budgetId,
          name: CreditCardGroupName,
          locked: true,
        })

      await manager.save(CategoryGroup, ccGroup)

      // Create payment tracking category
      const paymentCategory = manager.create(Category, {
        budgetId: account.budgetId,
        categoryGroupId: ccGroup.id,
        trackingAccountId: account.id,
        name: account.name,
        locked: true,
      })
      await manager.insert(Category, paymentCategory)
    }
  }

  async beforeUpdate(event: UpdateEvent<Account>) {
    const account = event.entity

    account.balance = add(account.cleared, account.uncleared)
  }
}
