import React from 'react'
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
import { FromAPI, intlFormat } from '../../utils/Currency'
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

  const selectBudgetMonth = createDeepEqualSelector(
    [(state, month) => state.budgetMonths.entities[month]],
    budgetMonth => {
      if (!budgetMonth) {
        isLoading = true
        dispatch(fetchBudgetMonth({ month }))
        return {}
      }

      isLoading = false
      return FromAPI.transformBudgetMonth(budgetMonth)
    },
  )
  const selectCategoryMonths = createDeepEqualSelector([state => state.categoryMonths.entities], categoryMonths => {
    if (!budgetMonth.id) {
      return []
    }

    return budgetMonth.categories.reduce((result, categoryMonthId) => {
      result[categoryMonths[categoryMonthId].categoryId] = FromAPI.transformCategoryMonth(
        categoryMonths[categoryMonthId],
      )
      return result
    }, {})
  })

  const budgetMonth = useSelector(state => selectBudgetMonth(state, month))

  const selectData = createDeepEqualSelector(
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
          budgeted: dinero({ amount: 0, currency: USD }),
          activity: dinero({ amount: 0, currency: USD }),
          balance: dinero({ amount: 0, currency: USD }),
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
            budgeted: dinero({ amount: 0, currency: USD }),
            activity: dinero({ amount: 0, currency: USD }),
            balance: dinero({ amount: 0, currency: USD }),
          }

          if (!budgetMonth.categories) {
            retval.push(defaultRow)
            continue
          }

          const budgetMonthCategory = categoryMonths[category.id]
          // If no budget category, no transactions, so just build a dummy one
          const categoryMonth = budgetMonthCategory || defaultRow

          groupRow.budgeted = add(groupRow.budgeted, categoryMonth.budgeted)
          groupRow.activity = add(groupRow.activity, categoryMonth.activity)
          groupRow.balance = add(groupRow.balance, categoryMonth.balance)

          if (category.trackingAccountId) {
            groupRow.trackingAccountId = true
          }

          retval.push({
            ...categoryMonth,
            name: category.name,
            order: category.order,
            groupId: group.id,
            trackingAccountId: category.trackingAccountId,
          })
        }

        retval.push(groupRow)
      })

      return retval
    },
  )

  const data = useSelector(state => selectData(state, month), _.isEqual)

  const openCategoryGroupDialog = props.openCategoryGroupDialog
  const DragState = {
    row: -1,
    dropRow: -1, // drag target
  }

  const columns = [
    {
      title: 'order',
      field: 'order',
      hidden: true,
      defaultSort: 'asc',
    },
    {
      title: 'Category',
      field: 'categoryId',
      sorting: false,
      lookup: categoriesMap,
      align: 'left',
      width: '55%',
      render: rowData => (
        <Grid container>
          <PopupState variant="popover" popupId={`popover-${rowData.categoryId}`}>
            {popupState => (
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    paddingRight: '5px',
                    ...(!rowData.trackingAccountId && {
                      cursor: 'pointer',
                    }),
                  }}
                  {...(!rowData.trackingAccountId && bindTrigger(popupState))}
                >
                  {categoriesMap[rowData.categoryId]}
                </div>
                {!rowData.groupId && (
                  <CategoryGroupForm
                    popupState={popupState}
                    mode={'edit'}
                    name={categoriesMap[rowData.categoryId]}
                    order={rowData.order}
                    categoryId={rowData.categoryId}
                  />
                )}
                {rowData.groupId && (
                  <CategoryForm
                    popupState={popupState}
                    mode={'edit'}
                    name={categoriesMap[rowData.categoryId]}
                    order={rowData.order}
                    categoryId={rowData.categoryId}
                    categoryGroupId={rowData.groupId}
                  />
                )}
              </div>
            )}
          </PopupState>
          {!rowData.groupId && !rowData.trackingAccountId && (
            <PopupState variant="popover" popupId={`popover-${rowData.categoryId}`}>
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
                  <CategoryForm popupState={popupState} mode={'create'} categoryGroupId={rowData.id} />
                </div>
              )}
            </PopupState>
          )}
        </Grid>
      ),
    },
    {
      title: 'Assigned',
      field: 'budgeted',
      sorting: false,
      type: 'currency',
      width: '20%',
      render: rowData => {
        if (!rowData.groupId) {
          return (
            <Box
              sx={{
                ...(isZero(rowData.budgeted) && { color: theme.palette.grey[600] }),
              }}
            >
              {intlFormat(rowData.budgeted)}
            </Box>
          )
        }

        return (
          <BudgetTableAssignedCell
            budgeted={rowData.budgeted}
            onSubmit={budgeted => {
              onBudgetEdit(
                {
                  ...rowData,
                  budgeted,
                },
                rowData,
              )
            }}
          />
        )
      },
    },
    {
      title: 'Activity',
      field: 'activity',
      sorting: false,
      type: 'currency',
      width: '20%',
      render: rowData => {
        // if (isZero(rowData.activity)) {
        //   return (
        //     <Box
        //       sx={{
        //         color: theme.palette.disabled.main,
        //       }}
        //     >
        //       {intlFormat(rowData.activity)}
        //     </Box>
        //   )
        // }

        return (
          <Box
            sx={{
              ...(isZero(rowData.activity) && { color: theme.palette.grey[600] }),
            }}
          >
            {intlFormat(rowData.activity)}
          </Box>
        )
      },
    },
    {
      title: 'Balance',
      field: 'balance',
      sorting: false,
      type: 'currency',
      align: 'right',
      width: '20%',
      render: rowData => {
        if (!budgetMonth) {
          return <></>
        }
        const value = intlFormat(rowData.balance)
        const fontColor = isZero(rowData.balance) ? theme.palette.grey[800] : theme.palette.text.primary

        if (!rowData.groupId) {
          return (
            <Box
              sx={{
                mr: 1,
                color: theme.palette.grey[600],
              }}
            >
              {value}
            </Box>
          )
        }

        let color = 'default'
        if (rowData.trackingAccountId) {
          if (isPositive(budgetMonth.underfunded) && !isZero(budgetMonth.underfunded)) {
            color = 'warning'
          } else if (isZero(rowData.balance) || isNegative(rowData.balance)) {
            color = 'default'
          } else {
            color = 'success'
          }
        } else {
          if (isZero(rowData.balance)) {
            color = 'default'
          } else if (isNegative(rowData.balance)) {
            color = 'error'
          } else {
            color = 'success'
          }
        }

        const chip = (
          <Chip
            size="small"
            label={value}
            color={color}
            sx={{
              height: 'auto',
              // padding: '1px 0',
              color: fontColor,
              ...(theme.typography.fontFamily !== 'Lato' && { pt: '2px' }),
              ...(color === 'default' && { backgroundColor: theme.palette.grey[500] }),
            }}
          />
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
        if (rowData.trackingAccountId && color === 'warning') {
          return <Tooltip title="Month is underfunded, this amount may not be accurate">{chip}</Tooltip>
        }

        return chip
      },
    },
  ].map(col => {
    col.cellStyle = {
      // paddingTop: '4px',
      // paddingBottom: '4px',
      boxShadow: 'none',
    }
    return col
  })

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

    dispatch(refreshBudget())
    dispatch(refreshBudgetCategory({ month, categoryId: newRow.categoryId }))
    // dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId, month }))
    // dispatch(refreshBudgetMonth({ month, categoryId: newRow.categoryId }))
  }

  const setIsLoading = active => {
    isLoading = active
  }

  return (
    <MaterialTable
      isLoading={isLoading}
      style={{
        display: 'grid',
        gridTemplateColums: '1fr',
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
      }}
      title={
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
      }
      components={{
        Container: props => <Box {...props} sx={{ backgroundColor: 'white' }} />,
        Toolbar: props => (
          <Box
            sx={{
              backgroundColor: theme.palette.background.default,
            }}
          >
            <BudgetTableHeader onMonthNavigate={setIsLoading} openCategoryGroupDialog={openCategoryGroupDialog} />

            <Divider />

            <StyledMTableToolbar
              {...props}
              localization={{
                searchPlaceholder: 'Filter categories',
              }}
              styles={{
                searchField: {},
              }}
              searchFieldVariant="outlined"
            />

            <Divider />
          </Box>
        ),
        Row: props => (
          <MTableBodyRow
            {...props}
            onRowClick={null}
            onRowDoubleClick={null}
            draggable="true"
            onDragStart={e => {
              DragState.row = props.data
            }}
            onDragEnter={e => {
              e.preventDefault()
              if (props.data.id !== DragState.row.id) {
                DragState.dropRow = props.data
              }
            }}
            onDragEnd={e => {
              if (DragState.dropRow !== -1) {
                reorderRows(DragState.row, DragState.dropRow)
              }
              DragState.row = -1
              DragState.dropRow = -1
            }}
          />
        ),
      }}
      options={{
        padding: 'dense',
        paging: false,
        defaultExpanded: true,
        draggable: false,
        headerStyle: {
          textTransform: 'uppercase',
          fontSize: theme.typography.caption.fontSize,
        },
        rowStyle: rowData => ({
          ...(!rowData.groupId && {
            backgroundColor: theme.palette.action.hover,
          }),
          fontSize: theme.typography.subtitle2.fontSize,
          fontWeight: 'bold',
        }),
      }}
      icons={TableIcons}
      columns={columns}
      data={data}
      parentChildData={(row, rows) =>
        rows.find(a => {
          return a.id === row.groupId
        })
      }
    />
  )
}
