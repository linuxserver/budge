import React, { useState } from "react";
import MaterialTable, { MTableBodyRow, MTableEditField } from "@material-table/core";
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from "react-router";
import { createPayee, fetchAccounts, fetchPayees } from "../redux/slices/Accounts";
import { createTransaction, deleteTransaction, updateTransaction } from "../redux/slices/Transactions";
import { TableIcons } from '../utils/Table'
import { formatMonthFromDateString, getDateFromString } from "../utils/Date";
import { fetchBudgetMonth, fetchBudgetMonths, fetchCategoryMonths, refreshBudget } from "../redux/slices/Budgets";
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import IconButton from '@mui/material/IconButton';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/Lock';

export default function Account(props) {
  const params = useParams()
  const accountId = params.accountId

  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const account = useSelector(state => state.accounts.accountById[accountId])
  const budgetId = useSelector(state => state.budgets.activeBudget.id)
  const transactions = useSelector(state => {
    if (state.transactions.transactions[accountId]) {
      return state.transactions.transactions[accountId]
    }

    return []
  })
  const payeeIds = useSelector(state => state.accounts.payees.map(payee => payee.id))
  const categoriesMap = useSelector(
    state => state.categories.categories.reduce(
      (acc, category) => {
        acc[category.id] = category.name
        return acc
      }, {}
    )
  )
  const payeesMap = useSelector(
    state => state.accounts.payees.reduce(
      (acc, payee) => {
        acc[payee.id] = payee.name
        return acc
      }, {}
    )
  )

  const filter = createFilterOptions()
  const columns = [
    {
      title: "Date",
      field: "date",
      type: "date",
      initialEditValue: new Date(),
      editComponent: props => (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label=""
            value={props.value || null}
            onChange={props.onChange}
            renderInput={(params) => <TextField variant="standard" {...params} />}
          />
        </LocalizationProvider>
      ),
    },
    {
      title: "Payee",
      field: "payeeId",
      lookup: payeesMap,
      editComponent: props => (
        <Autocomplete
          sx={{ width: 300 }}
          options={payeeIds}
          getOptionLabel={(option) => {
            if (payeesMap[option]) {
              return payeesMap[option]
            }

            return option
          }}
          // renderOption={(props, option) => <li {...props}>{option.name}</li>}
          freeSolo
          renderInput={(params) => <TextField {...params} label="" variant="standard" />}
          value={props.value}
          onInputChange={(e, value) => {
            props.onChange(value)
          }}
          onChange={(e, value) => {
            props.onChange(value)
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            const { inputValue } = params;
            if (inputValue.match(/New: /)) {
              return filtered
            }

            // Suggest the creation of a new value
            const isExisting = options.some((option) => payeesMap[option] === inputValue);
            if (inputValue !== '' && !isExisting) {
              filtered.push(`New: ${inputValue}`);
            }

            return filtered;
          }}
        />
      )
    },
    {
      title: "Category",
      field: "categoryId",
      lookup: categoriesMap,
      editComponent: props => (
        <MTableEditField
          { ...props }
          variant="standard"
        />
      ),
    },
    { title: "memo", field: "memo" },
    { title: "Outflow", field: "outflow", type: "currency" },
    { title: "Inflow", field: "inflow", type: "currency" },
    {
      title: "Status",
      field: "status",
      editable: "never",
      render: rowData => {
        let statusIcon = <></>
        switch (rowData.status) {
          case 0: // pending
            statusIcon = <AccessTimeIcon />
            break
          case 1: // cleared
            statusIcon = <CheckCircleOutlineIcon />
            break
          case 2: // reconciled
            statusIcon = <LockIcon />
            break
        }

        return (
          <IconButton
            size="small"
            aria-label="transaction status"
            onClick={() => setTransactionStatus(rowData)}
            color="inherit"
          >
            {statusIcon}
          </IconButton>
        )
      },
    },
  ]

  const createNewPayee = async (name) => {
    name = name.replace(/^New: /, '')
    return (await dispatch(createPayee({
      name,
      budgetId,
    }))).payload
  }

  const onTransactionAdd = async (newRow) => {
    if (!payeesMap[newRow.payeeId]) {
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
        status: 0,
      }
    }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newRow.date) }))
    dispatch(refreshBudget())
    dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    dispatch(fetchBudgetMonths())
    dispatch(fetchPayees())
    dispatch(fetchAccounts())
  }

  const setTransactionStatus = (rowData) => {
    if (rowData.status === 2) {
      // already reconciled
      return
    }

    onTransactionEdit({
      ...rowData,
      status: rowData.status === 0 ? 1 : 0,
    }, { ...rowData })
  }

  const onTransactionEdit = async (newData, oldData) => {
    console.log(newData)
    if (!payeesMap[newData.payeeId]) {
      // @TODO: Fix : Because of the 'onInputChange' autocomplete, the edited value gets subbed out for the 'text' value. Make sure this doesn't truly already exist.
      const payee = Object.keys(payeesMap).find(key => payeesMap[key] === newData.payeeId)
      if (!payee) {
        newData.payeeId = (await createNewPayee(newData.payeeId)).id
      } else {
        newData.payeeId = payee
      }
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
        status: newData.status,
      }
    }))

    dispatch(fetchPayees())


    dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newData.date) }))
    dispatch(fetchCategoryMonths({ categoryId: newData.categoryId }))
    if (oldData.categoryId !== newData.categoryId) {
      dispatch(fetchCategoryMonths({ categoryId: oldData.categoryId }))
      dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(oldData.date) }))
    }

    dispatch(refreshBudget())
    dispatch(fetchBudgetMonths())
    dispatch(fetchAccounts())
  }

  const onTransactionDelete = async (transaction) => {
    await dispatch(deleteTransaction({ transaction }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(transaction.date) }))
    dispatch(fetchCategoryMonths({ categoryId: transaction.categoryId }))
    dispatch(fetchAccounts())
    dispatch(refreshBudget())
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ align: 'left' }}>
        {account.cleared} + {account.uncleared} = {account.balance}
      </div>
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
