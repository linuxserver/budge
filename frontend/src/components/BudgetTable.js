import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import MaterialTable, { MTableCell, MTableEditField, MTableEditCell } from "@material-table/core";
import { TableIcons } from '../utils/Table'
import { fetchBudgetMonth, updateCategoryMonth } from "../redux/slices/Budgets";
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles(theme => ({
  categoryBalance: {
    '&.positive-balance': {
      color: '#32ae7b',
    },
  }
}))

export default function BudgetTable(props) {
  /**
   * Redux block
   */
  const dispatch = useDispatch()
  const month = useSelector(state => state.budgets.currentMonth)
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

  const columns = [
    {
      title: "Category", field: "categoryId", lookup: categoriesMap, editable: "onAdd", editComponent: props => (
        <TextField
        onChange={(e, value) => {
          console.log(props)
          props.onChange(value)
        }}
        label=""
        variant="standard" />
      )
    },
    { title: "Assigned", field: "budgeted", type: "currency", },
    { title: "Activity", field: "activity", type: "currency", editable: "never" },
    { title: "Balance", field: "balance", type: "currency", editable: "never" },
  ]

  const onBudgetEdit = async (newRow, oldRow) => {
    if (newRow.budgeted === oldRow.budgeted) {
      // Only update if the amount budgeted was changed
      return
    }

    await dispatch(updateCategoryMonth({ categoryId: newRow.categoryId, month, budgeted: newRow.budgeted }))

    return dispatch(fetchBudgetMonth({ month }))
  }

  const classes = useStyles()
  return (
    <MaterialTable
      title={(new Date(month)).toLocaleDateString(undefined, { year: 'numeric', month: 'long'})}
      components={{
        Cell: props => {
          const childProps = {
            ...props,
            onCellEditStarted: (rowData, columnDef) => {
              if (cellEditing === true) {
                return
              }

              cellEditing = true
              props.onCellEditStarted(rowData, columnDef)
            },
            ...(props.rowData.groupId === undefined && props.columnDef.field === 'budgeted') && { cellEditable: false }, // Don't let group rows get budgeted cell editable
          }

          if (props.columnDef.field === 'categoryId') {
            childProps.columnDef = {
              ...props.columnDef,
              initialEditValue: props.columnDef.lookup[props.rowData.categoryId]
            }
          }

          return (
            <MTableCell {...childProps}>
              {
                (props.columnDef.field === 'categoryId' && !props.rowData.groupId) && (
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}>
                    <IconButton aria-label="add" size="small" onClick={(event) => {
                      openCategoryDialog(props.rowData.categoryId)
                    }}>
                      <AddCircleIcon />
                    </IconButton>
                  </div>
              )}
            </MTableCell>
          )
        },
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
  )
}
