import { createConnection, getConnection, getRepository, getCustomRepository } from 'typeorm'
import { User } from '../src/entities/User'
import { Budget } from '../src/entities/Budget'
import { Category } from '../src/entities/Category'
import { CategoryGroup } from '../src/entities/CategoryGroup'
import { CategoryMonth } from '../src/entities/CategoryMonth'
import { formatMonthFromDateString, getMonthStringFromNow } from '../src/utils'
import { Account } from '../src/entities/Account'
import { AccountTypes } from '../src/entities/Account'
import { Transaction } from '../src/entities/Transaction'
import { Payee } from '../src/entities/Payee'
import { CategoryMonths } from '../src/repositories/CategoryMonths'
import { BudgetMonth } from '../src/entities/BudgetMonth'

beforeAll(async () => {
  await createConnection({
    name: 'default',
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    entities: ['src/entities/**.ts'],
    migrations: ['src/migrations/**.ts'],
    subscribers: ['src/subscribers/**.ts'],
    synchronize: true,
    // migrationsRun: true,
    logging: 'all',
    emitDecoratorMetadata: true,
    cli: {
      entitiesDir: 'src/entities',
      migrationsDir: 'src/migrations',
      subscribersDir: 'src/subscribers',
    },
  })

  const user = getRepository(User).create({
    email: 'test@example.com',
    password: 'password',
  })
  await getRepository(User).save(user)

  const budget = getRepository(Budget).create({
    id: 'test-budget',
    userId: user.id,
    name: 'My Budget',
  })
  await getRepository(Budget).save(budget)

  const categoryGroup = getRepository(CategoryGroup).create({
    budgetId: budget.id,
    name: 'Bills',
  })
  await getRepository(CategoryGroup).save(categoryGroup)
  await Promise.all(
    ['Power', 'Water'].map(async catName => {
      const newCategory = getRepository(Category).create({
        id: `test-${catName.toLowerCase()}`,
        budgetId: budget.id,
        categoryGroupId: categoryGroup.id,
        name: catName,
      })
      return getRepository(Category).insert(newCategory)
    }),
  )
})

afterAll(() => {
  let conn = getConnection()
  return conn.close()
})

describe('Budget Tests', () => {
  it('Should budget a positive category and cascade to the next month', async () => {
    const budget = await getRepository(Budget).findOne('test-budget')
    const category = await getRepository(Category).findOne('test-power')
    const thisMonth = formatMonthFromDateString(new Date())
    const nextMonth = getMonthStringFromNow(1)

    const categoryMonth = await getCustomRepository(CategoryMonths).findOrCreate(budget.id, category.id, thisMonth)

    categoryMonth.update({ budgeted: 25 })
    await getRepository(CategoryMonth).update(categoryMonth.id, categoryMonth.getUpdatePayload())

    let nextCategoryMonth = await getRepository(CategoryMonth).findOne({ categoryId: category.id, month: nextMonth })

    expect(nextCategoryMonth.balance).toBe(25)

    categoryMonth.update({ budgeted: -25 })
    await getRepository(CategoryMonth).update(categoryMonth.id, categoryMonth.getUpdatePayload())
    nextCategoryMonth = await getRepository(CategoryMonth).findOne({ categoryId: category.id, month: nextMonth })

    expect(categoryMonth.budgeted).toBe(-25)
    expect(nextCategoryMonth.balance).toBe(0)

    await categoryMonth.update({ budgeted: 0 })
    await getRepository(CategoryMonth).update(categoryMonth.id, categoryMonth.getUpdatePayload())
    nextCategoryMonth = await getRepository(CategoryMonth).findOne({ categoryId: category.id, month: nextMonth })

    expect(categoryMonth.budgeted).toBe(0)
    expect(nextCategoryMonth.balance).toBe(0)
  })

  it('Income should add to TBB and remove on a deleted transaction', async () => {
    let budget = await getRepository(Budget).findOne({ id: 'test-budget' })
    let account = getRepository(Account).create({
      budgetId: budget.id,
      type: AccountTypes.Bank,
      name: 'Checking',
    })

    await getRepository(Account).insert(account)

    const category = await getRepository(Category).findOne({ budgetId: budget.id, inflow: true })

    const payee = await getRepository(Payee).findOne({ name: 'Starting Balance', internal: true })
    const transaction = getRepository(Transaction).create({
      budgetId: budget.id,
      accountId: account.id,
      categoryId: category.id,
      payeeId: payee.id,
      amount: 100,
      date: new Date(),
    })

    await getRepository(Transaction).insert(transaction)

    account = await getRepository(Account).findOne(account.id)
    budget = await getRepository(Budget).findOne(budget.id)

    expect(account.balance).toBe(100)
    expect(budget.toBeBudgeted).toBe(100)

    await getRepository(Transaction).remove(transaction)
    account = await getRepository(Account).findOne(account.id)
    budget = await getRepository(Budget).findOne(budget.id)

    expect(budget.toBeBudgeted).toBe(0)
    expect(account.balance).toBe(0)
  })

  it('Transfer transaction should not affect TBB', async () => {
    let budget = await getRepository(Budget).findOne({ id: 'test-budget' })
    const account = getRepository(Account).create({
      budgetId: budget.id,
      type: AccountTypes.Bank,
      name: 'Savings',
    })

    await getRepository(Account).insert(account)

    //  Inflow category
    const category = await getRepository(Category).findOne({ budgetId: budget.id, inflow: true })
    const payee = await getRepository(Payee).findOne({ name: 'Starting Balance', internal: true })

    // checking account
    let checkingAccount = await getRepository(Account).findOne({ budgetId: budget.id, name: 'Checking' })
    // starting balance of 100
    const transaction = getRepository(Transaction).create({
      budgetId: budget.id,
      accountId: checkingAccount.id,
      categoryId: category.id,
      payeeId: payee.id,
      amount: 100,
      date: new Date(),
    })
    await getRepository(Transaction).insert(transaction)

    // create savings account
    let savingsAccount = getRepository(Account).create({
      budgetId: budget.id,
      type: AccountTypes.Bank,
      name: 'Savings',
    })
    await getRepository(Account).insert(savingsAccount)

    checkingAccount = await getRepository(Account).findOne({ budgetId: budget.id, name: 'Checking' })

    // transfer 50 checking -> savings
    let transferTransaction = getRepository(Transaction).create({
      budgetId: budget.id,
      accountId: checkingAccount.id,
      categoryId: null,
      payeeId: savingsAccount.transferPayeeId,
      amount: -50,
      date: new Date(),
    })
    await getRepository(Transaction).insert(transferTransaction)

    checkingAccount = await getRepository(Account).findOne(checkingAccount.id)
    savingsAccount = await getRepository(Account).findOne(savingsAccount.id)
    budget = await getRepository(Budget).findOne(budget.id)

    expect(budget.toBeBudgeted).toBe(100)
    expect(checkingAccount.balance).toBe(50)
    expect(savingsAccount.balance).toBe(50)

    // Remove transfer transaction (100 savings back to checking)
    await getRepository(Transaction).remove(transferTransaction)
    checkingAccount = await getRepository(Account).findOne(checkingAccount.id)
    savingsAccount = await getRepository(Account).findOne(savingsAccount.id)
    budget = await getRepository(Budget).findOne(budget.id)

    expect(budget.toBeBudgeted).toBe(100)
    expect(checkingAccount.balance).toBe(100)
    expect(savingsAccount.balance).toBe(0)
  })

  it('Credit card transactions affect their category', async () => {
    let budget = await getRepository(Budget).findOne({ id: 'test-budget' })
    let account = getRepository(Account).create({
      budgetId: budget.id,
      type: AccountTypes.CreditCard,
      name: 'Visa',
    })

    await getRepository(Account).insert(account)

    const paymentCategory = await getRepository(Category).findOne({ id: 'test-power' })

    const payee = getRepository(Payee).create({
      budgetId: budget.id,
      name: 'Power company',
    })
    await getRepository(Payee).insert(payee)

    // pay 50 to test-power from credit card
    const ccTransaction = getRepository(Transaction).create({
      budgetId: budget.id,
      accountId: account.id,
      categoryId: paymentCategory.id,
      payeeId: payee.id,
      amount: -50,
      date: new Date(),
    })
    await getRepository(Transaction).insert(ccTransaction)

    const ccCategory = await getRepository(Category).findOne({ trackingAccountId: account.id })
    const ccCategoryMonth = await getRepository(CategoryMonth).findOne({
      categoryId: ccCategory.id,
      month: Transaction.getMonth(ccTransaction.date),
    })

    account = await getRepository(Account).findOne(account.id)
    const paymentCategoryMonth = await getRepository(CategoryMonth).findOne({
      categoryId: 'test-power',
      month: Transaction.getMonth(ccTransaction.date),
    })

    expect(ccCategoryMonth.balance).toBe(50)
    expect(account.balance).toBe(-50)
    expect(paymentCategoryMonth.balance).toBe(-50)
  })

  it('Credit card transfer reduces CC category', async () => {
    const budget = await getRepository(Budget).findOne({ id: 'test-budget' })

    // Initial amount for Checking transfer
    let checkingAccount = await getRepository(Account).findOne({ budgetId: budget.id, name: 'Checking' })
    let ccAccount = await getRepository(Account).findOne({ budgetId: budget.id, name: 'Visa' })

    // Transfer 50 checking -> credit card for payment
    const transaction = getRepository(Transaction).create({
      budgetId: budget.id,
      accountId: checkingAccount.id,
      categoryId: null,
      payeeId: ccAccount.transferPayeeId,
      amount: -50,
      date: new Date(),
      handleTransfers: true,
    })
    await getRepository(Transaction).insert(transaction)

    checkingAccount = await getRepository(Account).findOne(checkingAccount.id)
    ccAccount = await getRepository(Account).findOne(ccAccount.id)

    const ccCategory = await getRepository(Category).findOne({ trackingAccountId: ccAccount.id })
    const ccCategoryMonth = await getRepository(CategoryMonth).findOne({
      categoryId: ccCategory.id,
      month: Transaction.getMonth(transaction.date),
    })

    expect(ccCategoryMonth.balance).toBe(0)
    expect(ccAccount.balance).toBe(0)
  })

  it('Credit card inflow should account for CC category and target category', async () => {
    const budget = await getRepository(Budget).findOne({ id: 'test-budget' })

    // Initial amount for Checking transfer
    let checkingAccount = await getRepository(Account).findOne({ budgetId: budget.id, name: 'Checking' })
    let ccAccount = await getRepository(Account).findOne({ budgetId: budget.id, name: 'Visa' })
    let paymentCategory = await getRepository(Category).findOne({ id: 'test-power' })
    let payee = await getRepository(Payee).findOne({ budgetId: budget.id, name: 'Power company' })

    // 'reimbursement' of 10 to credit card from test-power
    const transaction = getRepository(Transaction).create({
      budgetId: budget.id,
      accountId: ccAccount.id,
      categoryId: paymentCategory.id,
      payeeId: payee.id,
      amount: 10,
      date: new Date(),
    })
    await getRepository(Transaction).insert(transaction)

    ccAccount = await getRepository(Account).findOne(ccAccount.id)

    const ccCategory = await getRepository(Category).findOne({ trackingAccountId: ccAccount.id })
    const ccCategoryMonth = await getRepository(CategoryMonth).findOne({
      categoryId: ccCategory.id,
      month: Transaction.getMonth(transaction.date),
    })
    const paymentCategoryMonth = await getRepository(CategoryMonth).findOne({
      categoryId: paymentCategory.id,
      month: Transaction.getMonth(transaction.date),
    })

    expect(ccCategoryMonth.balance).toBe(-10)
    expect(ccAccount.balance).toBe(10)
    expect(paymentCategoryMonth.balance).toBe(-40)
  })

  it('Deleting the budget should delete all accounts, transactions, etc.', async () => {
    await getRepository(Budget).clear()

    expect((await getRepository(Account).find(undefined)).length).toBe(0)
    expect((await getRepository(Transaction).find(undefined)).length).toBe(0)
    expect((await getRepository(Payee).find(undefined)).length).toBe(0)
    expect((await getRepository(BudgetMonth).find(undefined)).length).toBe(0)
    expect((await getRepository(CategoryMonth).find(undefined)).length).toBe(0)
  })
})
