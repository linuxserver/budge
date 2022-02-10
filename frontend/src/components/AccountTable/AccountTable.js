import React, { useState } from 'react'
import MaterialTable, {
  MTableBody,
  MTableBodyRow,
  MTableEditField,
  MTableToolbar,
  MTableEditRow,
} from '@material-table/core'
import { useDispatch, useSelector } from 'react-redux'
import {
  accountsSelectors,
  fetchAccounts,
  createTransaction,
  deleteTransaction,
  deleteTransactions,
  updateTransaction,
  updateTransactions,
} from '../../redux/slices/Accounts'
import { createPayee, fetchPayees, selectPayeesMap } from '../../redux/slices/Payees'
import { TableIcons } from '../../utils/Table'
import { formatMonthFromDateString } from '../../utils/Date'
import { refreshBudget, fetchAvailableMonths } from '../../redux/slices/Budgets'
import { fetchBudgetMonth, fetchCategoryMonths } from '../../redux/slices/BudgetMonths'
import TextField from '@mui/material/TextField'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import DatePicker from '@mui/lab/DatePicker'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import IconButton from '@mui/material/IconButton'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LockIcon from '@mui/icons-material/Lock'
import { FromAPI, inputToDinero, intlFormat } from '../../utils/Currency'
import { dinero, toUnit, isPositive, greaterThan } from 'dinero.js'
import { toSnapshot } from '@dinero.js/core'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/styles'
import { payeesSelectors } from '../../redux/slices/Payees'
import { createSelector } from '@reduxjs/toolkit'
import { categoriesSelectors } from '../../redux/slices/Categories'
import { ExportCsv } from '@material-table/exporters'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import EditIcon from '@mui/icons-material/Edit'
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { styled } from '@mui/material/styles'
import UploadIcon from '@mui/icons-material/Upload'
import ImportCSV from '../ImportCSV'
import AccountTableHeader from './AccountTableHeader'

const StyledMTableToolbar = styled(MTableToolbar)(({ theme }) => ({
  backgroundColor: theme.palette.background.tableBody,
  minHeight: '0 !important',
  padding: '0 !important',
  margin: '0',
  '& .MuiInputBase-input': {
    padding: '0 !important',
    width: '140px',
  },
  '& .MuiInputAdornment-root .MuiIconButton-root': {
    padding: 0,
  },
}))

function StatusIconButton(props) {
  const handleClick = e => {
    e.stopPropagation()
    props.setTransactionStatus(props.rowData)
  }

  return (
    <IconButton
      size="small"
      style={{ padding: 0 }}
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
  let tableProps = null

  const theme = useTheme()
  const dispatch = useDispatch()

  const account = props.account
  const accounts = useSelector(accountsSelectors.selectAll)

  const [bulkEnabled, setBulkEnabled] = useState(false)
  const [showReconciled, setShowReconciled] = useState(false)
  const toggleReconciled = () => {
    setShowReconciled(!showReconciled)
  }

  const [importerOpen, setImporterOpen] = useState(false)
  const openImporter = () => {
    setImporterOpen(true)
  }
  const closeImporter = () => {
    setImporterOpen(false)
  }

  const budgetId = useSelector(state => state.budgets.activeBudgetId)

  const selectTransactions = createSelector(
    [
      (state, accountId) =>
        state.accounts.entities[accountId] ? state.accounts.entities[accountId].transactions.entities : [],
      (state, accountId, reconciled) => reconciled,
    ],
    (transactions, reconciled) => {
      if (!showReconciled) {
        return Object.values(transactions)
          .filter(transaction => transaction.status !== 2)
          .map(trx => {
            return {
              ...FromAPI.transformTransaction(trx),
              ...(trx.categoryId === null && { categoryId: '0' }),
            }
          })
      }

      return Object.values(transactions).map(trx => {
        return {
          ...FromAPI.transformTransaction(trx),
          ...(trx.categoryId === null && { categoryId: '0' }),
        }
      })
    },
  )
  const transactions = useSelector(state => selectTransactions(state, props.accountId, showReconciled))

  const payeeIds = useSelector(payeesSelectors.selectIds)
  const categoryIds = useSelector(categoriesSelectors.selectIds)

  const selectCategoriesMap = createSelector(categoriesSelectors.selectAll, categories => {
    return categories.reduce(
      (acc, category) => {
        acc[category.id] = category.name
        return acc
      },
      { 0: 'Category Not Needed' },
    )
  })
  const categoriesMap = useSelector(selectCategoriesMap)

  const payeesMap = useSelector(selectPayeesMap)

  const filter = createFilterOptions()
  const columns = [
    {
      title: 'Posted',
      field: 'date',
      type: 'date',
      initialEditValue: new Date(),
      defaultSort: 'desc',
      width: 1,
      editComponent: props => (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label=""
            value={props.value || null}
            onChange={props.onChange}
            InputAdornmentProps={{
              style: {
                fontSize: theme.typography.subtitle2.fontSize,
              },
            }}
            renderInput={params => {
              return (
                <TextField
                  sx={{ minWidth: 125 }}
                  focus={true}
                  margin="dense"
                  variant="standard"
                  {...params}
                  InputProps={{
                    style: {
                      fontSize: theme.typography.subtitle2.fontSize,
                    },
                    ...params.InputProps,
                  }} // font size of input text
                />
              )
            }}
          />
        </LocalizationProvider>
      ),
    },
    {
      title: 'Payee',
      field: 'payeeId',
      lookup: payeesMap,
      editComponent: props => (
        <Autocomplete
          sx={{ width: 300 }}
          options={payeeIds}
          getOptionLabel={option => {
            if (payeesMap[option]) {
              return payeesMap[option]
            }

            return option
          }}
          // renderOption={(props, option) => <li {...props}>{option.name}</li>}
          freeSolo
          renderInput={params => (
            <TextField
              {...params}
              label=""
              variant="standard"
              InputProps={{
                style: {
                  fontSize: theme.typography.subtitle2.fontSize,
                },
                ...params.InputProps,
              }}
            />
          )}
          value={props.value}
          onInputChange={(e, value) => {
            props.onChange(value)
          }}
          onChange={(e, value) => {
            const transferAccount = accounts.filter(account => account.transferPayeeId === value)
            const updateProps = {}
            if (transferAccount.length === 1 && transferAccount[0].type !== 2) {
              updateProps.categoryId = '0'
            } else if (props.rowData.categoryId === 'Category Not Needed') {
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
            const filtered = filter(options, params)

            const { inputValue } = params
            if (inputValue.match(/New: /)) {
              return filtered
            }

            // Suggest the creation of a new value
            const isExisting = options.some(option => payeesMap[option] === inputValue)
            if (inputValue !== '' && !isExisting) {
              filtered.push(`New: ${inputValue}`)
            }

            return filtered
          }}
        />
      ),
      render: rowData => (
        <Tooltip title={payeesMap[rowData.payeeId]}>
          <span
            style={{
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {payeesMap[rowData.payeeId]}
          </span>
        </Tooltip>
      ),
    },
    ...(account.type !== 2
      ? [
          {
            title: 'Category',
            field: 'categoryId',
            lookup: categoriesMap,
            editComponent: function (props) {
              const disabled = props.rowData.categoryId === '0' || props.rowData.categoryId === 'Category Not Needed'
              props.columnDef.lookup = { ...categoriesMap }
              if (disabled === false) {
                delete props.columnDef.lookup['0']
              }

              return (
                <Autocomplete
                  {...props}
                  disablePortal
                  disabled={disabled}
                  options={categoryIds}
                  getOptionLabel={option => {
                    if (categoriesMap[option]) {
                      return categoriesMap[option]
                    }

                    return option
                  }}
                  // sx={{ width: 300 }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      variant="standard"
                      InputProps={{
                        style: {
                          fontSize: theme.typography.subtitle2.fontSize,
                        },
                        ...params.InputProps,
                      }}
                    />
                  )}
                  value={props.value}
                  onInputChange={(e, value) => {
                    props.onChange(value)
                  }}
                  onChange={(e, value) => {
                    return props.onRowDataChange({
                      ...props.rowData,
                      categoryId: value,
                    })
                  }}
                />
              )
            },
          },
        ]
      : []),
    {
      title: 'Memo',
      field: 'memo',
      render: rowData => (
        <Tooltip title={rowData.memo}>
          <span
            style={{
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {rowData.memo}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Amount',
      field: 'amount',
      // type: 'currency',
      align: 'right',
      customSort: (a, b) => (greaterThan(a.amount, b.amount) ? -1 : 1),
      initialEditValue: toSnapshot(inputToDinero(0)),
      render: rowData => {
        const color = isPositive(rowData.amount) ? 'success' : 'error'
        return (
          <Typography
            sx={{ fontWeight: 'bold', fontSize: theme.typography.subtitle2.fontSize, color: theme.palette[color].main }}
          >
            {intlFormat(rowData.amount)}
          </Typography>
        )
      },
      editComponent: props => {
        const value = dinero(props.value)
        return (
          <Box sx={{ textAlign: 'right' }}>
            <MTableEditField
              {...props}
              variant="standard"
              value={toUnit(value, { digits: 2 })}
              onChange={value => {
                props.onChange(toSnapshot(inputToDinero(value)))
              }}
              // onFocus={focusOutflowField}
            />
          </Box>
        )
      },
      customExport: rowData => {
        return intlFormat(rowData.amount)
      },
    },
    {
      title: '',
      field: 'status',
      width: '1px',
      editComponent: props => <></>, // Doing this so that the button isn't available to click when in edit mode
      render: rowData => {
        let statusIcon = <></>
        let tooltipText = ''
        switch (rowData.status) {
          case 0: // pending
            tooltipText = 'Pending'
            statusIcon = <AccessTimeIcon color="disabled" fontSize="small" />
            break
          case 1: // cleared
            tooltipText = 'Cleared'
            statusIcon = <CheckCircleOutlineIcon color="success" fontSize="small" />
            break
          case 2: // reconciled
            tooltipText = 'Reconciled'
            statusIcon = <LockIcon color="success" fontSize="small" />
            break
        }

        return (
          <Tooltip title={tooltipText}>
            <StatusIconButton rowData={rowData} setTransactionStatus={setTransactionStatus} statusIcon={statusIcon} />
          </Tooltip>
        )
      },
      customExport: rowData => {
        switch (rowData.status) {
          case 0:
            return 'Pending'
          case 1:
            return 'Cleared'
          case 2:
            return 'Reconciled'
        }
      },
    },
  ].map(col => {
    col.cellStyle = {
      paddingTop: 0,
      paddingBottom: 0,
    }
    return col
  })

  const createNewPayee = async name => {
    name = name.replace(/^New: /, '')
    return (
      await dispatch(
        createPayee({
          name,
        }),
      )
    ).payload
  }

  const onTransactionAdd = async newRow => {
    let refreshPayees = false

    if (!payeesMap[newRow.payeeId]) {
      newRow.payeeId = (await createNewPayee(newRow.payeeId)).id
    }

    const amount = dinero(newRow.amount)

    await dispatch(
      createTransaction({
        transaction: {
          accountId: props.accountId,
          amount,
          date: newRow.date,
          memo: newRow.memo,
          payeeId: newRow.payeeId,
          categoryId: newRow.categoryId === '0' ? null : newRow.categoryId,
          status: 0,
        },
      }),
    )

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(newRow.date) }))
    dispatch(refreshBudget())
    dispatch(fetchAvailableMonths())
    dispatch(fetchAccounts())

    if (newRow.categoryId && newRow.categoryId !== '0') {
      dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    }
    if (refreshPayees === true) {
      dispatch(fetchPayees())
    }
  }

  const setTransactionStatus = rowData => {
    if (rowData.status === 2) {
      // already reconciled
      return
    }

    onTransactionEdit(
      {
        ...rowData,
        status: rowData.status === 0 ? 1 : 0,
        amount: toSnapshot(rowData.amount),
      },
      { ...rowData },
    )
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

    if (!categoriesMap[newRow.categoryId]) {
      // @TODO: Fix : Because of the 'onInputChange' autocomplete, the edited value gets subbed out for the 'text' value. Make sure this doesn't truly already exist.
      const category = Object.keys(categoriesMap).find(key => categoriesMap[key] === newRow.categoryId)
      newRow.categoryId = category
    }

    const amount = dinero(newRow.amount)

    await dispatch(
      updateTransaction({
        transaction: {
          id: newRow.id,
          accountId: props.accountId,
          date: newRow.date,
          memo: newRow.memo,
          payeeId: newRow.payeeId,
          categoryId: newRow.categoryId === '0' ? null : newRow.categoryId,
          amount,
          status: newRow.status,
        },
      }),
    )

    if (refreshPayees === true) {
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
    dispatch(fetchAccounts())

    if (oldData.date !== newRow.date) {
      dispatch(fetchAvailableMonths())
    }
  }

  const onTransactionDelete = async transaction => {
    await dispatch(deleteTransaction({ transaction }))

    await dispatch(fetchBudgetMonth({ month: formatMonthFromDateString(transaction.date) }))
    if (transaction.categoryId && transaction.categoryId !== '0') {
      dispatch(fetchCategoryMonths({ categoryId: transaction.categoryId }))
    }
    dispatch(fetchAccounts())
    dispatch(refreshBudget())
  }

  const getSelectedRows = () => {
    return tableProps.renderData.filter(row => row.tableData.checked)
  }

  const afterBulkAction = async transactions => {
    const months = new Set(transactions.map(transaction => formatMonthFromDateString(transaction.date)))
    const categoryIds = new Set(transactions.map(transaction => transaction.categoryId))

    Promise.all([...months].map(month => dispatch(fetchBudgetMonth({ month }))))
    Promise.all(
      [...categoryIds].map(categoryId => {
        if (!categoryId || categoryId === '0') {
          return
        }
        return dispatch(fetchCategoryMonths({ categoryId }))
      }),
    )

    dispatch(fetchAccounts())
    dispatch(refreshBudget())
  }

  const deleteSelected = async () => {
    const transactions = getSelectedRows()
    await dispatch(deleteTransactions({ accountId: account.id, transactions }))

    afterBulkAction(transactions)
  }

  const markSelectedTransactionsCleared = async () => {
    await bulkEditTransactions(
      getSelectedRows().map(row => ({
        ...row,
        status: 1,
        amount: toSnapshot(row.amount),
      })),
    )
  }

  const markSelectedTransactionsUncleared = async () => {
    await bulkEditTransactions(
      getSelectedRows().map(row => ({
        ...row,
        status: 0,
        amount: toSnapshot(row.amount),
      })),
    )
  }

  const bulkEditTransactions = async transactions => {
    transactions = transactions.map(transaction => {
      const amount = dinero(transaction.amount)

      return {
        id: transaction.id,
        accountId: props.accountId,
        date: transaction.date,
        memo: transaction.memo,
        payeeId: transaction.payeeId,
        categoryId: transaction.categoryId === '0' ? null : transaction.categoryId,
        amount,
        status: transaction.status,
      }
    })

    await dispatch(
      updateTransactions({
        accountId: account.id,
        transactions,
      }),
    )

    afterBulkAction(transactions)
  }

  /**
   * This was pulled (and modified) from m-table-body.js. The formatting for the default 'export' action
   * didn't match other actions, so had to resort to creating this myself.
   */
  const getTableData = () => {
    const cols = columns
      .filter(
        columnDef => (!columnDef.hidden || columnDef.export === true) && columnDef.field && columnDef.export !== false,
      )
      .sort((a, b) => (a.tableData.columnOrder > b.tableData.columnOrder ? 1 : -1))
    const data = (props.exportAllData ? transactions : tableProps.renderData).map(rowData =>
      cols.map(columnDef => {
        /*
          About: column.customExport
          This bit of code checks if prop customExport in column is a function, and if it is then it
          uses that function to transform the data, this is useful in cases where a column contains
          complex objects or array and it needs to be handled before it's passed to the exporter
          to avoid [object Object] output (e.g. to flatten data).
          Please note that it is also possible to transform data within under exportMenu
          using a custom function (exportMenu.exportFunc) for each exporter.
          */
        if (typeof columnDef.customExport === 'function') {
          return columnDef.customExport(rowData)
        }

        return tableProps.getFieldValue(rowData, columnDef)
      }),
    )

    return [cols, data]
  }

  const exportData = () => {
    const [cols, data] = getTableData()
    ExportCsv(cols, data, `${account.name} Transactions`)
  }

  const onSelectionChange = data => {
    // setBulkEnabled(data.length > 0)
  }

  const addTransactionClick = () => {
    tableProps.actions[0].onClick()
  }

  return (
    <Box>
      <ImportCSV accountId={props.accountId} open={importerOpen} close={closeImporter}></ImportCSV>
      <MaterialTable
        style={{
          display: 'grid',
          gridTemplateColums: '1fr',
          gridTemplateRows: 'auto 1fr auto',
          maxWidth: '100%',
          height: '100vh',
          backgroundColor: theme.palette.background.tableBody,
        }}
        title={
          <Stack
            direction="row"
            alignItems="center"
            sx={
              {
                // backgroundColor: theme.palette.background.header,
              }
            }
          >
            <ButtonGroup variant="text" aria-label="outlined button group">
              <Button color="primary" size="small" onClick={addTransactionClick}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AddCircleIcon
                    style={{
                      fontSize: theme.typography.subtitle2.fontSize,
                    }}
                  />
                  <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                    Add Transaction
                  </Typography>
                </Stack>
              </Button>

              <Button size="small" onClick={openImporter}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <UploadIcon
                    style={{
                      fontSize: theme.typography.subtitle2.fontSize,
                    }}
                  />
                  <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                    Import
                  </Typography>
                </Stack>
              </Button>

              <Button size="small" onClick={exportData}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <SaveAltIcon
                    style={{
                      fontSize: theme.typography.subtitle2.fontSize,
                    }}
                  />
                  <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                    Export
                  </Typography>
                </Stack>
              </Button>

              <PopupState variant="popover" popupId="demo-popup-menu">
                {popupState => (
                  <>
                    <Button
                      size="small"
                      onClick={toggleReconciled}
                      {...bindTrigger(popupState)}
                      // disabled={!bulkEnabled}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <EditIcon
                          style={{
                            fontSize: theme.typography.subtitle2.fontSize,
                          }}
                        />
                        <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                          Edit
                        </Typography>
                      </Stack>
                    </Button>
                    <Menu {...bindMenu(popupState)}>
                      <MenuItem
                        // disabled={selectedRows.length === 0}
                        onClick={markSelectedTransactionsCleared}
                      >
                        Mark Cleared
                      </MenuItem>

                      <MenuItem
                        // disabled={selectedRows.length === 0}
                        onClick={markSelectedTransactionsUncleared}
                      >
                        Mark Uncleared
                      </MenuItem>

                      <MenuItem
                        // disabled={selectedRows.length === 0}
                        onClick={deleteSelected}
                      >
                        Delete Transactions
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </PopupState>

              <Button size="small" onClick={toggleReconciled}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {showReconciled && (
                    <CheckBoxIcon
                      style={{
                        fontSize: theme.typography.subtitle2.fontSize,
                      }}
                    />
                  )}
                  {!showReconciled && (
                    <CheckBoxOutlineBlankIcon
                      style={{
                        fontSize: theme.typography.subtitle2.fontSize,
                      }}
                    />
                  )}

                  <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                    Reconciled
                  </Typography>
                </Stack>
              </Button>
            </ButtonGroup>
          </Stack>
        }
        options={{
          padding: 'dense',
          draggable: false,
          pageSize: 20,
          pageSizeOptions: [5, 10, 25, 50, 100],
          addRowPosition: 'first',
          selection: true,
          actionsColumnIndex: 99,
          editCellStyle: {
            padding: 0,
          },
          rowStyle: rowData => ({
            fontSize: theme.typography.subtitle2.fontSize,
          }),
          headerStyle: {
            textTransform: 'uppercase',
            fontSize: theme.typography.caption.fontSize,
          },
          headerSelectionProps: {
            size: 'small',
          },
        }}
        onSelectionChange={onSelectionChange}
        localization={{
          header: {
            // actions: '',
          },
          body: {
            emptyDataSourceMessage: 'No transactions to display',
            editRow: {
              deleteText: (
                <Typography style={{ fontSize: theme.typography.subtitle2.fontSize, fontWeight: 'bold' }}>
                  Really delete this transaction?
                </Typography>
              ),
            },
          },
        }}
        components={{
          Container: Box,
          Body: props => {
            tableProps = props
            return <MTableBody {...props} />
          },
          Toolbar: props => (
            <Box
              sx={{
                backgroundColor: theme.palette.background.tableHeader,
              }}
            >
              <StyledMTableToolbar
                {...{ ...props, actions: [] }}
                showTextRowsSelected={false}
                localization={{
                  searchPlaceholder: 'Search transactions',
                }}
              />

              <Divider />
            </Box>
          ),
          Row: props => (
            <MTableBodyRow
              {...props}
              onRowClick={e => {
                // console.log(props.actions)
                props.actions[1]().onClick(e, props.data) // <---- trigger edit event
              }}
            />
          ),
          EditRow: props => <MTableEditRow {...props} />,
        }}
        icons={TableIcons}
        columns={columns}
        data={transactions}
        editable={{
          onRowAdd: async row => {
            await onTransactionAdd(row)
          },
          onRowUpdate: async (newRow, oldData) => {
            await onTransactionEdit(newRow, oldData)
          },
          onRowDelete: async row => {
            await onTransactionDelete(row)
          },
        }}
      />
    </Box>
  )
}
