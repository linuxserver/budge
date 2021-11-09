import { budgets } from './stores/budgets'
import { user } from './stores/users'

export default {
  async ping() {
    try {
      const response = await (await this.makeRequest('/api/me')).json()
      user.set(response.data)
    } catch (err) {

    }
  },

  async login(email, password) {
    let response = await this.makeRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      })
    })

    const payload = await response.json()
    if (response.status === 200) {
      user.set(payload.data)
      return true
    }

    return false
  },

  async logout() {
    await this.makeRequest('/api/logout')
  },

  async getBudgets() {
    const response = await this.makeRequest('/api/budgets')
    const payload = await response.json()

    console.log(payload.data)
    budgets.set(payload.data)
  },

  async createBudget(name) {
    const response = await this.makeRequest('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        name,
      })
    })
  },

  async createAccount(name, type, budgetId) {
    const response = await this.makeRequest(`/api/budgets/${budgetId}/accounts`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        type,
      })
    })
    const payload = await response.json()
    console.log(payload)

    return payload.data
  },

  async makeRequest(url, options) {
    return await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      },
    })
  },
}
