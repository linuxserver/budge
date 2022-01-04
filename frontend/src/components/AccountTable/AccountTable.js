import React, { useState } from "react";
import MaterialTable, { MTableBodyRow, MTableEditField } from "@material-table/core";
import { useDispatch, useSelector, shallowEqual } from 'react-redux'
import { accountsSelectors, fetchAccounts, createTransaction, deleteTransaction, updateTransaction } from "../../redux/slices/Accounts";
import { createPayee, fetchPayees, selectPayeesMap } from "../../redux/slices/Payees";
import { TableIcons } from '../../utils/Table'
import { formatMonthFromDateString } from "../../utils/Date";
import { refreshBudget, fetchAvailableMonths } from "../../redux/slices/Budgets";
import { fetchBudgetMonth, fetchCategoryMonths } from '../../redux/slices/BudgetMonths'
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import IconButton from '@mui/material/IconButton';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import { FromAPI, inputToDinero, intlFormat } from '../../utils/Currency'
import { dinero, toUnit, isZero, multiply } from "dinero.js";
import { toSnapshot } from "@dinero.js/core";
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/styles'
import AccountTableHeader from './AccountTableHeader'
import _ from 'underscore'
import { payeesSelectors } from "../../redux/slices/Payees";
import { createSelector } from "@reduxjs/toolkit";
import { categoriesSelectors } from "../../redux/slices/Categories";

function StatusIconButton(props) {
  const handleClick = (e) => {
    e.stopPropagation()
    props.setTransactionStatus(props.rowData)
  }

  return (
    <IconButton
      size="small"
      style={{padding: 0}}
      aria-label="transaction status"
      onClick={handleClick}
      color="inherit"
    >
      {props.statusIcon}
    </IconButton>
  )
}

export default function Account(props) {
  // const whyDidYouRender = true

  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => accountsSelectors.selectById(state, props.accountId))
  const accounts = useSelector(accountsSelectors.selectAll)

  const [showReconciled, setShowReconciled] = useState(false)
  const toggleReconciled = () => {
    setShowReconciled(!showReconciled)
  }

  const budgetId = useSelector(state => state.budgets.activeBudgetId)

  const selectTransactions = createSelector([
    (state, accountId) => state.accounts.entities[accountId].transactions.entities,
    (state, accountId, reconciled) => reconciled,
  ], (transactions, reconciled) => {
    if (!showReconciled) {
      return Object.values(transactions).filter(transaction => transaction.status !== 2).map(trx => FromAPI.transformTransaction(trx))
    }

    return Object.values(transactions).map(trx => FromAPI.transformTransaction(trx))
  })
  const transactions = useSelector(state => selectTransactions(state, props.accountId, showReconciled))

  const payeeIds = useSelector(payeesSelectors.selectIds)

  const selectCategoriesMap = createSelector(categoriesSelectors.selectAll, categories => {
    return categories.reduce(
      (acc, category) => {
        acc[category.id] = category.name
        return acc
      }, { '0': 'Category Not Needed' }
    )
  })
  const categoriesMap = useSelector(selectCategoriesMap)

  // const payeesMap = useSelector(selectPayeesMap)
  const payeesMap = useSelector(selectPayeesMap)

  let amountFieldFocused = null
  let amountFieldModified = false
  const focusAmountField = (field) => {
    amountFieldFocused = field
    amountFieldModified = false
  }
  const focusOutflowField = () => focusAmountField('outflow')
  const focusInflowField = () => focusAmountField('inflow')

  const filter = createFilterOptions()
  const columns = [
    {
      title: "Date",
      field: "date",
      type: "date",
      initialEditValue: new Date(),
      defaultSort: 'desc',
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
            const transferAccount = accounts.filter(account => account.transferPayeeId === value)
            const updateProps = {}
            if (transferAccount.length === 1 && transferAccount[0].type !== 2) {
              updateProps.categoryId = '0'
            } else if (props.rowData.categoryId === '0') {
              updateProps.categoryId = Object.keys(categoriesMap)[1]
            }

            const newRow = {
              ...props.rowData,
              payeeId: value,
              ...updateProps,
            }

            return props.onRowDataChange(newRow)
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
      ),
      render: rowData => (
        <Tooltip title={payeesMap[rowData.payeeId]}>
          <span style={{
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {payeesMap[rowData.payeeId]}
          </span>
        </Tooltip>
      )
    },
    ...(account.type !== 2 ? [{
      title: "Category",
      field: "categoryId",
      lookup: categoriesMap,
      editComponent: function (props) {
        const disabled = props.rowData.categoryId === '0'
        props.columnDef.lookup = {...categoriesMap}
        if (disabled === false) {
          delete props.columnDef.lookup['0']
        }

        return (
          <MTableEditField
            { ...props }
            variant="standard"
            disabled={disabled}
          />
        )
      },
    }] : []),
    {
      title: "Memo",
      field: "memo",
      render: rowData => (
        <Tooltip title={rowData.memo}>
          <span style={{
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {rowData.memo}
          </span>
        </Tooltip>
      )
    },
    {
      title: "Outflow",
      field: "outflow",
      type: "currency",
      initialEditValue: toSnapshot(inputToDinero(0)),
      render: rowData => {
        if (isZero(rowData.outflow)) {
          return ''
        }
        return intlFormat(rowData.outflow)
      },
      editComponent: props => {
        if (amountFieldModified === true && amountFieldFocused !== 'outflow') {
          props.value.amount = 0
        }

        const value = dinero(props.value)
        return (
          <MTableEditField
            { ...props }
            variant="standard"
            value={toUnit(value, { digits: 2 })}
            onChange={value => {
              if (amountFieldFocused === 'outflow') {
                amountFieldModified = true
                props.onChange(toSnapshot(inputToDinero(value)))
              }
            }}
            onFocus={focusOutflowField}
          />
        )
      },
    },
    {
      title: "Inflow",
      field: "inflow",
      type: "currency",
      initialEditValue: toSnapshot(inputToDinero(0)),
      render: rowData => {
        if (isZero(rowData.inflow)) {
          return ''
        }
        return intlFormat(rowData.inflow)
      },
      editComponent: props => {
        if (amountFieldModified === true && amountFieldFocused !== 'inflow') {
          props.value.amount = 0
        }

        const value = dinero(props.value)
        return (
          <MTableEditField
            { ...props }
            variant="standard"
            value={toUnit(value, { digits: 2 })}
            onChange={value => {
              if (amountFieldFocused === 'inflow') {
                amountFieldModified = true
                props.onChange(toSnapshot(inputToDinero(value)))
              }
            }}
            onFocus={focusInflowField}
          />
        )
      },
    },
    {
      title: "Status",
      field: "status",
      editComponent: props => (<></>), // Doing this so that the button isn't available to click when in edit mode
      render: rowData => {
        let statusIcon = <></>
        let tooltipText = ''
        switch (rowData.status) {
          case 0: // pending
            tooltipText = "Pending"
            statusIcon = <AccessTimeIcon color="disabled" fontSize="small" />
            break
          case 1: // cleared
            tooltipText = "Cleared"
            statusIcon = <CheckCircleOutlineIcon color="success" fontSize="small" />
            break
          case 2: // reconciled
            tooltipText = "Reconciled"
            statusIcon = <LockIcon color="success" fontSize="small" />
            break
        }

        return (
          <Tooltip title={tooltipText}>
            <StatusIconButton
              rowData={rowData}
              setTransactionStatus={setTransactionStatus}
              statusIcon={statusIcon}
            />
          </Tooltip>
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
    let refreshPayees = false

    if (!payeesMap[newRow.payeeId]) {
      newRow.payeeId = (await createNewPayee(newRow.payeeId)).id
    }

    const inflow = dinero(newRow.inflow)
    const outflow = dinero(newRow.outflow)
    let amount = null
    if (isZero(inflow)) {
      amount = multiply(outflow, -1)
    } else {
      amount = inflow
    }

    await dispatch(createTransaction({
      transaction: {
        accountId: props.accountId,
        amount,
        date: newRow.date,
        memo: newRow.memo,
        payeeId: newRow.payeeId,
        categoryId: newRow.categoryId === '0' ? null : newRow.categoryId,
        status: 0,
      }
    }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newRow.date) }))
    dispatch(refreshBudget())
    dispatch(fetchAvailableMonths())

    if (newRow.categoryId && newRow.categoryId !== '0') {
      dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    }
    if (refreshPayees === true) {
      dispatch(fetchPayees())
    }
  }

  const setTransactionStatus = (rowData) => {
    console.log(rowData)
    if (rowData.status === 2) {
      // already reconciled
      return
    }

    onTransactionEdit({
      ...rowData,
      status: rowData.status === 0 ? 1 : 0,
      amount: toSnapshot(rowData.amount),
      inflow: toSnapshot(rowData.inflow),
      outflow: toSnapshot(rowData.outflow),
    }, { ...rowData })
  }

  const onTransactionEdit = async (newRow, oldData) => {
    let refreshPayees = false

    if (!payeesMap[newRow.payeeId]) {
      // @TODO: Fix : Because of the 'onInputChange' autocomplete, the edited value gets subbed out for the 'text' value. Make sure this doesn't truly already exist.
      const payee = Object.keys(payeesMap).find(key => payeesMap[key] === newRow.payeeId)
      if (!payee) {
        refreshPayees = true
        newRow.payeeId = (await createNewPayee(newRow.payeeId)).id
      } else {
        newRow.payeeId = payee
      }
    }

    const inflow = dinero(newRow.inflow)
    const outflow = dinero(newRow.outflow)
    let amount = null
    if (isZero(inflow)) {
      amount = multiply(outflow, -1)
    } else {
      amount = inflow
    }

    await dispatch(updateTransaction({
      transaction: {
        id: newRow.id,
        accountId: props.accountId,
        date: newRow.date,
        memo: newRow.memo,
        payeeId: newRow.payeeId,
        categoryId: newRow.categoryId === '0' ? null : newRow.categoryId,
        amount,
        status: newRow.status,
      }
    }))

    if (refreshPayees === true ){
      dispatch(fetchPayees())
    }

    dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newRow.date) }))

    if (newRow.categoryId && newRow.categoryId !== '0') {
      dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    }

    if (oldData.categoryId !== newRow.categoryId) {
      if (oldData.categoryId && oldData.categoryId !== '0') {
        dispatch(fetchCategoryMonths({ categoryId: oldData.categoryId }))
        dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(oldData.date) }))
      }
    }

    dispatch(refreshBudget())
    dispatch(fetchAvailableMonths())
  }

  const onTransactionDelete = async (transaction) => {
    await dispatch(deleteTransaction({ transaction }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(transaction.date) }))
    if (transaction.categoryId && transaction.categoryId !== '0') {
      dispatch(fetchCategoryMonths({ categoryId: transaction.categoryId }))
    }
    dispatch(fetchAccounts())
    dispatch(refreshBudget())
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      <MaterialTable
        style={{
          display: "grid",
          gridTemplateColums: "1fr",
          gridTemplateRows: "auto 1fr auto",
          height: "100vh"
        }}
        title={(
          <AccountTableHeader
            account={FromAPI.transformAccount(account)}
          />
        )}
        options={{
          padding: "dense",
          draggable: false,
          pageSize: 20,
          addRowPosition: 'first',
          rowStyle: rowData => ({
            fontSize: theme.typography.subtitle2.fontSize,
          }),
          headerStyle: {
            position: 'sticky',
            top: 0,
            textTransform: 'uppercase',
            fontSize: theme.typography.caption.fontSize,
          },
        }}
        components={{
          Row: props => (
            <MTableBodyRow
              {...props}
              onRowClick={(e) => {
                // console.log(props.actions)
                props.actions[2]().onClick(e, props.data); // <---- trigger edit event
              }}
            />
          )
        }}
        // localization={{
        //   header : {
        //      actions: ''
        //   }
        // }}
        icons={TableIcons}
        columns={columns}
        data={transactions}
        editable={{
          onRowAdd: async (row) => {
            await onTransactionAdd(row)
          },
          onRowUpdate: async (newRow, oldData) => {
            await onTransactionEdit(newRow, oldData)
          },
          onRowDelete: async (row) => {
            await onTransactionDelete(row)
          },
        }}
        actions={[
          {
            icon: () => (
              <LockIcon
                style={{
                  color: showReconciled ? theme.palette.text.primary : theme.palette.text.disabled,
                }}
              />
            ),
            tooltip: 'Show reconciled transactions',
            isFreeAction: true,
            onClick: toggleReconciled
          },
          // {
          //   icon: MoreVertIcon,
          //   tooltip: "More",
          //   onClick: openRowActions,
          // },
        ]}
      />
    </div>
  )
}
