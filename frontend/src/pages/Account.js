import React, { useState } from "react";
import MaterialTable, { MTableBodyRow, MTableEditField } from "@material-table/core";
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from "react-router";
import { createPayee, fetchAccounts, fetchPayees, editAccount } from "../redux/slices/Accounts";
import { createTransaction, deleteTransaction, updateTransaction } from "../redux/slices/Transactions";
import { TableIcons } from '../utils/Table'
import { formatMonthFromDateString } from "../utils/Date";
import { fetchBudgetMonth, fetchBudgetMonths, fetchCategoryMonths, refreshBudget } from "../redux/slices/Budgets";
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import IconButton from '@mui/material/IconButton';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import { inputToDinero, intlFormat } from '../utils/Currency'
import { dinero, toUnit, isZero, isNegative, multiply } from "dinero.js";
import { toSnapshot } from "@dinero.js/core";
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover'
import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/styles'
import ReconcileForm from '../components/ReconcileForm'

export default function Account(props) {
  const theme = useTheme()
  const params = useParams()
  const accountId = params.accountId

  const account = useSelector(state => state.accounts.accountById[accountId])
  const accounts = useSelector(state => state.accounts.accounts)

  const [showReconciled, setShowReconciled] = useState(false)
  const [accountName, setAccountName] = useState(account.name)

  const editAccountPopupState = usePopupState({
    variant: 'popover',
    popupId: 'editAccount',
  })

  const reconcilePopupState = usePopupState({
    variant: 'popover',
    popupId: 'reconcile-popup',
  })

  const dispatch = useDispatch()
  const budgetId = useSelector(state => state.budgets.activeBudget.id)
  const transactions = useSelector(state => {
    const transactions = state.transactions.transactions[accountId] || []
    if (!showReconciled) {
      return transactions.filter(transaction => transaction.status !== 2)
    }

    return transactions
  })
  const payeeIds = useSelector(state => state.accounts.payees.map(payee => payee.id))
  const categoriesMap = useSelector(
    state => state.categories.categories.reduce(
      (acc, category) => {
        acc[category.id] = category.name
        return acc
      }, { '0': 'Category Not Needed' }
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

  let amountFieldFocused = null
  let amountFieldModified = false
  const focusAmountField = (field) => {
    amountFieldFocused = field
    amountFieldModified = false
  }

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
            console.log(transferAccount)
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
            onFocus={() => focusAmountField('outflow')}
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
            onFocus={() => focusAmountField('inflow')}
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
            <IconButton
              size="small"
              style={{padding: 0}}
              aria-label="transaction status"
              onClick={(e) => {
                e.stopPropagation()
                setTransactionStatus(rowData)
              }}
              color="inherit"
            >
              {statusIcon}
            </IconButton>
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
        accountId,
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
    dispatch(fetchBudgetMonths())
    dispatch(fetchPayees())
    dispatch(fetchAccounts())
    if (newRow.categoryId && newRow.categoryId !== '0') {
      dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    }
  }

  const setTransactionStatus = (rowData) => {
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
    if (!payeesMap[newRow.payeeId]) {
      // @TODO: Fix : Because of the 'onInputChange' autocomplete, the edited value gets subbed out for the 'text' value. Make sure this doesn't truly already exist.
      const payee = Object.keys(payeesMap).find(key => payeesMap[key] === newRow.payeeId)
      if (!payee) {
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
        accountId,
        date: newRow.date,
        memo: newRow.memo,
        payeeId: newRow.payeeId,
        categoryId: newRow.categoryId === '0' ? null : newRow.categoryId,
        amount,
        status: newRow.status,
      }
    }))

    dispatch(fetchPayees())


    dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newRow.date) }))
    dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    if (oldData.categoryId !== newRow.categoryId) {
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

  const openRowActions = () => {

  }

  const editAccountName = (event) => {
    editAccountPopupState.close()
    dispatch(editAccount({ id: account.id, name: accountName }))
  }

  const getBalanceColor = (amount) => {
    if (isNegative(amount)) {
      return theme.palette.error.main
    }

    return theme.palette.success.main
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
          <>
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={2}
            >
              <div>
                <h3 style={{cursor: 'pointer', display: 'inline-block'}} {...bindTrigger(editAccountPopupState)}>
                  {account.name}
                </h3>
                <Popover
                  {...bindPopover(editAccountPopupState)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <TextField
                      autoFocus
                      margin="dense"
                      id="account-name"
                      label="Account Name"
                      type="text"
                      fullWidth
                      variant="standard"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      alignItems="center"
                      spacing={2}
                    >
                      <Button sx={{ p: 1 }} onClick={editAccountName}>Save</Button>
                    </Stack>
                  </Box>
                </Popover>
              </div>

              <div>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="center"
                  // spacing={2}
                >
                  <Typography
                    style={{
                      color: getBalanceColor(account.cleared),
                      fontWeight: "bold",
                    }}
                  >{intlFormat(account.cleared)}</Typography>
                  <Typography variant="caption">Cleared</Typography>
                </Stack>
              </div>

              <div>+</div>

              <div>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="center"
                  // spacing={2}
                >
                  <Typography
                    style={{
                      color: getBalanceColor(account.uncleared),
                      fontWeight: "bold",
                    }}
                  >{intlFormat(account.uncleared)}</Typography>
                  <Typography variant="caption">Uncleared</Typography>
                </Stack>
              </div>

              <div>=</div>

              <div>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="center"
                  // spacing={2}
                >
                  <Typography
                    style={{
                      color: getBalanceColor(account.balance),
                      fontWeight: "bold",
                    }}
                  >{intlFormat(account.balance)}</Typography>
                  <Typography variant="caption">Working Balance</Typography>
                </Stack>
              </div>

              <div>
                <Button
                  {...bindTrigger(reconcilePopupState)}
                  variant="outlined"
                  size="small"
                >
                  <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                    Reconcile
                  </Typography>
                </Button>
                <ReconcileForm
                  key={account.cleared}
                  popupState={reconcilePopupState}
                  accountId={account.id}
                  balance={account.cleared}
                />
              </div>
            </Stack>
          </>
        )}
        options={{
          padding: "dense",
          pageSize: 20,
          addRowPosition: 'first',
          rowStyle: rowData => ({
            fontSize: theme.typography.subtitle2.fontSize,
          }),
        }}
        components={{
          Row: props => (
            <MTableBodyRow
              {...props}
              onRowClick={(e) => {
                console.log(props.actions)
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
            onClick: (event) => setShowReconciled(!showReconciled)
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
