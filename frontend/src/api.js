import Axios from 'axios'

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

  static async createBudget(name) {
    const response = await axios.post(`/api/budgets`, {
      name,
    })

    return response.data.data
  }

  static async fetchBudgets() {
    const response = await axios.get('/api/budgets')

    return response.data.data
  }

  static async createAccount(name, type, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/accounts`, {
      name, type
    })

    return response.data.data
  }

  static async fetchAccounts(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/accounts`)

    return response.data.data
  }

  static async fetchAccountTransactions(accountId, budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/accounts/${accountId}/transactions`)

    return response.data.data
  }

  static async createTransaction(transaction, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/transactions`, transaction)

    return response.data.data
  }

  static async updateTransaction(transaction, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/transactions/${transaction.id}`, transaction)

    return response.data.data
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
    const response = await axios.post(`/api/budgets/${budgetId}/categories/groups`, { name })

    return response.data.data
  }

  static async updateCategoryGroup(categoryGroupId, name, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/categories/groups/${categoryGroupId}`, { name })

    return response.data.data
  }

  static async createCategory(name, categoryGroupId, budgetId) {
    const response = await axios.post(`/api/budgets/${budgetId}/categories`, {
      name,
      categoryGroupId
    })

    return response.data.data
  }

  static async updateCategory(categoryId, name, categoryGroupId, budgetId) {
    const response = await axios.put(`/api/budgets/${budgetId}/categories/${categoryId}`, {
      name,
      categoryGroupId
    })

    return response.data.data
  }

  static async fetchBudgetMonth(budgetId, month) {
    const response = await axios.get(`/api/budgets/${budgetId}/months/${month}`)

    return response.data.data
  }

  static async fetchBudgetMonths(budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/months`)

    return response.data.data
  }

  static async fetchCategoryMonths(categoryId, budgetId) {
    const response = await axios.get(`/api/budgets/${budgetId}/categories/${categoryId}/months`)

    return response.data.data
  }

  static async updateCategoryMonth(budgetId, categoryId, month, budgeted) {
    const response = await axios.put(`/api/budgets/${budgetId}/categories/${categoryId}/${month}`, {
      budgeted,
    })

    return response.data.data
  }
}
