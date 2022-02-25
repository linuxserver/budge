import { dinero, toFormat, isPositive, isNegative, multiply } from 'dinero.js'
import * as currencies from '@dinero.js/currencies'

export class Currency {
  static CURRENCY = 'EUR'

  static getCurrency() {
    return Currency.CURRENCY
  }

  static setCurrency(currency) {
    Currency.CURRENCY = currency
  }

  static getAvailableCurrencies() {
    return Object.keys(currencies)
  }

  static inputToDinero(amount) {
    return dinero({ amount: parseInt(amount * 100), currency: currencies[Currency.getCurrency()] })
  }

  static intlFormat(dineroObject, locale, options = {}) {
    if (!dineroObject) {
      dineroObject = dinero({ amount: 0, currency: currencies[Currency.getCurrency()] })
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

  static valueToDinero(value) {
    return dinero({ amount: value, currency: currencies[Currency.getCurrency()] })
  }
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
    budget.toBeBudgeted = dinero({ amount: budget.toBeBudgeted, currency: currencies[Currency.getCurrency()] })
    budget.accounts = budget.accounts.map(account => FromAPI.transformAccount(account))

    return budget
  }

  static transformAccount(account) {
    return {
      ...account,
      balance: dinero({ amount: account.balance, currency: currencies[Currency.getCurrency()] }),
      cleared: dinero({ amount: account.cleared, currency: currencies[Currency.getCurrency()] }),
      uncleared: dinero({ amount: account.uncleared, currency: currencies[Currency.getCurrency()] }),
    }
  }

  static transformTransaction(transaction) {
    const amount = dinero({ amount: transaction.amount, currency: currencies[Currency.getCurrency()] })
    return {
      ...transaction,
      amount: amount,
      inflow: isPositive(amount) ? amount : dinero({ amount: 0, currency: currencies[Currency.getCurrency()] }),
      outflow: isNegative(amount)
        ? multiply(amount, -1)
        : dinero({ amount: 0, currency: currencies[Currency.getCurrency()] }),
    }
  }

  static transformBudgetMonth(budgetMonth) {
    return {
      ...budgetMonth,
      income: dinero({ amount: budgetMonth.income, currency: currencies[Currency.getCurrency()] }),
      activity: dinero({ amount: budgetMonth.activity, currency: currencies[Currency.getCurrency()] }),
      budgeted: dinero({ amount: budgetMonth.budgeted, currency: currencies[Currency.getCurrency()] }),
      underfunded: dinero({ amount: budgetMonth.underfunded, currency: currencies[Currency.getCurrency()] }),
    }
  }

  static transformCategoryMonth(categoryMonth) {
    return {
      ...categoryMonth,
      budgeted: dinero({ amount: categoryMonth.budgeted, currency: currencies[Currency.getCurrency()] }),
      activity: dinero({ amount: categoryMonth.activity, currency: currencies[Currency.getCurrency()] }),
      balance: dinero({ amount: categoryMonth.balance, currency: currencies[Currency.getCurrency()] }),
    }
  }
}
