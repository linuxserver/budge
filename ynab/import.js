import got from 'got'
import csv from 'csv-parse'
import fs from 'fs'
import { POINT_CONVERSION_COMPRESSED } from 'constants'
import prompt from 'prompt'
import { dinero, multiply, toUnit } from 'dinero.js'
import { USD } from '@dinero.js/currencies'

async function readCSV(file) {
  return new Promise(resolve => {
    let rows = []
    let first = true
    fs.createReadStream(file)
      .pipe(csv({bom: true}))
      .on('data', function (row) {
        if (first === true) {
          first = false
          return
        }

        rows.push(row)
      })
      .on('end', function () {
        resolve(rows)
      })
  })
}

export function getDateFromCSVString(date) {
  let [month, day, year] = date.split('/')
  const newDate = new Date(`${year}-${month}-${day}T12:00:00`)
  newDate.setDate(newDate.getDate() + 1)
  return newDate
}

export function getDateFromAPIString(date) {
  let [year, month, day] = date.split('-').map(val => parseInt(val))
  const newDate = new Date(`${year}-${month}-${day}T12:00:00`)
  newDate.setDate(newDate.getDate() + 1)
  return newDate
}

class BudgE {
  constructor(host) {
    this.host = host
  }

  async login(email, password) {
    const response = (await this.makeRequest(`login`, 'post', { json: {
      email, password
    }}))
    this.token = response.token

    const budgets = await this.getBudgets()
    this.budgetId = budgets[0].id

    return response
  }

  async getBudgets() {
    const response = (await this.makeRequest(`budgets`)).data
    return response
  }

  async postTransaciton(payload) {
    const response = (await this.makeRequest(`budgets/${this.budgetId}/transactions`, 'post', { json: payload })).data
    return response
  }

  async findOrCreateAccount (name, type, balance, date) {
    const accounts = (await this.makeRequest(`budgets/${this.budgetId}/accounts`)).data
    let filtered = accounts.filter(account => account.name === name)
    if (filtered.length === 1) {
      return filtered[0]
    }

    return (await this.makeRequest(`budgets/${this.budgetId}/accounts`, 'post', { json: {
      name, type, balance: balance.toJSON().amount, date: date.toISOString().split('T')[0]
    } })).data
  }

  async findOrCreateCategoryGroup (name) {
    const categoryGroups = (await this.makeRequest(`budgets/${this.budgetId}/categories`)).data

    let filtered = categoryGroups.filter(group => group.name === name)
    if (filtered.length === 1) {
      return filtered[0]
    }

    try {
      return (await this.makeRequest(`budgets/${this.budgetId}/categories/groups`, 'post', { json: { name, order: 0 } })).data
    } catch (err) {
      console.log(err.response.body)
      process.exit()
    }
  }

  async findOrCreateCategory (name, categoryGroupId) {
    const categoryGroups = (await this.makeRequest(`budgets/${this.budgetId}/categories`)).data
    const categories = categoryGroups.reduce((acc, group) => {
      return acc.concat(group.categories)
    }, [])

    let filtered = categories.filter(category => category.name === name)
    if (filtered.length === 1) {
      return filtered[0]
    }

    try {
      console.log(`Creating category ${name}`)
      return (await this.makeRequest(`budgets/${this.budgetId}/categories`, 'post', { json: { name, categoryGroupId, order: 0 } })).data
    } catch (err) {
      console.log(err.response.body)
      process.exit()
    }
  }

  async findOrCreatePayee(name) {
    const payees = (await this.makeRequest(`budgets/${this.budgetId}/payees`)).data

    let filtered = payees.filter(payee => payee.name === name)
    if (filtered.length === 1) {
      return filtered[0]
    }

    try {
      return (await this.makeRequest(`budgets/${this.budgetId}/payees`, 'post', { json: { name } })).data
    } catch (err) {
      console.log(err.response.body)
      process.exit()
    }
  }

  async updateCategoryMonth(categoryId, month, budgeted) {
    return (await this.makeRequest(`budgets/${this.budgetId}/categories/${categoryId}/${month}`, 'put', { json: { budgeted } })).data
  }

  async makeRequest(url, method = 'get', options = {}) {
    let response = await got[method](`${this.host}/api/${url}`, {
      ...options,
      headers: {
        'x-access-token': this.token,
        Accept: 'application/json',
      }
    })

    return JSON.parse(response.body)
  }
}

class YNAB {
  constructor(token, budgetId, registerFile, budgetFile) {
    this.token = token
    this.budgetId = budgetId
    this.registerFile = registerFile
    this.budgetFile = budgetFile
  }

  async getAccounts() {
    if (fs.existsSync(this.registerFile)) {
      return await this.getAccountsFromRegisterFile()
    }

    return (await this.makeRequest('accounts')).accounts
  }

  async getAccountsFromRegisterFile() {
    const rows = await readCSV(this.registerFile)
    let retval = []
    for (const row of rows) {
      retval.push(row[0])
    }

    retval = [...new Set(retval)]

    return retval.map(name => ({ name }))
  }

  async getBudgetMonths() {
    if (fs.existsSync(this.budgetFile)) {
      const rows = await readCSV(this.budgetFile)
      let dates = {}
      for (const row of rows) {
        if (row[0] === 'Month') {
          continue
        }

        if (!dates[row[0]]) {
          dates[row[0]] = 0
        }

        dates[row[0]] += parseFloat(row[4].replace('$', '')) * 1000
      }

      let retval = []
      for (const date in dates) {
        const year = (new Date(date)).getFullYear()
        const month = (new Date(date)).getMonth() + 1
        retval.push({
          budgeted: dates[date],
          month: `${year}-${month}-01`,
        })
      }

      return retval
    }

    return (await this.makeRequest('months')).months
  }

  async getCategoriesFromBudgetFile() {
    const rows = await readCSV(this.budgetFile)
    let groups = {}
    for (const row of rows) {
      if (!groups[row[2]]) {
        groups[row[2]] = new Set()
      }

      groups[row[2]].add(row[3])
    }

    let retval = []
    for (const group in groups) {
      groups[group] = [...groups[group]]
      retval.push({
        name: group,
        categories: groups[group].map(category => {
          return { name: category }
        })
      })

    }

    return retval
  }

  async getCategories() {
    if (fs.existsSync(this.budgetFile)) {
      return await this.getCategoriesFromBudgetFile()
    }

    return (await this.makeRequest('categories')).category_groups
  }

  async getCategoryMonthsFromBudgetFile() {
    let retval = []
    const rows = await readCSV(this.budgetFile)
    for (const row of rows) {
      let budgetDate = new Date(row[0])
      budgetDate.setHours(12)

      retval.push({
        "name": row[3],
        "month": budgetDate,
        "budgeted": parseInt(row[4].replace('$', '').replace('.', '')),
        "activity": parseInt(row[5].replace('$', '').replace('.', '')),
        "balance": parseInt(row[6].replace('$', '').replace('.', '')),
      })
    }

    retval = retval.sort(function(a,b){
      return b.date - a.date
    })

    return retval.map(catMonth => ({
      ...catMonth,
      month: catMonth.month.toISOString().split('T')[0],
    }))
  }

  async getCategoryMonths() {
    if (fs.existsSync(this.budgetFile)) {
      return await this.getCategoryMonthsFromBudgetFile()
    }

    // @TODO: fix
    return (await this.makeRequest(`months/${month}/categories/${categoryId}`)).category
  }

  async getCategoryMonthFromBudgetFile(categoryName, month) {
    const rows = await readCSV(this.budgetFile)
    for (const row of rows) {
      let budgetDate = new Date(row[0])
      if (`${budgetDate.getFullYear()}-${(budgetDate.getMonth()) + 1}-01` !== month) {
        continue
      }

      if (categoryName === row[3]) {
        return {
          "name": categoryName,
          "budgeted": parseFloat(row[4].replace('$', '')) * 1000,
          "activity": parseFloat(row[5].replace('$', '')) * 1000,
          "balance": parseFloat(row[6].replace('$', '')) * 1000,
        }
      }
    }
  }

  async getCategoryMonth(categoryId, categoryName, month) {
    if (fs.existsSync(this.budgetFile)) {
      return await this.getCategoryMonthFromBudgetFile(categoryName, month)
    }

    return (await this.makeRequest(`months/${month}/categories/${categoryId}`)).category
  }

  async getTransactionsFromRegisterFile() {
    const rows = await readCSV(this.registerFile)
    let retval = []
    for (const row of rows) {
      const outflow = parseInt(row[8].replace('$', '').replace('.', ''))
      const inflow = parseInt(row[9].replace('$', '').replace('.', ''))

      let amount = inflow
      if (outflow !== 0) {
        amount = outflow * -1
      }

      let status = 2
      switch (row[10].toLowerCase()) {
        case 'cleared':
          status = 1
          break
        case 'uncleared':
          status = 0
          break
      }
      retval.push({
        "original_date": row[2],
        "date": getDateFromCSVString(row[2]),
        "amount": dinero({ amount, currency: USD }),
        "memo": row[7],
        "status": status,
        "account_name": row[0],
        "payee_name": row[3],
        "category_name": row[6],
      })
    }

    return retval.sort(function(a,b){
      return b.date - a.date;
    })
  }

  async getTransactions() {
    if (fs.existsSync(this.registerFile)) {
      return await this.getTransactionsFromRegisterFile()
    }
    return (await this.makeRequest('transactions')).transactions.map(transaction => ({
      ...transaction,
      amount: dinero({ amount: transaction.amount, currency: USD, scale: 3 }),
      date: getDateFromAPIString(transaction.date)
    }))
  }

  async makeRequest(endpoint, method = 'get') {
    process.exit()
    console.log(`YNAB REQUEST: https://api.youneedabudget.com/v1/budgets/${this.budgetId}/${endpoint}`)
    return JSON.parse((await got[method](`https://api.youneedabudget.com/v1/budgets/${this.budgetId}/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    })).body).data
  }
}

(async () => {
  const loginInfo = (await prompt.get([
    {
      description: 'Budg-E URL (ex: https://budg-e.mydomain.com)',
      name: 'host',
      required: true,
    },
    {
      description: 'Budg-E email',
      name: 'email',
      required: true,
    }, {
      description: 'Budg-E password',
      name: 'password',
      hidden: true,
    }]
  ))

  const budge = new BudgE(loginInfo.host)
  await budge.login(loginInfo.email, loginInfo.password)

  const fileInfo = (await prompt.get([{
      description: 'Budget CSV Location',
      name: 'budget',
      required: true,
      default: "budget.csv",
    }, {
      description: 'Register CSV Location',
      name: 'register',
      required: true,
      default: "register.csv",
    }]
  ))
  const ynab = new YNAB('', '', fileInfo.register, fileInfo.budget)

  if (!fs.existsSync(fileInfo.register) || !fs.existsSync(fileInfo.budget)) {
    console.log("Budget or register file does not exist.")
    process.exit(1)
  }

  const importMap = []
  let ynab_accounts = await ynab.getAccounts()
  for (let ynab_account of ynab_accounts) {
    const run = (await prompt.get({
      name: 'yesno',
      message: `Import account ${ynab_account.name}?`,
      validator: /y[es]*|n[o]?/,
      warning: 'Must respond yes or no',
      default: 'no'
    })).yesno

    if (run === 'no') {
      continue
    }

    let newAccountType = null
    switch (ynab_account.type) {
      case 'checking':
      case 'savings':
        newAccountType = 0
      case 'creditCard':
        newAccountType = 1
        break
      case undefined:
        console.log(`\nAccount '${ynab_account.name}' type is unknown, specify the account type: `)
        newAccountType = (await prompt.get({
          name: 'accounttype',
          message: 'Account type is unknown, specify the account type: 0 = Bank, 1 = Credit Card, 2 = Tracking',
          validator: /0|1|2/,
          warning: 'Must respond 0, 1, or 2',
          default: 0,
        })).accounttype
        break
      default:
        console.log(`skipping account ${ynab_account.name}: ${ynab_account.type}`)
        continue
    }

    const transfer = (await prompt.get({
      name: 'transfer',
      message: `Run transfers for account ${ynab_account.name}?`,
      validator: /y[es]*|n[o]?/,
      warning: 'Must respond yes or no',
      default: 'no'
    })).transfer

    importMap.push({
      ...ynab_account,
      run_transfers: transfer,
      new_account_type: newAccountType,
    })
  }

  let category_groups = await ynab.getCategories()
  for (let category_group of category_groups) {
    // Skip auto-generated  CC group / categories
    if (category_group.name === 'Credit Card Payments') {
      continue
    }

    const categoryGroup = await budge.findOrCreateCategoryGroup(category_group.name)
    for (let ynab_category of category_group['categories']) {
      const category = await budge.findOrCreateCategory(ynab_category.name, categoryGroup.id)
    }
  }

  const transactions = (await ynab.getTransactions()).sort(function(a,b){
    return a.date - b.date
  })

  // Have to create all accounts before importing transactions because we handle transfers too
  for (const ynab_account of importMap) {
    let account = null

    // Create account with starting balance
    for (let transaction of transactions) {
      if (transaction.payee_name == "Starting Balance" && transaction.account_name === ynab_account.name) {
        console.log(`Setting starting balance of account ${ynab_account.name} to ${toUnit(transaction.amount)}`)

        if (ynab_account.new_account_type == 1) {
          account = await budge.findOrCreateAccount(ynab_account.name, ynab_account.new_account_type, multiply(transaction.amount, -1), transaction.date)
        } else {
          account = await budge.findOrCreateAccount(ynab_account.name, ynab_account.new_account_type, transaction.amount, transaction.date)
        }
      }
    }
  }

  for (const ynab_account of importMap) {
    const account = await budge.findOrCreateAccount(ynab_account.name)

    // Pull in transactions, but skip transfers until all accounts are in
    for (let transaction of transactions) {
      if (transaction.payee_name == "Starting Balance" || transaction.account_name !== ynab_account.name) {
        continue
      }

      if (transaction.payee_name.match(/Transfer : /)) {
        continue
      }

      console.log(`Importing transaction: ${transaction.payee_name}, ${toUnit(transaction.amount)}, ${transaction.date.toISOString().split('T')[0]}`)
      let category = null
      if (transaction.category_name === 'Ready to Assign') {
        transaction.category_name = 'To be Budgeted'
      }
      if (transaction.category_name) {
        category = await budge.findOrCreateCategory(transaction.category_name)
      }

      const payee = await budge.findOrCreatePayee(transaction.payee_name)
      await budge.postTransaciton({
        accountId: account.id,
        payeeId: payee.id,
        amount: transaction.amount.toJSON().amount,
        date: transaction.date.toISOString().split('T')[0],
        memo: transaction.memo,
        categoryId: category ? category.id : null,
        status: transaction.status,
      })
    }

    // Pull in transfer transactions
    if (ynab_account.run_transfers === 'yes') {
      for (let transaction of transactions) {
        if (transaction.account_name !== ynab_account.name) {
          continue
        }

        if (!transaction.payee_name.match(/Transfer : /)) {
          continue
        }

        console.log(`Importing transaction: ${transaction.payee_name}, ${toUnit(transaction.amount)}, ${transaction.date.toISOString().split('T')[0]}`)
        let category = null
        if (transaction.category_name === 'Ready to Assign') {
          transaction.category_name = 'To be Budgeted'
        }
        if (transaction.category_name) {
          category = await budge.findOrCreateCategory(transaction.category_name)
        }

        const payee = await budge.findOrCreatePayee(transaction.payee_name)
        await budge.postTransaciton({
          accountId: account.id,
          payeeId: payee.id,
          amount: transaction.amount.toJSON().amount,
          date: transaction.date.toISOString().split('T')[0],
          memo: transaction.memo,
          categoryId: category ? category.id : null,
          status: transaction.status,
        })
      }
    }
  }

  const categoryMonths = await ynab.getCategoryMonths()
  for (const categoryMonth of categoryMonths) {
    if (parseInt(categoryMonth.budgeted) !== 0) {
      const category = await budge.findOrCreateCategory(categoryMonth.name)
      console.log(`Updating category month ${category.name} - ${categoryMonth.month}: ${categoryMonth.budgeted}`)
      await budge.updateCategoryMonth(category.id, categoryMonth.month, categoryMonth.budgeted)
    }
  }
})()
