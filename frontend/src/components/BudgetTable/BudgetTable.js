import React from "react";
import { useSelector, useDispatch } from "react-redux"
import { createSelector } from '@reduxjs/toolkit'
import MaterialTable, { MTableCell, MTableEditCell, MTableBodyRow } from "@material-table/core";
import { TableIcons } from '../../utils/Table'
import { refreshBudget } from "../../redux/slices/Budgets";
import { fetchBudgetMonth, updateCategoryMonth, fetchCategoryMonths, refreshBudgetMonth } from '../../redux/slices/BudgetMonths'
import { updateCategory,  } from "../../redux/slices/Categories"
import { updateCategoryGroup, fetchCategories, categoryGroupsSelectors } from '../../redux/slices/CategoryGroups'
import { categoriesSelectors } from '../../redux/slices/Categories'
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { dinero, add, equal, isPositive, isNegative, isZero, toUnit } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { FromAPI, inputToDinero, intlFormat } from '../../utils/Currency'
import { useTheme } from '@mui/styles'
import BudgetTableHeader from './BudgetTableHeader'
import PopupState, { bindTrigger } from 'material-ui-popup-state'
import CategoryGroupForm from '../CategoryGroupForm'
import CategoryForm from '../CategoryForm'
import Tooltip from '@mui/material/Tooltip'
import _ from 'underscore'
import { formatMonthFromDateString, getDateFromString } from "../../utils/Date";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';

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
  const nextMonthExists = !availableMonths.includes(formatMonthFromDateString(nextMonth))

  const selectCategoryMaps = createSelector([
    categoryGroupsSelectors.selectAll,
    categoriesSelectors.selectAll,
  ], (categoryGroups, categories) => {
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
  })
  const [categoryGroupsMap, categoriesMap] = useSelector(selectCategoryMaps)

  const budgetMonthSelector = createSelector(
    (state, month) => state.budgetMonths.entities[month],
    budgetMonth => {
      if (!budgetMonth) {
        isLoading = true
        dispatch(fetchBudgetMonth({ month }))
        return {}
      }

      isLoading = false
      return FromAPI.transformBudgetMonth(budgetMonth)
    }
  )
  const budgetMonth = useSelector(state => budgetMonthSelector(state, month))

  const categoryMonthsSelector = createSelector([
      (state, month) => state.budgetMonths.entities[month],
      state => state.categoryMonths.entities,
    ],
    (budgetMonth, categories) => {
      if (!budgetMonth) {
        return []
      }

      return budgetMonth.categories.map(categoryId => FromAPI.transformCategoryMonth(categories[categoryId]))
    }
  )

  const selectData = createSelector([
    categoryGroupsSelectors.selectAll,
    categoriesSelectors.selectAll,
    (state, month) => categoryMonthsSelector(state, month),
  ], (groups, categories, categoryMonths) => {
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

        const budgetMonthCategory = categoryMonths.filter(monthCategory => monthCategory.categoryId === category.id)
        // If no budget category, no transactions, so just build a dummy one
        const categoryMonth = budgetMonthCategory[0] ? budgetMonthCategory[0] : defaultRow

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
  })

  const data = useSelector(state => selectData(state, month))

  /**
  * Dynamic variables
  */
  let cellEditing = false
  const openCategoryDialog = props.openCategoryDialog
  const openCategoryGroupDialog = props.openCategoryGroupDialog
  const DragState = {
    row: -1,
    dropRow: -1, // drag target
  };

  const columns = [
    {
      title: "order",
      field: "order",
      hidden: true,
      editable: "never",
      defaultSort: "asc",
    },
    {
      title: "Category",
      field: "categoryId",
      sorting: false,
      lookup: categoriesMap,
      editable: "never",
      align: "left",
      render: (rowData) => (
        <Grid container>
          <PopupState
            variant="popover"
            popupId={`popover-${rowData.categoryId}`}
          >
            {(popupState) => (
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    paddingRight: '5px',
                    ...!rowData.trackingAccountId && {
                      cursor: 'pointer',
                    }
                  }}
                  {...!rowData.trackingAccountId && bindTrigger(popupState)}
                >
                  {categoriesMap[rowData.categoryId]}
                </div>
                {
                  !rowData.groupId && (
                    <CategoryGroupForm
                      popupState={popupState}
                      mode={'edit'}
                      name={categoriesMap[rowData.categoryId]}
                      order={rowData.order}
                      categoryId={rowData.categoryId}
                    />
                  )
                }
                {
                  rowData.groupId && (
                    <CategoryForm
                      popupState={popupState}
                      mode={'edit'}
                      name={categoriesMap[rowData.categoryId]}
                      order={rowData.order}
                      categoryId={rowData.categoryId}
                      categoryGroupId={rowData.groupId}
                    />
                  )
                }
              </div>
            )}
          </PopupState>
          {
            !rowData.groupId && !rowData.trackingAccountId && (
              <PopupState
                variant="popover"
                popupId={`popover-${rowData.categoryId}`}
              >
                {(popupState) => (
                  <div>
                    <IconButton
                      {...bindTrigger(popupState)}
                      style={{padding: 0}}
                      aria-label="add"
                      // size="small"
                    >
                      <AddCircleIcon style={{
                        fontSize: theme.typography.subtitle2.fontSize,
                      }} />
                    </IconButton>
                    <CategoryForm
                      popupState={popupState}
                      mode={'create'}
                      categoryGroupId={rowData.id}
                    />
                  </div>
                )}
              </PopupState>
            )
          }
        </Grid>
      ),
    },
    {
      title: "Assigned",
      field: "budgeted",
      sorting: false,
      type: "currency",
      width: "1px",
      render: rowData => intlFormat(rowData.budgeted),
    },
    {
      title: "Activity",
      field: "activity",
      sorting: false,
      type: "currency",
      editable: "never",
      width: "1px",
      render: rowData => intlFormat(rowData.activity),
    },
    {
      title: "Balance",
      field: "balance",
      sorting: false,
      type: "currency",
      align: "right",
      editable: "never",
      width: "1px",
      render: (rowData) => {
        if (!budgetMonth) {
          return <></>
        }
        const value = intlFormat(rowData.balance)

        if (!rowData.groupId) {
          return value
        }

        let color = "default"
        if (rowData.trackingAccountId) {
          if (isPositive(budgetMonth.underfunded) && !isZero(budgetMonth.underfunded)) {
            color = "warning"
          } else if (isZero(rowData.balance) || isNegative(rowData.balance)) {
            color = "default"
          } else {
            color = "success"
          }
        } else {
          if (isZero(rowData.balance)) {
            color = "default"
          } else if (isNegative(rowData.balance)) {
            color = "error"
          } else {
            color = "success"
          }
        }

        // Tooltip for CC warning
        if (rowData.trackingAccountId && color === 'warning') {
          return (
            <Tooltip title="Month is underfunded, this amount may not be accurate">
              <Chip size="small" label={value} color={color}></Chip>
            </Tooltip>
          )
        }

        return (
          <Chip
            size="small"
            label={value}
            color={color}
            style={{
              height: 'auto',
              padding: "1px 0",
            }}
          />
        )
      }
    },
  ]

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

      await dispatch(updateCategory({ id: from.categoryId, name: from.name, order: from.order, categoryGroupId: from.groupId }))
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

    // await api.updateCategoryMonth(budgetId, newRow.categoryId, month, newRow.budgeted)
    await dispatch(updateCategoryMonth({ categoryId: newRow.categoryId, month, budgeted: newRow.budgeted }))

    dispatch(refreshBudget())
    dispatch(refreshBudgetMonth({ month, budgetId }))
    if (nextMonthExists) {
      dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId, nextMonth }))
    }
  }

  const budgetTableCell = (props) => {
    let children = <></>
    const childProps = {
      ...props,
      onCellEditStarted: (row, column) => {
        if (cellEditing === true) {
          return
        }

        cellEditing = true
        props.onCellEditStarted(row, column)
      },
    }

    switch (props.columnDef.field) {
      case 'budgeted':
        // don't let group rows get editable 'budgeted' cell
        if (props.rowData.groupId === undefined) {
          childProps.cellEditable = false
        }

        break
    }

    return (
      <MTableCell {...childProps}>{children}</MTableCell>
    )
  }

  const setIsLoading = (active) => {
    isLoading = active
  }

  console.log(theme.palette)

  return (
    <>
      <MaterialTable
        isLoading={isLoading}
        style={{
          display: "grid",
          gridTemplateColums: "1fr",
          gridTemplateRows: "auto 1fr auto",
          height: "100vh"
        }}
        components={{
          Toolbar: props => (
            <Box sx={{
              backgroundColor: theme.palette.background.default,
            }}>
              <BudgetTableHeader
                onMonthNavigate={setIsLoading}
                openCategoryGroupDialog={openCategoryGroupDialog}
              />

              <Divider/>

              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  backgroundColor: theme.palette.action.hover,
                }}
              >
                <ButtonGroup variant="text" aria-label="outlined button group">
                  <PopupState
                    variant="popover"
                    popupId="popover-category-group"
                  >
                    {(popupState) => (
                      <>
                        <Button
                          size="small"
                          {...bindTrigger(popupState)}
                        >
                          <Stack
                            direction="row"
                            // justifyContent="space-between"
                            alignItems="center"
                            spacing={0.5}
                            // sx={{
                            //   px: 2,
                            //   pb: 1,
                            // }}
                          >
                            <AddCircleIcon style={{
                              fontSize: theme.typography.subtitle2.fontSize,
                            }} />
                            <Typography style={{ fontSize: theme.typography.caption.fontSize, fontWeight: 'bold' }}>
                              Category Group
                            </Typography>
                          </Stack>
                        </Button>
                          <CategoryGroupForm
                          popupState={popupState}
                          mode={'create'}
                          order={0}
                        />
                      </>
                    )}
                  </PopupState>
                </ButtonGroup>
              </Stack>

              <Divider />
            </Box>
          ),
          Row: (props) => (
            <MTableBodyRow
              {...props}
              draggable="true"
              onDragStart={(e) => {
                DragState.row = props.data
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                if (props.data.id !== DragState.row.id) {
                  DragState.dropRow = props.data
                }
              }}
              onDragEnd={(e) => {
                if (DragState.dropRow !== -1) {
                  reorderRows(DragState.row, DragState.dropRow)
                }
                DragState.row = -1;
                DragState.dropRow = -1;
              }}
            />
          ),
          Cell: budgetTableCell,
          EditCell: props => {
            return (
              <MTableEditCell
                {...props}
                onCellEditFinished={(rowData, columnDef) => {
                  cellEditing = false
                  props.onCellEditFinished(rowData, columnDef)
                }}ƒ
              ></MTableEditCell>
            )
          },
          EditField: props => {
            const childProps = { ...props }

            // This prevents console errors, can't pass these to the DOM
            delete childProps.columnDef
            delete childProps.rowData

            return (
              <TextField
                { ...childProps }
                style={{ float: "right" }}
                type="number"
                variant="standard"
                value={props.value instanceof Object ? toUnit(props.value, { digits: 2 }) : props.value}
                onChange={(event) => {
                  try {
                    return props.onChange(event.target.value)
                  } catch (e) {}
                }}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: "right",
                  },
                }}
                inputProps={{
                  "aria-label": props.columnDef.title,
                }}
              />
            )
          }
        }}
        options={{
          padding: "dense",
          paging: false,
          search: false,
          defaultExpanded: true,
          draggable: false,
          // sorting: false,
          // tableLayout: "fixed",
          headerStyle: {
            position: 'sticky',
            top: 0,
            textTransform: 'uppercase',
            fontSize: theme.typography.caption.fontSize,
          },
          rowStyle: rowData => ({
            ...!rowData.groupId && {
              backgroundColor: theme.palette.action.hover,
              fontWeight: 'bold',
            },
            fontSize: theme.typography.subtitle2.fontSize,
          }),
        }}
        icons={TableIcons}
        columns={columns}
        data={data}
        parentChildData={(row, rows) => rows.find(a => {
          return a.id === row.groupId
        })}
        cellEditable={{
          onCellEditApproved: async (newValue, oldValue, rowData, columnDef) => {
            const newData = {
              ...rowData,
              [columnDef.field]: newValue,
            }

            switch (columnDef.field) {
              case 'budgeted':
                newData['budgeted'] = inputToDinero(newData['budgeted'])
                onBudgetEdit(newData, rowData)
                break
            }
          }
        }}
      />
    </>
  )
}
