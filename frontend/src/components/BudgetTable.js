import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import MaterialTable, { MTableCell, MTableEditCell } from "@material-table/core";
import { TableIcons } from '../utils/Table'
import { fetchBudgetMonth, updateCategoryMonth, setCurrentMonth, fetchCategoryMonths, refreshBudget } from "../redux/slices/Budgets";
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddIcon from '@mui/icons-material/Add';
import Chip from '@mui/material/Chip';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { formatMonthFromDateString, getDateFromString } from "../utils/Date";
import Grid from '@mui/material/Grid';
import { dinero, add, equal, isPositive, isNegative, isZero, toUnit } from 'dinero.js'
import { USD } from '@dinero.js/currencies'
import { inputToDinero, intlFormat } from '../utils/Currency'
import BudgetMonthPicker from "./BudgetMonthPicker";
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/styles'

export default function BudgetTable(props) {
  const theme = useTheme()

  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const budget = useSelector(state => state.budgets.activeBudget)
  const budgetId = budget.id
  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)
  const categoriesMap = useSelector(
    state => state.categories.categoryGroups.reduce(
      (acc, group) => {
        if (group.internal) {
          return acc
        }
        acc[group.id] = group.name
        for (const category of group.categories) {
          acc[category.id] = category.name
        }

        return acc
      }, {}
    )
  )
  const budgetMonth = useSelector(state => {
    if (!state.budgets.budgetMonths[month]) {
      dispatch(fetchBudgetMonth({ month }))
      return []
    }

    return state.budgets.budgetMonths[month]
  })
  const data = useSelector(state => {
    let retval = []
    state.categories.categoryGroups.map(group => {
      if (group.internal) {
        return
      }

      let groupRow = {
        id: group.id,
        categoryId: group.id,
        month,
        budgeted: dinero({ amount: 0, currency: USD }),
        activity: dinero({ amount: 0, currency: USD }),
        balance: dinero({ amount: 0, currency: USD }),
      }

      for (let category of group.categories) {
        const defaultRow = {
          id: category.id,
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

        const budgetMonthCategory = budgetMonth.categories.filter(monthCategory => monthCategory.categoryId === category.id)
        // If no budget category, no transactions, so just build a dummy one
        const categoryMonth = budgetMonthCategory[0] || defaultRow

        groupRow.budgeted = add(groupRow.budgeted, categoryMonth.budgeted)
        groupRow.activity = add(groupRow.activity, categoryMonth.activity)
        groupRow.balance = add(groupRow.balance, categoryMonth.balance)

        if (category.trackingAccountId) {
          groupRow.trackingAccountId = true
        }

        retval.push({
          ...categoryMonth,
          groupId: group.id,
          trackingAccountId: category.trackingAccountId,
        })
      }

      retval.push(groupRow)
    })

    return retval
  })

  /**
  * State block
  */
 const [monthPickerOpen, setMonthPickerOpen] = useState(false)
 const [monthPickerAnchor, setMonthPickerAnchor] = useState(null)

  /**
  * Dynamic variables
  */
  let cellEditing = false
  const openCategoryDialog = props.openCategoryDialog
  const openCategoryGroupDialog = props.openCategoryGroupDialog

  const columns = [
    {
      title: "Category",
      field: "categoryId",
      lookup: categoriesMap,
      editable: "never",
      align: "left",
      render: (rowData) => (
        <Grid container>
          <div style={{cursor: 'pointer', display: 'inline-block'}} onClick={() => {
            if (rowData.trackingAccountId) {
              return
            }
            if (rowData.groupId) {
              openCategoryDialog({ name: categoriesMap[rowData.categoryId], categoryId: rowData.categoryId, categoryGroupId: rowData.groupId })
            } else {
              openCategoryGroupDialog({ name: categoriesMap[rowData.categoryId], categoryGroupId: rowData.id })
            }
          }}>
            {categoriesMap[rowData.categoryId]}
          </div>
          {
            !rowData.groupId && (
              <IconButton style={{padding: 0}} aria-label="add" size="small" onClick={(event) => {
                openCategoryDialog({ categoryGroupId: rowData.id })
              }}>
                <AddCircleIcon fontSize="small" />
              </IconButton>
            )
          }
        </Grid>
      ),
    },
    {
      title: "Assigned",
      field: "budgeted",
      type: "currency",
      render: rowData => intlFormat(rowData.budgeted),
    },
    {
      title: "Activity",
      field: "activity",
      type: "currency",
      editable: "never",
      render: rowData => intlFormat(rowData.activity),
    },
    {
        title: "Balance",
        field: "balance",
        type: "currency",
        align: "right",
        editable: "never",
        render: (rowData) => {
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

          return <Chip size="small" label={value} color={color}></Chip>
        }
      },
  ]

  const onBudgetEdit = async (newRow, oldRow) => {
    if (equal(newRow.budgeted, oldRow.budgeted)) {
      // Only update if the amount budgeted was changed
      return
    }

    await dispatch(updateCategoryMonth({ categoryId: newRow.categoryId, month, budgeted: newRow.budgeted }))

    // const monthIndex = availableMonths.indexOf(month)
    // Fetch all months starting with the existing to get cascaded balance updates
    dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    dispatch(fetchBudgetMonth({ month, budgetId }))
    dispatch(refreshBudget())
    // return Promise.all(availableMonths.slice(monthIndex).map(month => dispatch(fetchBudgetMonth({ month }))))
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

  const navigateMonth = (direction) => {
    const monthDate = new Date(Date.UTC(...month.split('-')))
    monthDate.setDate(1)
    monthDate.setMonth(monthDate.getMonth() + direction)
    dispatch(setCurrentMonth(monthDate))
  }

  const setMonth = async (month) => {
    setMonthPickerOpen(false)

    if (!month) {
      return
    }

    await dispatch(setCurrentMonth(month))
  }

  const openMonthPicker = event => {
    if (monthPickerOpen) {
      setMonthPickerOpen(false)
      return
    }

    setMonthPickerOpen(true)
    setMonthPickerAnchor(event.currentTarget)
  }

  const nextMonth = getDateFromString(month)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthDisabled = !availableMonths.includes(formatMonthFromDateString(nextMonth))

  const prevMonth = getDateFromString(month)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevMonthDisabled = !availableMonths.includes(formatMonthFromDateString(prevMonth))

  return (
    <>
      <MaterialTable
        style={{
          display: "grid",
          gridTemplateColums: "1fr",
          gridTemplateRows: "auto 1fr auto",
          height: "100vh"
        }}
        components={{
          Toolbar: props => {
            return (
              <>
                <Grid sx={{ p: 2 }} container spacing={2}>
                  <Grid item>
                    <BudgetMonthPicker
                      open={monthPickerOpen}
                      currentMonth={month}
                      minDate={availableMonths[0]}
                      maxDate={availableMonths[availableMonths.length - 1]}
                      anchorEl={monthPickerAnchor}
                      onClose={setMonth}
                    />
                    <div className="budget-month-navigation">
                      <IconButton disabled={prevMonthDisabled} onClick={() => navigateMonth(-1)}>
                        <ArrowBackIosNewIcon />
                      </IconButton>
                      <Button onClick={openMonthPicker}>
                        {(new Date(Date.UTC(...month.split('-')))).toLocaleDateString(undefined, { year: 'numeric', month: 'long'})}
                      </Button>
                      <IconButton disabled={nextMonthDisabled} onClick={() => navigateMonth(1)}>
                        <ArrowForwardIosIcon />
                      </IconButton>
                    </div>
                  </Grid>
                  <Grid item>
                    <Button aria-describedby="category-group-add" variant="outlined" size="small" onClick={openCategoryGroupDialog}>
                      + Category Group
                    </Button>
                  </Grid>
                </Grid>
                <Grid container spacing={2} sx={{ p: 2 }}>

                </Grid>
              </>
            )
          },
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
          showTitle: false,
          // toolbar: false,
          draggable: false,
          sorting: false,
          rowStyle: rowData => ({
            ...!rowData.groupId && {backgroundColor: theme.palette.action.hover}
          }),
          // headerStyle: { position: 'sticky', top: 0 }
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
