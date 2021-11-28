import { createConnection, getConnection } from 'typeorm'
import { User } from '../src/entities/User'
import { Budget } from '../src/entities/Budget'
import { Category } from '../src/entities/Category'
import { CategoryGroup } from '../src/entities/CategoryGroup'
import { CategoryMonth } from '../src/entities/CategoryMonth'
import { formatMonthFromDateString, getMonthStringFromNow } from '../src/utils'
import { Account } from '../src/entities'
import { AccountTypes } from '../src/entities/Account'
import { Transaction } from '../src/entities/Transaction'
import { Payee } from '../src/entities/Payee'

jest.useFakeTimers()

beforeAll(async () => {
  await createConnection({
    name: 'default',
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts'],
    synchronize: true,
    logging: false,
    emitDecoratorMetadata: true,
  })

  await User.create({
    email: 'test@example.com',
    password: 'password',
  }).save()

  const user = await User.findOne({ email: 'test@example.com' })

  const budget = Budget.create({
    id: 'test-budget',
    userId: user.id,
    name: 'My Budget',
  })
  await budget.save()

  const categoryGroup = CategoryGroup.create({
    budgetId: budget.id,
    name: 'Bills',
  })
  await categoryGroup.save()
  await Promise.all(['Power', 'Water'].map(async catName => {
    return Category.create({
      id: `test-${catName.toLowerCase()}`,
      budgetId: budget.id,
      categoryGroupId: categoryGroup.id,
      name: catName,
    }).save()
  }))
})

afterAll(() => {
  let conn = getConnection();
  return conn.close();
});

describe("Budget Tests", () => {
  it("Should budget a positive category and cascade to the next month", async () => {
    const budget = await Budget.findOne({ id: 'test-budget' })
    const category = await Category.findOne({ id: 'test-power' })
    const thisMonth = formatMonthFromDateString(new Date())
    const nextMonth = getMonthStringFromNow(1)

    const categoryMonth = await CategoryMonth.findOrCreate(budget.id, category.id, thisMonth)

    await categoryMonth.update({ budgeted: 25})

    const nextCategoryMonth = await CategoryMonth.findOne({ categoryId: category.id, month: nextMonth })

    expect(nextCategoryMonth.balance).toBe(25)

    await categoryMonth.update({ budgeted: -25 })
    await nextCategoryMonth.reload()

    expect(categoryMonth.budgeted).toBe(-25)
    expect(nextCategoryMonth.balance).toBe(0)
  })

  it("Income should add to TBB and remove on a deleted transaction", async () => {
    const budget = await Budget.findOne({ id: 'test-budget' })
    let account = Account.create({
      budgetId: budget.id,
      type: AccountTypes.Bank,
      name: "Checking",
    })

    await account.save()

    const category = await Category.findOne({ budgetId: budget.id, inflow: true })

    const payee = await Payee.findOne({ name: "Starting Balance", internal: true})
    const transaction = Transaction.create({
      budgetId: budget.id,
      accountId: account.id,
      categoryId: category.id,
      payeeId: payee.id,
      amount: 100,
      date: new Date(),
    })
    await transaction.save()

    await account.reload()
    await budget.reload()

    expect(account.balance).toBe(100)
    expect(budget.toBeBudgeted).toBe(100)

    await transaction.remove()
    await budget.reload()
    await account.reload()

    expect(budget.toBeBudgeted).toBe(0)
    expect(account.balance).toBe(0)
  })

  it("Transfer transaction should not affect TBB", async () => {
    const budget = await Budget.findOne({ id: 'test-budget' })
    const account = Account.create({
        budgetId: budget.id,
      type: AccountTypes.Bank,
      name: "Savings",
    })

    await account.save()

    // Inflow category
    const category = await Category.findOne({ budgetId: budget.id, inflow: true })
    const payee = await Payee.findOne({ name: "Starting Balance", internal: true})

    // checking account
    const checkingAccount = await Account.findOne({ budgetId: budget.id, name: "Checking" })
    await Transaction.create({
      budgetId: budget.id,
      accountId: checkingAccount.id,
      categoryId: category.id,
      payeeId: payee.id,
      amount: 100,
      date: new Date(),
    }).save()

    // create savings account
    const savingsAccount = Account.create({
      budgetId: budget.id,
      type: AccountTypes.Bank,
      name: "Savings",
    })
    await savingsAccount.save()

    await checkingAccount.reload()

    const transferTransaction = Transaction.create({
      budgetId: budget.id,
      accountId: checkingAccount.id,
      categoryId: null,
      payeeId: savingsAccount.transferPayeeId,
      amount: -50,
      date: new Date(),
    })
    transferTransaction.handleTransfers = true
    await transferTransaction.save()

    await checkingAccount.reload()
    await savingsAccount.reload()
    await budget.reload()

    expect(budget.toBeBudgeted).toBe(100)
    expect(checkingAccount.balance).toBe(50)
    expect(savingsAccount.balance).toBe(50)

    await (await Transaction.findOne(transferTransaction.id)).remove()
    await checkingAccount.reload()
    await savingsAccount.reload()
    await budget.reload()

    expect(budget.toBeBudgeted).toBe(100)
    expect(checkingAccount.balance).toBe(100)
    expect(savingsAccount.balance).toBe(0)
  })
})
