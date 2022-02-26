import { CreditCardGroupName } from '../../entities/CategoryGroup'
import { AccountTypes } from '../../entities/Account'
import { PrismaClient } from '@prisma/client'

export default class AccountMiddleware {
  public static async createAccountPayee(account: any, prisma: PrismaClient) {
    const payee = await prisma.payee.create({
      data: {
        name: `Transfer : ${account.name}`,
        budgetId: account.budgetId,
        transferAccountId: account.id,
      },
    })

    await prisma.account.update({ where: { id: account.id }, data: { transferPayeeId: payee.id } })
  }

  public static async createCreditCardCategory(account: any, prisma: PrismaClient) {
    if (account.type !== AccountTypes.CreditCard) {
      return
    }

    // Create CC payments category if it doesn't exist
    let ccGroup = await prisma.categoryGroup.findFirst({
      where: {
        budgetId: account.budgetId,
        name: CreditCardGroupName,
      },
    })

    if (!ccGroup) {
      ccGroup = await prisma.categoryGroup.create({
        data: {
          name: CreditCardGroupName,
          locked: true,
          budgetId: account.budgetId,
        },
      })
    }

    // Create payment tracking category
    const paymentCategory = await prisma.category.create({
      data: {
        name: account.name,
        locked: true,
        budget: { connect: { id: account.budgetId } },
        categoryGroup: { connect: { id: ccGroup.id } },
        trackingAccountId: account.id,
      },
    })
  }
}
