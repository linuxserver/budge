import React, { useState } from "react";
import MaterialTable, { MTableBodyRow } from "@material-table/core";
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from "react-router";
import { createAccount } from "../redux/slices/Accounts";
import { createTransaction, deleteTransaction, updateTransaction } from "../redux/slices/Transactions";
import { TableIcons } from '../utils/Table'
import { formatMonthFromDateString, getDateFromString } from "../utils/Date";
import { fetchBudgetMonth, fetchBudgetMonths, fetchCategoryMonths } from "../redux/slices/Budgets";
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

export default function Account(props) {
  const params = useParams()
  const accountId = params.accountId

  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const budgetId = useSelector(state => state.budgets.activeBudget.id)
  const transactions = useSelector(state => {
    if (state.transactions.transactions[accountId]) {
      return state.transactions.transactions[accountId]
    }

    return []
  })
  const accounts = useSelector(state => state.accounts.accounts)
  const accountIds = useSelector(state => state.accounts.accounts.map(account => account.id))
  const categoriesMap = useSelector(
    state => state.categories.categories.reduce(
      (acc, category) => {
        acc[category.id] = category.name
        return acc
      }, {}
    )
  )
  const accountsMap = useSelector(
    state => state.accounts.accounts.reduce(
      (acc, account) => {
        acc[account.id] = account.name
        return acc
      }, {}
    )
  )

  const filter = createFilterOptions()
  const columns = [
    { title: "Date", field: "date", type: "date", default: formatMonthFromDateString(new Date()) },
    { title: "Category", field: "categoryId", lookup: categoriesMap },
    { title: "Payee", field: "payeeId", lookup: accountsMap, editComponent: props => (
      <Autocomplete
        sx={{ width: 300 }}
        // value={transactionPayeeField}
        options={accountIds}
        getOptionLabel={(option) => {
          if (accountsMap[option]) {
            return accountsMap[option]
          }

          return option
        }}
        // renderOption={(props, option) => <li {...props}>{option.name}</li>}
        freeSolo
        renderInput={(params) => <TextField {...params} label="" variant="standard" />}
        value={props.value}
        onChange={(e, value) => {
          props.onChange(value)
        }}
        onInputChange={(e, value) => {
          props.onChange(value)
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          if (inputValue.match(/New: /)) {
            return filtered
          }

          // Suggest the creation of a new value
          const isExisting = options.some((option) => accountsMap[option] === inputValue);
          if (inputValue !== '' && !isExisting) {
            filtered.push(`New: ${inputValue}`);
          }

          return filtered;
        }}
      />
    )},
    { title: "memo", field: "memo" },
    { title: "Inflow", field: "inflow", type: "currency" },
    { title: "Outflow", field: "outflow", type: "currency" },
  ]

  const createNewPayee = async (name) => {
    name = name.replace(/^New: /, '')
    return (await dispatch(createAccount({
      name,
      accountType: 2,
      budgetId,
    }))).payload
  }

  const onTransactionAdd = async (newRow) => {
    // @TODO: add support for adding payees at transaction creation
    if (!accountsMap[newRow.payeeId]) {
      newRow.payeeId = (await createNewPayee(newRow.payeeId)).id
    }

    await dispatch(createTransaction({
      transaction: {
        accountId,
        amount: newRow.inflow ? newRow.inflow : newRow.outflow * -1,
        date: newRow.date,
        memo: newRow.memo,
        payeeId: newRow.payeeId,
        categoryId: newRow.categoryId,
        status: 0, // @TODO: fix
      }
    }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newRow.date) }))
    dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    dispatch(fetchBudgetMonths())
  }

  const onTransactionEdit = async (newData, oldData) => {
    if (!accountsMap[newData.payeeId]) {
      newData.payeeId = (await createNewPayee(newData.payeeId)).id
    }

    await dispatch(updateTransaction({
      transaction: {
        id: newData.id,
        accountId,
        date: newData.date,
        memo: newData.memo,
        payeeId: newData.payeeId,
        categoryId: newData.categoryId,
        amount: newData.inflow ? newData.inflow : newData.outflow * -1,
        status: 1,
      }
    }))

    await Promise.all([
      dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newData.date) })),
      dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(oldData.date) })),
    ])

    Promise.all([
      dispatch(fetchCategoryMonths({ categoryId: oldData.categoryId })),
      dispatch(fetchCategoryMonths({ categoryId: newData.categoryId })),
      dispatch(fetchBudgetMonths()),
    ])
  }

  const onTransactionDelete = async (transaction) => {
    await dispatch(deleteTransaction({ transaction }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(transaction.date) }))
    dispatch(fetchCategoryMonths({ categoryId: transaction.categoryId }))
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <MaterialTable
        title="Transactions"
        options={{
          padding: "dense",
          paging: false,
          showTitle: false,
          search: false,
        }}
        components={{
          Row: props => (
            <MTableBodyRow
              {...props}
              onDoubleClick={(e) => {
                console.log(props.actions) // <---- HERE : Get all the actions
                props.actions[1]().onClick(e,props.data); // <---- trigger edit event
              }}
            />
          )
        }}
        icons={TableIcons}
        columns={columns}
        data={transactions}
        editable={{
          onRowAdd: async (row) => {
            await onTransactionAdd(row)
          },
          onRowUpdate: async (newData, oldData) => {
            await onTransactionEdit(newData, oldData)
          },
          onRowDelete: async (row) => {
            await onTransactionDelete(row)
          },
        }}
      />
    </div>
  )
}
