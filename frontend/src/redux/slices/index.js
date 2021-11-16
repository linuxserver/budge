import users from './Users'
import budgets from './Budgets'
import accounts from './Accounts'
import transactions from './Transactions'
import categories from './Categories'

export const reducers = ({
  users: users.reducer,
  budgets: budgets.reducer,
  accounts: accounts.reducer,
  transactions: transactions.reducer,
  categories: categories.reducer,
});

export const actions = ({
  users: users.actions,
  budgets: budgets.actions,
  accounts: accounts.actions,
  transactions: transactions.actions,
  categories: categories.actions,
});
