import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { refreshBudget } from '../../redux/slices/Budgets'
import { updateCategoryMonth, refreshBudgetCategory } from '../../redux/slices/BudgetMonths'
import { setSelectedCategory, updateCategory } from '../../redux/slices/Categories'
import { updateCategoryGroup, fetchCategories, categoryGroupsSelectors } from '../../redux/slices/CategoryGroups'
import { categoriesSelectors } from '../../redux/slices/Categories'
import IconButton from '@mui/material/IconButton'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import Grid from '@mui/material/Grid'
import { equal, isPositive, isNegative, isZero } from 'dinero.js'
import { FromAPI, intlFormat, valueToDinero } from '../../utils/Currency'
import { useTheme } from '@mui/styles'
import PopupState, { bindTrigger } from 'material-ui-popup-state'
import CategoryGroupForm from '../CategoryGroupForm'
import CategoryForm from '../CategoryForm'
import Tooltip from '@mui/material/Tooltip'
import _ from 'lodash'
import { formatMonthFromDateString, getDateFromString } from '../../utils/Date'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createDeepEqualSelector } from '../../utils/Store'
import BudgetTableAssignedCell from './BudgetTableAssignedCell'
import { useExpanded, useTable } from 'react-table'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { styled } from '@mui/material/styles'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Divider from '@mui/material/Divider'
import BudgetTableHeader from './BudgetTableHeader'

const BudgetTableCell = styled(TableCell)(({ theme }) => ({
  paddingTop: '4px',
  paddingBottom: '4px',
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

  const currentTheme = useSelector(state => state.app.theme)

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
      const underfunded = !budgetMonth.id
        ? false
        : isPositive(budgetMonth.underfunded) && !isZero(budgetMonth.underfunded)

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
            groupRow.underfunded = underfunded
          }

          groupRow.subRows.push({
            ...categoryMonth,
            name: category.name,
            order: category.order,
            groupId: group.id,
            trackingAccountId: category.trackingAccountId,
            underfunded,
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
                {row.isExpanded ? (
                  <ExpandMore sx={{ verticalAlign: 'middle' }} />
                ) : (
                  <ChevronRightIcon sx={{ verticalAlign: 'middle' }} />
                )}
              </Box>
            ) : null,
        },
        {
          accessor: 'name',
          Header: () => (
            <PopupState variant="popover" popupId="popover-category-group">
              {popupState => (
                <>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                      ENVELOPE
                    </Typography>
                    <AddCircleIcon
                      {...bindTrigger(popupState)}
                      style={{
                        cursor: 'pointer',
                        fontSize: theme.typography.subtitle2.fontSize,
                      }}
                    />
                  </Stack>
                  <CategoryGroupForm popupState={popupState} mode={'create'} order={0} />
                </>
              )}
            </PopupState>
          ),
          Cell: props => {
            return (
              <Grid container>
                <PopupState variant="popover" popupId={`popover-${props.row.original.categoryId}`}>
                  {popupState => (
                    <Box>
                      <Box
                        style={{
                          display: 'inline-block',
                          paddingRight: '5px',
                          ...(!props.row.original.trackingAccountId && {
                            cursor: 'pointer',
                          }),
                          ...(!props.row.original.groupId && {
                            fontSize: theme.typography.subtitle2.fontSize,
                            fontWeight: 'bold',
                          }),
                        }}
                        {...(!props.row.original.trackingAccountId && bindTrigger(popupState))}
                      >
                        {props.row.values.name}
                      </Box>

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
                    </Box>
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
            width: '150px',
          },
          Header: props => <Box sx={{ textAlign: 'right' }}>BUDGETED</Box>,
          Cell: props => {
            const value = valueToDinero(props.row.values.budgeted)
            if (!props.row.original.groupId) {
              return (
                <Box
                  sx={{
                    ...(isZero(value) && { color: theme.palette.grey[600] }),
                    textAlign: 'right',
                    // fontWeight: 'bold',
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
                  onSubmit={(budgeted, month) => {
                    onBudgetEdit(
                      month,
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
            width: '150px',
          },
          Header: props => <Box sx={{ textAlign: 'right' }}>ACTIVITY</Box>,
          Cell: props => {
            const value = valueToDinero(props.cell.value)
            return (
              <Box
                sx={{
                  ...(isZero(value) && { color: theme.palette.grey[600] }),
                  textAlign: 'right',
                  // fontWeight: 'bold',
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
            width: '150px',
          },
          Header: props => <Box sx={{ textAlign: 'right' }}>AVAILABLE</Box>,
          Cell: props => {
            const balance = valueToDinero(props.cell.value)
            let value = intlFormat(balance)

            let color = 'default'
            if (props.row.original.trackingAccountId) {
              if (props.row.original.underfunded) {
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

            let chip = (
              <Typography
                sx={{
                  fontSize: theme.typography.subtitle2.fontSize,
                  color: color === 'default' ? theme.palette.grey[600] : theme.palette[color].main,
                  fontWeight: 900,
                }}
              >
                {value}
              </Typography>
            )

            if (!props.row.original.groupId) {
              chip = <Typography variant="subtitle2">{value}</Typography>

              if (props.row.original.trackingAccountId === true) {
                // in case we want to add additional text or tooltip to the CC payment balance?
                chip = (
                  <Box>
                    <Typography variant="subtitle2">{value}</Typography>
                  </Box>
                )
              }
            }

            // Tooltip for CC warning
            if (props.row.original.trackingAccountId && color === 'warning') {
              if (props.row.original.groupId) {
                chip = (
                  <Tooltip title="Month is underfunded, this amount may not be accurate">
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5}>
                      <WarningAmberIcon
                        color="warning"
                        sx={{
                          fontSize: theme.typography.subtitle2.fontSize,
                        }}
                      />
                      {chip}
                    </Stack>
                  </Tooltip>
                )
              }
            }

            return <Box sx={{ textAlign: 'right' }}>{chip}</Box>
          },
        },
      ].map(column => {
        column.id = column.id || column.accessor
        return column
      }),
    [currentTheme],
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

  const onBudgetEdit = async (month, newRow, oldRow) => {
    if (equal(newRow.budgeted, oldRow.budgeted)) {
      // Only update if the amount budgeted was changed
      return
    }

    await dispatch(updateCategoryMonth({ categoryId: newRow.categoryId, month, budgeted: newRow.budgeted }))

    dispatch(refreshBudgetCategory({ month, categoryId: newRow.categoryId }))
    dispatch(refreshBudget())
  }

  const onCategoryRowClick = row => {
    console.log(row)
    dispatch(setSelectedCategory(row.original.categoryId))
  }

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
      autoResetExpanded: false,
      initialState: {
        expanded: useMemo(
          () =>
            data.reduce((result, current, index) => {
              result[index] = true
              return result
            }, {}),
          [],
        ),
      },
    },
    useExpanded,
  )

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
      {/* <BudgetTableHeader />

      <Divider /> */}

      <TableContainer component={Box}>
        <Table stickyHeader {...getTableProps()} size="small">
          <TableHead>
            <TableRow sx={{ borderBottom: 'none' }}>
              <TableCell
                colSpan={5}
                sx={{
                  padding: 0,
                  borderBottom: 'none',
                }}
              >
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.tableHeader,
                  }}
                ></Box>
              </TableCell>
            </TableRow>
            {headerGroups.map(headerGroup => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => {
                  return (
                    <TableCell
                      {...column.getHeaderProps()}
                      sx={{
                        ...(column.id === 'expander' && { width: '10px' }),
                        fontSize: theme.typography.caption.fontSize,
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.background.tableHeader,
                        color: 'white',
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
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onCategoryRowClick(row)}
                  {...row.getRowProps({
                    ...(!row.original.groupId && { sx: { backgroundColor: theme.palette.action.hover } }),
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
                      <BudgetTableCell
                        {...cell.getCellProps()}
                        sx={{
                          ...(cell.column.style && { ...cell.column.style }),
                        }}
                      >
                        {cell.render('Cell')}
                      </BudgetTableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
