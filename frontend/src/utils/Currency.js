import { dinero, toFormat, isPositive, isNegative, multiply, toUnit } from 'dinero.js'
import { USD } from '@dinero.js/currencies'

export function inputToDinero(amount) {
  return dinero({ amount: parseInt(amount * 100), currency: USD })
}

export function intlFormat(dineroObject, locale, options = {}) {
  if (!dineroObject) {
    dineroObject = dinero({ amount: 0, currency: USD })
  }
  function transformer({ amount, currency }) {
    return amount.toLocaleString(locale, {
      ...options,
      style: 'currency',
      currency: currency.code,
    })
  }

  return toFormat(dineroObject, transformer)
}

export function valueToDinero(value) {
  return dinero({ amount: value, currency: USD })
}

export function valueToUnit(value) {
  return toUnit(valueToDinero(value), { digits: 2 })
}

export function dineroToValue(dineroObj) {
  return dineroObj.toJSON().amount
}

export function getBalanceColor(amount, theme) {
  if (isNegative(amount)) {
    return theme.palette.error.main
  }

  return theme.palette.success.main
}

export class ToAPI {
  static transformTransaction(transaction) {
    return {
      ...transaction,
      amount: transaction.amount.toJSON().amount,
    }
  }
}

export class FromAPI {
  static transformBudget(budget) {
    budget.toBeBudgeted = dinero({ amount: budget.toBeBudgeted, currency: USD })
    budget.accounts = budget.accounts.map(account => FromAPI.transformAccount(account))

    return budget
  }

  static transformAccount(account) {
    return {
      ...account,
      balance: dinero({ amount: account.balance, currency: USD }),
      cleared: dinero({ amount: account.cleared, currency: USD }),
      uncleared: dinero({ amount: account.uncleared, currency: USD }),
    }
  }

  static transformTransaction(transaction) {
    const amount = dinero({ amount: transaction.amount, currency: USD })
    return {
      ...transaction,
      amount: amount,
      inflow: isPositive(amount) ? amount : dinero({ amount: 0, currency: USD }),
      outflow: isNegative(amount) ? multiply(amount, -1) : dinero({ amount: 0, currency: USD }),
    }
  }

  static transformBudgetMonth(budgetMonth) {
    return {
      ...budgetMonth,
      income: dinero({ amount: budgetMonth.income, currency: USD }),
      activity: dinero({ amount: budgetMonth.activity, currency: USD }),
      budgeted: dinero({ amount: budgetMonth.budgeted, currency: USD }),
      underfunded: dinero({ amount: budgetMonth.underfunded, currency: USD }),
    }
  }

  static transformCategoryMonth(categoryMonth) {
    return {
      ...categoryMonth,
      budgeted: dinero({ amount: categoryMonth.budgeted, currency: USD }),
      activity: dinero({ amount: categoryMonth.activity, currency: USD }),
      balance: dinero({ amount: categoryMonth.balance, currency: USD }),
    }
  }
}
