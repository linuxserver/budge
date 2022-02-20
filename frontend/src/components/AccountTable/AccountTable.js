import React, { useState, useMemo } from 'react'
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
import { formatMonthFromDateString } from '../../utils/Date'
import { ExportCsv } from '../../utils/Export'
import { refreshBudget, fetchAvailableMonths } from '../../redux/slices/Budgets'
import { fetchBudgetMonth, fetchCategoryMonths } from '../../redux/slices/BudgetMonths'
import TextField from '@mui/material/TextField'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LockIcon from '@mui/icons-material/Lock'
import { FromAPI, intlFormat, valueToDinero } from '../../utils/Currency'
import { dinero, isPositive } from 'dinero.js'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/styles'
import { payeesSelectors } from '../../redux/slices/Payees'
import { createSelector } from '@reduxjs/toolkit'
import { categoriesSelectors } from '../../redux/slices/Categories'
import SaveAltIcon from '@mui/icons-material/SaveAlt'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import EditIcon from '@mui/icons-material/Edit'
import { bindTrigger, bindMenu } from 'material-ui-popup-state'
import { usePopupState } from 'material-ui-popup-state/hooks'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { styled } from '@mui/material/styles'
import UploadIcon from '@mui/icons-material/Upload'
import ImportCSV from '../ImportCSV'
import { useGlobalFilter, useRowSelect, useSortBy, useTable, useAsyncDebounce } from 'react-table'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import AccountTableBody from './AccountTableBody'
import AccountAmountCell from './AccountAmountCell'
import { makeStyles } from '@mui/styles'
import clsx from 'clsx'
import { ROW_HEIGHT } from './constants'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import TransactionDatePicker from './TransactionDatePicker'

export const useStyles = makeStyles(theme => ({
  hideIconPadding: {
    '& .MuiSelect-outlined': {
      paddingRight: '0px',
    },
  },

  smallerSelect: {
    '& .MuiOutlinedInput-root': { padding: '1px 0 0 0 !important', 'margin-top': '1px' },
  },

  rootFirstSelect: {
    padding: '4px 0px',
  },
  rootSecondSelect: {
    padding: '10px 80px',
  },

  root: {
    display: 'block',
    flex: 1,
  },
  table: {
    width: '100%',
    backgroundColor: theme.palette.background.tableBody,
    display: 'grid',
    gridTemplateColums: '1fr',
    gridTemplateRows: 'auto 1fr auto',
    height: '100vh',
  },
  list: {},
  thead: {},
  tbody: {
    width: '100%',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    boxSizing: 'border-box',
    minWidth: '100%',
    width: '100%',
  },
  headerRow: {},
  sortType: 'defaultSort',
  cell: {
    display: 'block',
    flexGrow: 0,
    flexShrink: 0,
    padding: 4,
  },
  sortType: 'defaultSort',
  textCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sortType: 'defaultSort',
  expandingCell: {
    flex: 1,
  },
  column: {},
}))

function customFilter(rows, columnIds, filterValue) {
  const matchRegex = new RegExp(filterValue, 'i')
  return rows.filter(row => {
    if (row.id === 0) {
      return true
    }

    const rowValue = row.values.filterField

    return rowValue !== undefined ? String(rowValue).match(matchRegex) !== null : true
  })
}

// Create an editable cell renderer
const EditableCell = ({
  value: initialValue,
  row: { index },
  column: { id },
  updateMyData, // This is a custom function that we supplied to our table instance
}) => {
  // We need to keep and update the state of the cell normally
  const [value, setValue] = React.useState(initialValue)

  const onChange = e => {
    setValue(e.target.value)
  }

  // We'll only update the external data when the input is blurred
  const onBlur = () => {
    // updateMyData(index, id, value)
  }

  // If the initialValue is changed externall, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return <input /*style={inputStyle}*/ value={value} onChange={onChange} onBlur={onBlur} />
}

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = React.useRef()
  const resolvedRef = ref || defaultRef

  React.useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate
  }, [resolvedRef, indeterminate])

  const onClick = e => {
    e.stopPropagation()
  }

  return <Checkbox ref={resolvedRef} {...rest} size="small" sx={{ p: 0, ...rest.sx }} onClick={onClick} />
})

const BudgetTableCell = styled(TableCell)(({ theme }) => ({
  paddingTop: '4px',
  paddingBottom: '4px',
}))

function StatusIconButton(props) {
  const handleClick = e => {
    e.stopPropagation()
    props.setTransactionStatus(props.rowData)
  }

  return (
    <Tooltip title={props.tooltipText}>
      <IconButton
        size="small"
        style={{ padding: 0 }}
        aria-label="transaction status"
        onClick={handleClick}
        color="inherit"
      >
        {props.statusIcon}
      </IconButton>
    </Tooltip>
  )
}

function AccountFilter({ globalFilter, setGlobalFilter }) {
  const theme = useTheme()
  const [value, setValue] = useState(globalFilter)
  const onChange = useAsyncDebounce(value => {
    setGlobalFilter(value || undefined)
  }, 500)

  return (
    <TextField
      sx={{ minWidth: 125, m: 0.5 }}
      placeholder="Search Transactions"
      margin="dense"
      InputProps={{
        style: {
          fontSize: theme.typography.subtitle2.fontSize,
        },
      }}
      inputProps={{
        sx: {
          p: 0,
          px: 1,
        },
      }}
      value={value || ''}
      onChange={e => {
        setValue(e.target.value)
        onChange(e.target.value)
      }}
    />
  )
}

export default function Account(props) {
  const classes = useStyles()

  // const whyDidYouRender = true
  let tableProps = null

  const theme = useTheme()
  const dispatch = useDispatch()

  const account = props.account
  const accounts = useSelector(accountsSelectors.selectAll)
  const currentTheme = useSelector(state => state.app.theme)

  const [editingRow, setEditingRow] = useState(0)

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

  const bulkMenuPopupState = usePopupState({
    variant: 'popover',
    popupId: 'bulkActions',
  })

  const budgetId = useSelector(state => state.budgets.activeBudgetId)

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

  const [addingTransaction, setAddingTransaction] = useState(false)

  const selectTransactions = createSelector(
    [
      (state, accountId) =>
        state.accounts.entities[accountId] ? state.accounts.entities[accountId].transactions.entities : [],
      (state, accountId, reconciled) => reconciled,
      // (state, accountId, reconciled, addingTransaction) => addingTransaction,
    ],
    (transactions, reconciled) => {
      const retval = []
      // if (addingTransaction) {
      //   const now = new Date().toISOString()
      //   retval.push({
      //     id: 0,
      //     accountId: props.accountId,
      //     amount: 0,
      //     categoryId: '',
      //     created: now,
      //     date: now,
      //     filterField: '',
      //     memo: '',
      //     payeeId: '',
      //     status: 0,
      //     updated: now,
      //   })
      // }

      if (!showReconciled) {
        return retval.concat(
          Object.values(transactions)
            .filter(transaction => transaction.status !== 2)
            .map(trx => {
              return {
                ...trx,
                ...(trx.categoryId === null && { categoryId: '0' }),
                filterField: `${categoriesMap[trx.categoryId]} ${payeesMap[trx.payeeId]}`,
              }
            }),
        )
      }

      return retval.concat(
        Object.values(transactions).map(trx => {
          return {
            ...trx,
            ...(trx.categoryId === null && { categoryId: '0' }),
            filterField: `${categoriesMap[trx.categoryId]} ${payeesMap[trx.payeeId]}`,
          }
        }),
      )
    },
  )
  // const transactions = useSelector(state => selectTransactions(state, props.accountId, showReconciled))

  const selectTransactionsData = createSelector(
    [selectTransactions, (state, accountId, reconciled, addingTransaction) => addingTransaction],
    (transactions, addingTransaction) => {
      if (addingTransaction) {
        const now = new Date().toISOString()
        transactions.push({
          id: 0,
          accountId: props.accountId,
          amount: 0,
          categoryId: '',
          created: now,
          date: now,
          filterField: '',
          memo: '',
          payeeId: '',
          status: 0,
          updated: now,
        })
      }

      return transactions
    },
  )

  const transactions = useSelector(state =>
    selectTransactionsData(state, props.accountId, showReconciled, addingTransaction),
  )
  const data = useMemo(() => transactions, [transactions, account])

  const cancelAddTransaction = () => {
    if (addingTransaction === true) {
      setAddingTransaction(false)
      setEditingRow(0)
    }
  }

  const filter = createFilterOptions()
  const columns = useMemo(
    () =>
      [
        {
          accessor: 'filterField',
        },
        {
          title: 'Date',
          accessor: 'date',
          Header: 'DATE',
          width: 135,
          sortType: 'defaultSort',
          Cell: props => {
            return <Box>{new Date(props.cell.value).toLocaleDateString()}</Box>
          },
          Editing: props => <TransactionDatePicker {...props} />,
          exportTransformer: value => new Date(value).toLocaleDateString(),
        },
        {
          title: 'Payee',
          accessor: 'payeeId',
          Header: 'PAYEE',
          width: 200,
          style: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          sortType: 'defaultSort',
          Cell: props => <Box>{payeesMap[props.cell.value]}</Box>,
          Editing: props => (
            <Autocomplete
              {...props}
              autoSelect={true}
              disableClearable={true}
              sx={{
                [`& .MuiOutlinedInput-root`]: { p: 0, pt: '1px' },
                [`& #payee-text-field.MuiOutlinedInput-input`]: { px: 1, py: 0 },
              }}
              options={payeeIds}
              getOptionLabel={option => {
                if (payeesMap[option]) {
                  return payeesMap[option]
                }

                return option
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label=""
                  InputProps={{
                    style: {
                      fontSize: theme.typography.subtitle2.fontSize,
                      py: 0,
                      px: 1,
                    },
                    ...params.InputProps,
                  }}
                  inputProps={{
                    ...params.inputProps,
                    id: 'payee-text-field',
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
              noOptionsText={`"${props.value} will be created`}
            />
          ),
          exportTransformer: value => payeesMap[value],
        },
        ...(account.type !== 2
          ? [
              {
                title: 'Evenlope',
                accessor: 'categoryId',
                Header: 'ENVELOPE',
                style: {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
                sortType: 'defaultSort',
                Cell: props => <Box>{categoriesMap[props.cell.value]}</Box>,
                Editing: props => {
                  const disabled =
                    props.rowData.categoryId === '0' || props.rowData.categoryId === 'Category Not Needed'
                  const options = { ...categoriesMap }
                  if (disabled === false) {
                    delete options['0']
                  }

                  return (
                    <Autocomplete
                      {...props}
                      autoSelect={true}
                      disableClearable={true}
                      disablePortal
                      disabled={disabled}
                      options={categoryIds}
                      getOptionLabel={option => {
                        if (categoriesMap[option]) {
                          return categoriesMap[option]
                        }

                        return option
                      }}
                      sx={{
                        [`& .MuiOutlinedInput-root`]: { p: 0, pt: '1px' },
                        [`& #envelope-text-field.MuiOutlinedInput-input`]: { px: 1, py: 0 },
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          InputProps={{
                            style: {
                              fontSize: theme.typography.subtitle2.fontSize,
                              py: 0,
                              px: 1,
                            },
                            ...params.InputProps,
                          }}
                          inputProps={{
                            ...params.inputProps,
                            id: 'envelope-text-field',
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
                exportTransformer: value => categoriesMap[value],
              },
            ]
          : []),
        {
          title: 'Memo',
          accessor: 'memo',
          Header: 'MEMO',
          style: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          sortType: 'defaultSort',
          Cell: props => (
            <Tooltip title={props.cell.value}>
              <span
                style={{
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {props.cell.value}
              </span>
            </Tooltip>
          ),
          Editing: props => {
            return (
              <TextField
                {...props}
                // variant="standard"
                size="small"
                fullWidth
                inputProps={{
                  sx: {
                    py: 0,
                    px: 1,
                    fontSize: theme.typography.subtitle2.fontSize,
                  },
                }}
                InputProps={{
                  sx: {
                    paddingBottom: '1px',
                  },
                }}
                value={props.value}
                onChange={e => {
                  props.onChange(e.target.value)
                }}
              />
            )
          },
        },
        {
          title: 'Amount',
          accessor: 'amount',
          Header: 'AMOUNT',
          numeric: true,
          width: 120,
          sortType: 'defaultSort',
          Cell: props => {
            const trx = FromAPI.transformTransaction(props.row.original)
            const color = isPositive(trx.amount) ? 'success' : 'error'
            return (
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: theme.typography.subtitle2.fontSize,
                  color: theme.palette[color].main,
                  textAlign: 'right',
                }}
              >
                {intlFormat(trx.amount)}
              </Typography>
            )
          },
          Editing: props => <AccountAmountCell {...props} />,
          exportTransformer: value => intlFormat(valueToDinero(value)),
        },
        {
          title: 'Status',
          accessor: 'status',
          field: 'status',
          width: 50,
          numeric: true,
          Header: props => (
            <Box sx={{ mr: 1 }}>
              <Tooltip title="Status">
                <AccessTimeIcon color="disabled" fontSize="small" />
              </Tooltip>
            </Box>
          ),
          disableSortBy: true,
          Cell: props => {
            let statusIcon = <></>
            let tooltipText = ''
            switch (props.cell.value) {
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
              <Box sx={{ mr: 1 }}>
                <StatusIconButton
                  tooltipText={tooltipText}
                  rowData={props.row.original}
                  setTransactionStatus={setTransactionStatus}
                  statusIcon={statusIcon}
                />
              </Box>
            )
          },
          Editing: props => (
            <Box sx={{ mr: 0 }}>
              <IconButton
                size="small"
                style={{ padding: 0 }}
                onClick={e => {
                  e.stopPropagation()
                  props.save()
                }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" style={{ padding: 0 }} onClick={props.cancel}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Box>
          ),
          exportTransformer: value => {
            switch (value) {
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
      }),
    [currentTheme, payeesMap, account.type],
  )

  const filterTypes = useMemo(
    () => ({
      customFilter: customFilter,
      // Or, override the default text filter to use
      // "startWith"
      text: customFilter,
    }),
    [],
  )

  const sortTypes = useMemo(
    () => ({
      defaultSort: (rowA, rowB, columnId, desc) => {
        if (rowA.id === 0) {
          return desc ? 1 : -1
        } else if (rowB.id === 0) {
          return desc ? -1 : 1
        }

        return rowA[columnId] < rowB[columnId] ? -1 : 1
      },
    }),
    [],
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    preGlobalFilteredRows,
    setGlobalFilter,
    toggleRowSelected,
    state: { selectedRowIds, globalFilter },
  } = useTable(
    {
      columns,
      data,
      defaultColumn: {
        width: null,
      },
      autoResetSortBy: false,
      // autoResetPage: false,
      autoResetGlobalFilter: false,
      autoResetSelectedRows: false,

      initialState: {
        hiddenColumns: ['filterField'],
        sortBy: [{ id: 'date', desc: true }],
      },

      getRowId: (row, relativeIndex, parent) => row.id,

      // updateMyData isn't part of the API, but
      // anything we put into these options will
      // automatically be available on the instance.
      // That way we can call this function from our
      // cell renderer!
      // updateMyData,

      filterTypes,
      sortTypes,
      globalFilter: 'customFilter',
    },
    useGlobalFilter,
    useSortBy,
    useRowSelect,
    hooks => {
      hooks.allColumns.push(columns => [
        // Let's make a column for selection
        {
          id: 'selection',
          width: 5,
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox.  Pagination is a problem since this will select all
          // rows even though not all rows are on the current page.  The solution should
          // be server side pagination.  For one, the clients should not download all
          // rows in most cases.  The client should only download data for the current page.
          // In that case, getToggleAllRowsSelectedProps works fine.
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} sx={{ pb: 2 }} />
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          sortType: 'defaultSort',
          Cell: ({ row }) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
          Editing: ({ row }) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />,
        },
        ...columns,
      ])
    },
  )

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

    console.log(newRow)
    if (!payeesMap[newRow.payeeId]) {
      newRow.payeeId = (await createNewPayee(newRow.payeeId)).id
    }

    await dispatch(
      createTransaction({
        transaction: {
          accountId: props.accountId,
          amount: newRow.amount,
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
        amount: valueToDinero(rowData.amount),
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

    await dispatch(
      updateTransaction({
        transaction: {
          id: newRow.id,
          accountId: props.accountId,
          date: newRow.date,
          memo: newRow.memo,
          payeeId: newRow.payeeId,
          categoryId: newRow.categoryId === '0' ? null : newRow.categoryId,
          amount: newRow.amount,
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
    const selectedIds = Object.keys(selectedRowIds)
    return transactions.filter(trx => selectedIds.includes(trx.id))
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
    bulkMenuPopupState.close()
    const transactions = getSelectedRows()
    await dispatch(deleteTransactions({ accountId: account.id, transactions }))

    afterBulkAction(transactions)
  }

  const markSelectedTransactionsCleared = async () => {
    bulkMenuPopupState.close()
    await bulkEditTransactions(
      getSelectedRows().map(row => ({
        ...row,
        status: 1,
        amount: valueToDinero(row.amount),
      })),
    )
  }

  const markSelectedTransactionsUncleared = async () => {
    bulkMenuPopupState.close()
    await bulkEditTransactions(
      getSelectedRows().map(row => ({
        ...row,
        status: 0,
        amount: valueToDinero(row.amount),
      })),
    )
  }

  const bulkEditTransactions = async transactions => {
    transactions = transactions.map(transaction => {
      return {
        id: transaction.id,
        accountId: props.accountId,
        date: transaction.date,
        memo: transaction.memo,
        payeeId: transaction.payeeId,
        categoryId: transaction.categoryId === '0' ? null : transaction.categoryId,
        amount: transaction.amount,
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
    ExportCsv(columns, rows, `${account.name} Transactions`)
  }

  const onSelectionChange = data => {
    // setBulkEnabled(data.length > 0)
  }

  const addTransactionClick = () => {
    setAddingTransaction(true)
    setEditingRow(0)
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.tableBody,
        display: 'grid',
        gridTemplateColums: '1fr',
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
      }}
    >
      <ImportCSV accountId={props.accountId} open={importerOpen} close={closeImporter}></ImportCSV>

      {/* <TableToolbar
          numSelected={Object.keys(selectedRowIds).length}
          // deleteUserHandler={deleteUserHandler}
          // addUserHandler={addUserHandler}
          preGlobalFilteredRows={preGlobalFilteredRows}
          setGlobalFilter={setGlobalFilter}
          globalFilter={globalFilter}
        /> */}
      <Table {...getTableProps()} className={classes.table} component="div">
        <TableHead
          component="div"
          className={classes.thead}
          sx={{
            backgroundColor: theme.palette.background.tableHeader,
          }}
        >
          <TableRow component="div" sx={{ display: 'block', backgroundColor: theme.palette.background.tableHeader }}>
            <TableCell colSpan={7} component="div" className={clsx(classes.row, classes.headerRow)} sx={{ p: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
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

                    <Button
                      size="small"
                      onClick={toggleReconciled}
                      {...bindTrigger(bulkMenuPopupState)}
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
                    <Menu {...bindMenu(bulkMenuPopupState)}>
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

                <Box>
                  <AccountFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
                </Box>
              </Stack>
            </TableCell>
          </TableRow>

          {headerGroups.map(headerGroup => (
            <TableRow
              {...headerGroup.getHeaderGroupProps()}
              component="div"
              className={clsx(classes.row, classes.headerRow)}
            >
              {headerGroup.headers.map(column => (
                <TableCell
                  {...(column.id === 'selection'
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                  component="div"
                  variant="head"
                  align={column.numeric || false ? 'right' : 'left'}
                  className={clsx(classes.cell, classes.column, !column.width && classes.expandingCell)}
                  style={{
                    flexBasis: column.width || false,
                    height: ROW_HEIGHT,
                    ...(column.style && column.style),
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: 'bold',
                  }}
                  scope="col"
                >
                  {column.render('Header')}
                  {column.id !== 'selection' ? (
                    <TableSortLabel
                      active={column.isSorted}
                      // react-table has a unsorted state which is not treated here
                      direction={column.isSortedDesc ? 'desc' : 'asc'}
                    />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>

        <AccountTableBody
          {...getTableBodyProps()}
          classes={classes}
          rows={rows}
          prepareRow={prepareRow}
          onRowSave={onTransactionEdit}
          toggleRowSelected={toggleRowSelected}
          selectedRowIds={selectedRowIds}
          cancelAddTransaction={cancelAddTransaction}
          onTransactionAdd={onTransactionAdd}
          editingRow={editingRow}
          setEditingRow={setEditingRow}
        />
      </Table>
    </Box>
  )
}
