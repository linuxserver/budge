import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import MaterialTable, { MTableCell, MTableEditField, MTableEditCell } from "@material-table/core";
import { TableIcons } from '../utils/Table'
import { fetchBudgetMonth, updateCategoryMonth, setCurrentMonth, fetchCategoryMonths } from "../redux/slices/Budgets";
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { formatMonthFromDateString, getDateFromString } from "../utils/Date";

export default function BudgetTable(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const month = useSelector(state => state.budgets.currentMonth)
  const availableMonths = useSelector(state => state.budgets.availableMonths)
  const budgetMonths = useSelector(state => Object.keys(state.budgets.budgetMonths).sort())
  const categoriesMap = useSelector(
    state => state.categories.categoryGroups.reduce(
      (acc, group) => {
        acc[group.id] = group.name
        for (const category of group.categories) {
          acc[category.id] = category.name
        }

        return acc
      }, {}
    )
  )
  const data = useSelector(state => {
    const budgetMonth = state.budgets.budgetMonths[month]
    if (!budgetMonth) {
      dispatch(fetchBudgetMonth({ month }))
      return []
    }

    let retval = []
    state.categories.categoryGroups.map(group => {
      let groupRow = {
        id: group.id,
        categoryId: group.id,
        month,
        budgeted: 0,
        activity: 0,
        balance: 0,
      }

      for (let category of group.categories) {
        const defaultRow = {
          id: category.id,
          groupId: group.id,
          categoryId: category.id,
          month,
          budgeted: 0,
          activity: 0,
          balance: 0,
        }

        if (!budgetMonth.categories) {
          retval.push(defaultRow)
          continue
        }

        const budgetMonthCategory = budgetMonth.categories.filter(monthCategory => monthCategory.categoryId === category.id)
        // If no budget category, no transactions, so just build a dummy one
        category = budgetMonthCategory[0] || defaultRow

        groupRow.budgeted += category.budgeted
        groupRow.activity += category.activity
        groupRow.balance += category.balance

        retval.push({
          ...category,
          groupId: group.id,
        })
      }

      retval.push(groupRow)
    })

    return retval
  })

  /**
  * State block
  */

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
        <>
          <div style={{cursor: 'pointer', display: 'inline-block'}} onClick={() => {
            if (rowData.groupId) {
              console.log(rowData)
              openCategoryDialog({ name: categoriesMap[rowData.categoryId], categoryId: rowData.categoryId, categoryGroupId: rowData.groupId })
            } else {
              openCategoryGroupDialog({ name: categoriesMap[rowData.categoryId], categoryGroupId: rowData.id })
            }
          }}>
            {categoriesMap[rowData.categoryId]}
          </div>
          {
            !rowData.groupId && (
              <IconButton aria-label="add" size="small" onClick={(event) => {
                openCategoryDialog({ categoryGroupId: rowData.id })
              }}>
                <AddCircleIcon fontSize="small" />
              </IconButton>
            )
          }
        </>
      ),
      editComponent: props => (
        <TextField
        onChange={(e, value) => {
          console.log(props)
          props.onChange(value)
        }}
        label=""
        variant="standard" />
      ),
    },
    { title: "Assigned", field: "budgeted", type: "currency", },
    { title: "Activity", field: "activity", type: "currency", editable: "never" },
    {
        title: "Balance",
        field: "balance",
        type: "currency",
        align: "right",
        editable: "never",
        render: (rowData) => {
          const value = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(rowData.balance !== undefined ? rowData.balance : 0);

          if (!rowData.groupId) {
            // @TODO: can we use the getCurrencyValue from MTableCell somehow? or the default in general?
            return value
          }

          if (rowData.balance > 0) {
            return <Chip label={value} color="success"></Chip>
          } else if (rowData.balance < 0) {
            return <Chip label={value} color="error"></Chip>
          } else {
            return <Chip label={value}></Chip>
          }
        }
      },
  ]

  const onBudgetEdit = async (newRow, oldRow) => {
    if (newRow.budgeted === oldRow.budgeted) {
      // Only update if the amount budgeted was changed
      return
    }

    await dispatch(updateCategoryMonth({ categoryId: newRow.categoryId, month, budgeted: newRow.budgeted }))

    // const monthIndex = availableMonths.indexOf(month)
    // Fetch all months starting with the existing to get cascaded balance updates
    dispatch(fetchCategoryMonths({ categoryId: newRow.categoryId }))
    // return Promise.all(availableMonths.slice(monthIndex).map(month => dispatch(fetchBudgetMonth({ month }))))
  }

  const budgetTableCell = (props) => {
    let children = <></>
    const childProps = {
      ...props,
      onCellEditStarted: (rowData, columnDef) => {
        if (cellEditing === true) {
          return
        }

        cellEditing = true
        props.onCellEditStarted(rowData, columnDef)
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
    console.log(monthDate)
    dispatch(setCurrentMonth(monthDate))
  }

  const nextMonth = getDateFromString(month)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthDisabled = !availableMonths.includes(formatMonthFromDateString(nextMonth))

  const prevMonth = getDateFromString(month)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevMonthDisabled = !availableMonths.includes(formatMonthFromDateString(prevMonth))

  return (
    <>
      <div className="budget-month-navigation">
        <IconButton disabled={prevMonthDisabled} onClick={() => navigateMonth(-1)}>
          <ArrowBackIosNewIcon />
        </IconButton>
        {(new Date(Date.UTC(...month.split('-')))).toLocaleDateString(undefined, { year: 'numeric', month: 'long'})}
        <IconButton disabled={nextMonthDisabled} onClick={() => navigateMonth(1)}>
          <ArrowForwardIosIcon />
        </IconButton>
      </div>

      <MaterialTable
        components={{
          Cell: budgetTableCell,
          EditCell: props => (
            <MTableEditCell {...props} onCellEditFinished={(rowData, columnDef) => {
              cellEditing = false
              props.onCellEditFinished(rowData, columnDef)
            }}></MTableEditCell>
          )
        }}
        options={{
          padding: "dense",
          paging: false,
          search: false,
          defaultExpanded: true,
          showTitle: false,
        }}
        icons={TableIcons}
        columns={columns}
        data={data}
        parentChildData={(row, rows) => rows.find(a => {
          return a.id === row.groupId
        })}
        cellEditable={{
          onCellEditApproved: async (newValue, oldValue, rowData, columnDef) => {
            // await onBudgetEdit()
            const newData = {
              ...rowData,
              [columnDef.field]: newValue,
            }

            switch (columnDef.field) {
              case 'budgeted':
                onBudgetEdit(newData, rowData)
                break
            }
          }
        }}
        // editable={{
        //   isEditable: rowData => rowData.groupId,
        //   onRowAdd: async (row) => {
        //     console.log(row)
        //   },
        //   onRowUpdate: async (newData, oldData) => {
        //     await onBudgetEdit(newData, oldData)
        //   },
        //   // onRowDelete: async (row) => {
        //   //   await onTransactionDelete(row)
        //   // },
        // }}
      />
    </>
  )
}
