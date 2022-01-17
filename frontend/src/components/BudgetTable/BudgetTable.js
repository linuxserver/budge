import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import MaterialTable, { MTableCell, MTableEditCell, MTableBodyRow, MTableToolbar } from '@material-table/core'
import { TableIcons } from '../../utils/Table'
import { refreshBudget } from '../../redux/slices/Budgets'
import {
  fetchBudgetMonth,
  updateCategoryMonth,
  fetchCategoryMonths,
  refreshBudgetMonth,
  refreshBudgetCategory,
} from '../../redux/slices/BudgetMonths'
import { updateCategory } from '../../redux/slices/Categories'
import { updateCategoryGroup, fetchCategories, categoryGroupsSelectors } from '../../redux/slices/CategoryGroups'
import { categoriesSelectors } from '../../redux/slices/Categories'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import { dinero, add, equal, isPositive, isNegative, isZero, toUnit } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { FromAPI, intlFormat, valueToDinero } from '../../utils/Currency'
import { useTheme } from '@mui/styles'
import BudgetTableHeader from './BudgetTableHeader'
import PopupState, { bindTrigger } from 'material-ui-popup-state'
import CategoryGroupForm from '../CategoryGroupForm'
import CategoryForm from '../CategoryForm'
import Tooltip from '@mui/material/Tooltip'
import _ from 'underscore'
import { formatMonthFromDateString, getDateFromString } from '../../utils/Date'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import { createDeepEqualSelector } from '../../utils/Store'
import BudgetTableAssignedCell from './BudgetTableAssignedCell'
import { useExpanded, useGroupBy, useTable } from 'react-table'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const StyledMTableToolbar = styled(MTableToolbar)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  minHeight: '0 !important',
  padding: '0 !important',
  margin: '0',
  '& .MuiInputBase-input': {
    padding: '0 !important',
    width: '130px',
    // '::-webkit-input-placeholder': {
    //   fontStyle: 'italic',
    // },
    // ':-moz-placeholder': {
    //   fontStyle: 'italic',
    // },
    // '::-moz-placeholder': {
    //   fontStyle: 'italic',
    // },
    // ':-ms-input-placeholder': {
    //   fontStyle: 'italic',
    // },
  },
  '& .MuiInputAdornment-root .MuiIconButton-root': {
    padding: 0,
  },
}))

export default function BudgetTable(props) {
  let isLoading = false
  const theme = useTheme()

  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const budgetId = useSelector(state => state.budgets.activeBudgetId)
  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)

  const nextMonth = getDateFromString(month)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthExists = availableMonths.includes(formatMonthFromDateString(nextMonth))

  const selectCategoryMaps = createDeepEqualSelector(
    [categoryGroupsSelectors.selectAll, categoriesSelectors.selectAll],
    (categoryGroups, categories) => {
      const categoriesMap = {}
      const groupMap = {}

      categoryGroups.map(group => {
        categoriesMap[group.id] = group.name
        groupMap[group.id] = group
      })
      categories.map(category => {
        categoriesMap[category.id] = category.name
      })

      return [groupMap, categoriesMap]
    },
  )
  const [categoryGroupsMap, categoriesMap] = useSelector(selectCategoryMaps, _.isEqual)

  const selectBudgetMonth = createSelector([(state, month) => state.budgetMonths.entities[month]], budgetMonth => {
    if (!budgetMonth) {
      isLoading = true
      return {}
    }

    isLoading = false
    // return budgetMonth
    return FromAPI.transformBudgetMonth(budgetMonth)
  })
  const selectCategoryMonths = createDeepEqualSelector([state => state.categoryMonths.entities], categoryMonths => {
    if (!budgetMonth.id) {
      return []
    }

    return budgetMonth.categories.reduce((result, categoryMonthId) => {
      result[categoryMonths[categoryMonthId].categoryId] = categoryMonths[categoryMonthId]
      return result
    }, {})
  })

  const budgetMonth = useSelector(state => selectBudgetMonth(state, month))

  const selectData = createSelector(
    [categoryGroupsSelectors.selectAll, categoriesSelectors.selectAll, selectCategoryMonths],
    (groups, categories, categoryMonths) => {
      let retval = []
      groups.map(group => {
        if (group.internal) {
          return
        }

        let groupRow = {
          id: group.id,
          name: group.name,
          order: group.order,
          categoryId: group.id,
          month,
          budgeted: 0,
          activity: 0,
          balance: 0,
          subRows: [],
        }

        const groupCategories = categories.filter(cat => cat.categoryGroupId === group.id)
        for (let category of groupCategories) {
          const defaultRow = {
            id: category.id,
            name: category.name,
            order: category.order,
            groupId: group.id,
            categoryId: category.id,
            month,
            budgeted: 0,
            activity: 0,
            balance: 0,
          }

          if (!budgetMonth.categories) {
            groupRow.subRows.push(defaultRow)
            // retval.push(defaultRow)
            continue
          }

          const budgetMonthCategory = categoryMonths[category.id]
          // If no budget category, no transactions, so just build a dummy one
          const categoryMonth = budgetMonthCategory || defaultRow

          groupRow.budgeted = groupRow.budgeted + categoryMonth.budgeted
          groupRow.activity = groupRow.activity + categoryMonth.activity
          groupRow.balance = groupRow.balance + categoryMonth.balance

          if (category.trackingAccountId) {
            groupRow.trackingAccountId = true
          }

          groupRow.subRows.push({
            ...categoryMonth,
            name: category.name,
            order: category.order,
            groupId: group.id,
            trackingAccountId: category.trackingAccountId,
          })
        }

        groupRow.subRows.sort((a, b) => (a.order < b.order ? -1 : 1))
        retval.push(groupRow)
      })

      return retval.sort((a, b) => (a.order < b.order ? -1 : 1))
    },
  )

  const budgetData = useSelector(state => selectData(state, month))
  const data = useMemo(() => budgetData, [budgetData])

  const openCategoryGroupDialog = props.openCategoryGroupDialog
  const DragState = {
    row: -1,
    dropRow: -1, // drag target
  }

  const columns = useMemo(
    () =>
      [
        {
          // Build our expander column
          id: 'expander', // Make sure it has an ID
          style: {
            width: '10px',
            pr: '4px',
          },
          Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => <></>,
          Cell: ({ row }) =>
            // Use the row.canExpand and row.getToggleRowExpandedProps prop getter
            // to build the toggle for expanding a row
            row.canExpand ? (
              <Box
                {...row.getToggleRowExpandedProps({
                  style: {
                    // We can even use the row.depth property
                    // and paddingLeft to indicate the depth
                    // of the row
                    // paddingLeft: `${row.depth * 2}rem`,
                  },
                })}
              >
                {row.isExpanded ? <ExpandMore /> : <ChevronRightIcon />}
              </Box>
            ) : null,
        },
        {
          accessor: 'name',
          Header: 'CATEGORY',
          Cell: props => {
            return (
              <Grid container>
                <PopupState variant="popover" popupId={`popover-${props.row.original.categoryId}`}>
                  {popupState => (
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          paddingRight: '5px',
                          ...(!props.row.original.trackingAccountId && {
                            cursor: 'pointer',
                          }),
                          fontWeight: 'bold',
                        }}
                        {...(!props.row.original.trackingAccountId && bindTrigger(popupState))}
                      >
                        {props.row.values.name}
                      </div>
                      {!props.row.original.groupId && (
                        <CategoryGroupForm
                          popupState={popupState}
                          mode={'edit'}
                          name={props.row.values.name}
                          order={props.row.original.order}
                          categoryId={props.row.original.categoryId}
                        />
                      )}
                      {props.row.original.groupId && (
                        <CategoryForm
                          popupState={popupState}
                          mode={'edit'}
                          name={props.row.values.name}
                          order={props.row.original.order}
                          categoryId={props.row.original.categoryId}
                          categoryGroupId={props.row.original.groupId}
                        />
                      )}
                    </div>
                  )}
                </PopupState>
                {!props.row.original.groupId && !props.row.original.trackingAccountId && (
                  <PopupState variant="popover" popupId={`popover-${props.row.original.categoryId}`}>
                    {popupState => (
                      <div>
                        <IconButton
                          {...bindTrigger(popupState)}
                          style={{ padding: 0 }}
                          aria-label="add"
                          // size="small"
                        >
                          <AddCircleIcon
                            style={{
                              fontSize: theme.typography.subtitle2.fontSize,
                            }}
                          />
                        </IconButton>
                        <CategoryForm popupState={popupState} mode={'create'} categoryGroupId={props.row.original.id} />
                      </div>
                    )}
                  </PopupState>
                )}
              </Grid>
            )
          },
        },
        {
          accessor: 'budgeted',
          style: {
            width: '125px',
          },
          Header: props => <Box sx={{ textAlign: 'right' }}>ASSIGNED</Box>,
          Cell: props => {
            const value = valueToDinero(props.row.values.budgeted)
            if (!props.row.original.groupId) {
              return (
                <Box
                  sx={{
                    ...(isZero(value) && { color: theme.palette.grey[600] }),
                    textAlign: 'right',
                    fontWeight: 'bold',
                  }}
                >
                  {intlFormat(value)}
                </Box>
              )
            }
            return (
              <Box sx={{ textAlign: 'right' }}>
                <BudgetTableAssignedCell
                  budgeted={value}
                  onSubmit={budgeted => {
                    onBudgetEdit(
                      {
                        ...FromAPI.transformCategoryMonth({
                          ...props.row.original,
                        }),
                        budgeted,
                      },
                      FromAPI.transformCategoryMonth(props.row.original),
                    )
                  }}
                />
              </Box>
            )
          },
        },
        {
          accessor: 'activity',
          style: {
            width: '125px',
          },
          Header: props => <Box sx={{ textAlign: 'right' }}>ACTIVITY</Box>,
          Cell: props => {
            const value = valueToDinero(props.cell.value)
            return (
              <Box
                sx={{
                  ...(isZero(value) && { color: theme.palette.grey[600] }),
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {intlFormat(value)}
              </Box>
            )
          },
        },
        {
          accessor: 'balance',
          style: {
            width: '125px',
          },
          Header: props => <Box sx={{ textAlign: 'right' }}>BALANCE</Box>,
          Cell: props => {
            const balance = valueToDinero(props.cell.value)
            const value = intlFormat(balance)
            const fontColor = isZero(balance) ? theme.palette.grey[800] : theme.palette.text.primary

            // if (!props.row.original.groupId) {
            //   return (
            //     <Box
            //       sx={{
            //         mr: 1,
            //         color: theme.palette.grey[600],
            //       }}
            //     >
            //       {value}
            //     </Box>
            //   )
            // }

            let color = 'default'
            if (props.row.original.trackingAccountId) {
              if (isPositive(budgetMonth.underfunded) && !isZero(budgetMonth.underfunded)) {
                color = 'warning'
              } else if (isZero(balance) || isNegative(balance)) {
                color = 'default'
              } else {
                color = 'success'
              }
            } else {
              if (isZero(balance)) {
                color = 'default'
              } else if (isNegative(balance)) {
                color = 'error'
              } else {
                color = 'success'
              }
            }

            const chip = (
              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  size="small"
                  label={value}
                  color={color}
                  sx={{
                    height: 'auto',
                    color: fontColor,
                    fontWeight: 'bold',
                    ...(theme.typography.fontFamily !== 'Lato' && { pt: '2px' }),
                    ...(color === 'default' && { backgroundColor: theme.palette.grey[500] }),
                  }}
                />
              </Box>
              // <Typography
              //   sx={{
              //     fontSize: theme.typography.subtitle2.fontSize,
              //     ...(color !== 'default' && { fontWeight: '900' }),
              //     color: color === 'default' ? theme.palette.grey[600] : theme.palette[color].main,
              //   }}
              // >
              //   {value}
              // </Typography>
            )

            // Tooltip for CC warning
            if (props.row.original.trackingAccountId && color === 'warning') {
              return <Tooltip title="Month is underfunded, this amount may not be accurate">{chip}</Tooltip>
            }

            return chip
          },
        },
      ].map(column => {
        column.id = column.id || column.accessor
        return column
      }),
    [],
  )

  const reorderRows = async (from, to) => {
    if (from.groupId) {
      /// updating a category, not a group
      if (!to.groupId) {
        // placing into a new group, at the very top
        from.groupId = to.id
      } else {
        // placing into same or new group, at the position dropped
        from.groupId = to.groupId
        from.order = to.order + 0.5
      }

      await dispatch(
        updateCategory({ id: from.categoryId, name: from.name, order: from.order, categoryGroupId: from.groupId }),
      )
    } else {
      if (to.groupId) {
        // This is category, find the group it belongs in
        to = categoryGroupsMap[to.groupId]
      }

      from.order = to.order + 0.5
      await dispatch(updateCategoryGroup({ id: from.id, name: from.name, order: from.order }))
    }

    dispatch(fetchCategories())
  }

  const onBudgetEdit = async (newRow, oldRow) => {
    if (equal(newRow.budgeted, oldRow.budgeted)) {
      // Only update if the amount budgeted was changed
      return
    }

    await dispatch(updateCategoryMonth({ categoryId: newRow.categoryId, month, budgeted: newRow.budgeted }))

    dispatch(refreshBudgetCategory({ month, categoryId: newRow.categoryId }))
    dispatch(refreshBudget())
    // dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId, month }))
    // dispatch(refreshBudgetMonth({ month, categoryId: newRow.categoryId }))
  }

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
      autoResetExpanded: false,
      initialState: {
        expanded: data.reduce((result, current, index) => {
          result[index] = true
          return result
        }, {}),
      },
    },
    // useGroupBy,
    useExpanded,
  )

  const setIsLoading = active => {
    isLoading = active
  }

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        display: 'grid',
        gridTemplateColums: '1fr',
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
        }}
      >
        <BudgetTableHeader onMonthNavigate={setIsLoading} openCategoryGroupDialog={openCategoryGroupDialog} />

        <Divider sx={{ borderColor: theme.palette.background.header }} />

        <Stack direction="row" alignItems="center">
          <ButtonGroup variant="text" aria-label="outlined button group">
            <PopupState variant="popover" popupId="popover-category-group">
              {popupState => (
                <>
                  <Button size="small" {...bindTrigger(popupState)}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AddCircleIcon
                        style={{
                          fontSize: theme.typography.subtitle2.fontSize,
                        }}
                      />
                      <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                        Category Group
                      </Typography>
                    </Stack>
                  </Button>
                  <CategoryGroupForm popupState={popupState} mode={'create'} order={0} />
                </>
              )}
            </PopupState>
          </ButtonGroup>
        </Stack>

        <Divider sx={{ borderColor: theme.palette.background.header }} />
      </Box>

      <Box
        sx={{
          overflowY: 'auto',
        }}
      >
        <TableContainer component={Box}>
          <Table {...getTableProps()} size="small">
            <TableHead>
              {headerGroups.map(headerGroup => (
                <TableRow {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => {
                    return (
                      <TableCell
                        {...column.getHeaderProps()}
                        sx={{
                          ...(column.id === 'expander' && { width: '10px' }),
                          fontSize: theme.typography.caption.fontSize,
                        }}
                      >
                        {column.render('Header')}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {rows.map((row, i) => {
                prepareRow(row)
                return (
                  <TableRow
                    {...row.getRowProps({
                      ...(row.canExpand === true && { sx: { backgroundColor: theme.palette.action.hover } }),
                    })}
                    draggable="true"
                    onDragStart={e => {
                      DragState.row = row.original
                    }}
                    onDragEnter={e => {
                      e.preventDefault()
                      if (row.original.id !== DragState.row.id) {
                        DragState.dropRow = row.original
                      }
                    }}
                    onDragEnd={e => {
                      if (DragState.dropRow !== -1) {
                        reorderRows(DragState.row, DragState.dropRow)
                      }
                      DragState.row = -1
                      DragState.dropRow = -1
                    }}
                  >
                    {row.cells.map(cell => {
                      return (
                        <TableCell
                          {...cell.getCellProps()}
                          sx={{
                            ...(cell.column.style && { ...cell.column.style }),
                          }}
                        >
                          {cell.render('Cell')}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}
