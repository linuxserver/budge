import React, { useState, useMemo } from 'react'
import MaterialTable, {
  MTableBody,
  MTableBodyRow,
  MTableEditField,
  MTableToolbar,
  MTableEditRow,
  MTableActions,
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
import { FromAPI, inputToDinero, intlFormat, valueToDinero } from '../../utils/Currency'
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
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import { useGlobalFilter, usePagination, useRowSelect, useSortBy, useTable } from 'react-table'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableFooter from '@mui/material/TableFooter'
import TablePagination from '@mui/material/TablePagination'
import TableSortLabel from '@mui/material/TableSortLabel'
// import TableToolbar from '@mui/material/TableToolbar'
import TablePaginationActions from './TablePaginationActions'
import AccountTableBody from './AccountTableBody'
import AccountAmountCell from './AccountAmountCell'
import AppBar from '@mui/material/AppBar'
import CssBaseline from '@mui/material/CssBaseline'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import { FixedSizeList as List, Grid as GridList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

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

  return (
    <>
      <Checkbox ref={resolvedRef} {...rest} size="small" />
    </>
  )
})

const BudgetTableCell = styled(TableCell)(({ theme }) => ({
  paddingTop: '4px',
  paddingBottom: '4px',
}))

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
  const currentTheme = useSelector(state => state.app.theme)

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
              ...trx,
              ...(trx.categoryId === null && { categoryId: '0' }),
            }
          })
      }

      return Object.values(transactions).map(trx => {
        return {
          ...trx,
          ...(trx.categoryId === null && { categoryId: '0' }),
        }
      })
    },
  )
  const transactions = useSelector(state => selectTransactions(state, props.accountId, showReconciled))
  const data = useMemo(() => transactions, [transactions])
  console.log(data)

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
  const columns = useMemo(
    () =>
      [
        {
          accessor: 'date',
          Header: 'Date',
          Cell: props => {
            return <Box>{new Date(props.cell.value).toLocaleDateString()}</Box>
          },
          Editing: props => (
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
                      onKeyDown={props.onKeyDown}
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
          accessor: 'payeeId',
          Header: 'Payee',
          Cell: props => <Box>{payeesMap[props.cell.value]}</Box>,
          Editing: props => (
            <Autocomplete
              {...props}
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
        },
        ...(account.type !== 2
          ? [
              {
                accessor: 'categoryId',
                Header: 'Category',
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
          accessor: 'Memo',
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
          Editing: props => <></>,
        },
        {
          accessor: 'amount',
          Header: data => <Box sx={{ textAlign: 'right' }}>Amount</Box>,
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
          Editing: props => {
            console.log(props)
            return <AccountAmountCell {...props} />
          },
        },
        {
          accessor: 'status',
          field: 'status',
          style: {
            width: '1px',
          },
          Header: props => <></>,
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
              <Tooltip title={tooltipText}>
                <StatusIconButton
                  rowData={props.row.original}
                  setTransactionStatus={setTransactionStatus}
                  statusIcon={statusIcon}
                />
              </Tooltip>
            )
          },
          Editing: props => <></>,
        },
      ].map(col => {
        col.cellStyle = {
          paddingTop: 0,
          paddingBottom: 0,
        }
        return col
      }),
    [currentTheme],
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

  // Set our editable cell renderer as the default Cell renderer
  const defaultColumn = {
    Cell: EditableCell,
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    // gotoPage,
    // setPageSize,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize, selectedRowIds, globalFilter },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      autoResetSortBy: false,
      // autoResetPage: false,
      autoResetGlobalFilter: false,
      autoResetSelectedRows: false,

      // updateMyData isn't part of the API, but
      // anything we put into these options will
      // automatically be available on the instance.
      // That way we can call this function from our
      // cell renderer!
      // updateMyData,
    },
    useGlobalFilter,
    useSortBy,
    // usePagination,
    useRowSelect,
    hooks => {
      hooks.allColumns.push(columns => [
        // Let's make a column for selection
        {
          id: 'selection',
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox.  Pagination is a problem since this will select all
          // rows even though not all rows are on the current page.  The solution should
          // be server side pagination.  For one, the clients should not download all
          // rows in most cases.  The client should only download data for the current page.
          // In that case, getToggleAllRowsSelectedProps works fine.
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div>
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }) => (
            <div>
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
          Editing: ({ row }) => (
            <div>
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ])
    },
  )

  const handleChangePage = (event, newPage) => {
    // gotoPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    // setPageSize(Number(event.target.value))
  }

  // Grid data as an array of arrays
  const list = [
    ['Brian Vaughn', 'Software Engineer', 'San Jose', 'CA', 95125 /* ... */],
    // And so on...
  ]

  function cellRenderer({ columnIndex, key, rowIndex, style }) {
    return (
      <div key={key} style={style}>
        {list[rowIndex][columnIndex]}
      </div>
    )
  }

  return (
    <TableContainer
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
      <Table {...getTableProps()}>
        <TableHead>
          <TableRow>
            <TableCell colSpan={7}>
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
            </TableCell>
          </TableRow>
          {headerGroups.map(headerGroup => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <TableCell
                  {...(column.id === 'selection'
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                  sx={{ py: 0, top: '39px' }}
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

        <AccountTableBody {...getTableBodyProps()} rows={rows} prepareRow={prepareRow} onRowSave={onTransactionEdit} />
      </Table>
    </TableContainer>
  )
}
