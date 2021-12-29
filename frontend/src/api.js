import Axios from 'axios'
import { FromAPI, ToAPI } from './utils/Currency'

const axios = Axios.create({
  withCredentials: true
})

export default class API {
  static async ping() {
    const response = await axios.get('/api/me')

    return response.data.data
  }

  static async createUser(email, password) {
    const response = await axios.post('/api/users', {
      email,
      password,
    })

    return response.data.data
  }

  static async login(email, password) {
    const response = await axios.post('/api/login', {
        email,
        password,
    })

    return response.data.data
  }

  static async logout() {
    const response = await axios.get('/api/logout')

    return response.data.data
  }

  static async createBudget(name) {
    const response = await axios.post(`/api/budgets`, {
      name,
    })

    return FromAPI.transformBudget(response.data.data)
  }

  static async fetchBudgets() {
    const response = await axios.get('/api/budgets')

    return response.data.data.map(budget => FromAPI.transformBudget(budget))
  }

  static async fetchBudget(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}`)

    return FromAPI.transformBudget(response.data.data)
  }

  static async createAccount(name, type, balance, date, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/accounts`, {
      name, type, balance: balance.toJSON().amount, date
    })

    return FromAPI.transformAccount(response.data.data)
  }

  static async updateAccount(id, name, order, balance, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/accounts/${id}`, {
      ...name && { name },
      ...balance && { balance: balance.toJSON().amount },
      ...order && { order },
    })

    return FromAPI.transformAccount(response.data.data)
  }

  static async fetchAccounts(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/accounts`)

    return response.data.data.map(account => FromAPI.transformAccount(account))
  }

  static async createPayee(name, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/payees`, { name })

    return response.data.data
  }

  static async fetchPayees(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/payees`)

    return response.data.data
  }

  static async fetchAccountTransactions(accountId, budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/accounts/${accountId}/transactions`)

    return response.data.data.map(transaction => FromAPI.transformTransaction(transaction))
  }

  static async createTransaction(transaction, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/transactions`, ToAPI.transformTransaction(transaction))

    return FromAPI.transformTransaction(response.data.data)
  }

  static async updateTransaction(transaction, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/transactions/${transaction.id}`, ToAPI.transformTransaction(transaction))

    return FromAPI.transformTransaction(response.data.data)
  }

  static async deleteTransaction(transactionId, budgetId) {
    const response = await axios.delete(`/api/budgets/${budgetId}/transactions/${transactionId}`)

    return response.data.data
  }

  static async fetchCategories(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/categories`)

    return response.data.data
  }

  static async createCategoryGroup(name, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/categories/groups`, { name, order: 0 })

    return response.data.data
  }

  static async updateCategoryGroup(categoryGroupId, name, order, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/categories/groups/${categoryGroupId}`, { name, order })

    return response.data.data
  }

  static async createCategory(name, categoryGroupId, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/categories`, {
      name,
      order: 0,
      categoryGroupId,
    })

    return response.data.data
  }

  static async updateCategory(categoryId, name, order, categoryGroupId, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/categories/${categoryId}`, {
      name,
      order,
      categoryGroupId,
    })

    return response.data.data
  }

  static async fetchBudgetMonth(budgetId, month) {
    const response = await axios.get(`/api/budgets/${budgetId}/months/${month}`)

    return FromAPI.transformBudgetMonth(response.data.data)
  }

  static async fetchBudgetMonths(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/months`)

    return response.data.data.map(budgetMonth => FromAPI.transformBudgetMonth(budgetMonth))
  }

  static async fetchCategoryMonths(categoryId, budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/categories/${categoryId}/months`)

    return response.data.data.map(categoryMonth => FromAPI.transformCategoryMonth(categoryMonth))
  }

  static async updateCategoryMonth(budgetId, categoryId, month, budgeted) {
    const response = await axios.put(`/api/budgets/${budgetId}/categories/${categoryId}/${month}`, {
      budgeted: budgeted.toJSON().amount,
    })

    return FromAPI.transformCategoryMonth(response.data.data)
  }
}
