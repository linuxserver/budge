import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import { valueToDinero } from '../../utils/Currency'
import { toUnit } from 'dinero.js'
import clsx from 'clsx'
import { ROW_HEIGHT } from './constants'
import { setEditingRow } from '../../redux/slices/Accounts'
import { useTheme } from '@mui/styles'

export default function AccountTableRow({
  id,
  row,
  onCancel,
  onSave,
  classes,
  cancelAddTransaction,
  toggleRowSelected,
  toggleAllRowsSelected,
  categoriesMap,
  ...props
}) {
  const theme = useTheme()
  const dispatch = useDispatch()

  const editing = useSelector(state => state.accounts.editingRow === row.original.id)

  const buildCategoryOptions = rowData => {
    let options = { ...categoriesMap }
    if (rowData.categoryId !== '0') {
      delete options['0']
    }

    return options
  }

  const [categoryOptions, setCategoryOptions] = useState(buildCategoryOptions(row.original))
  const [rowData, setRowData] = useState({
    ...row.original,
    amount: toUnit(valueToDinero(row.original.amount), { digits: 2 }),
  })

  const updateRowData = (field, val) => {
    setRowData({
      ...rowData,
      [field]: val,
    })
  }

  const onRowDataChange = newRowData => {
    const options = buildCategoryOptions(newRowData)

    setCategoryOptions(options)

    if (rowData.categoryId === '0') {
      newRowData.categoryId = row.original.categoryId || Object.keys(categoriesMap)[1]
    }

    setRowData(newRowData)
  }

  const onCellKeyPress = e => {
    switch (e.key) {
      case 'Enter':
        return save()

      case 'Escape':
        return cancel()
    }
  }

  const save = () => {
    onSave(rowData)
    dispatch(setEditingRow(0))
  }

  const cancel = e => {
    if (e) {
      e.stopPropagation()
    }

    setRowData({
      ...row.original,
      amount: toUnit(valueToDinero(row.original.amount), { digits: 2 }),
    })
    dispatch(setEditingRow(0))
    onCancel(row.original.id)
  }

  const onRowClick = () => {
    if (editing) {
      return
    }

    if (row.isSelected === true) {
      return dispatch(setEditingRow(row.original.id))
    }

    cancelAddTransaction()
    dispatch(setEditingRow(0))
    toggleAllRowsSelected(false)
    toggleRowSelected(row.id)
  }

  return (
    <>
      <TableRow
        {...row.getRowProps()}
        onClick={onRowClick}
        {...props}
        sx={{
          width: '100%',
          display: 'table-row',
          ...(row.isSelected && { backgroundColor: theme.palette.action.hover }),
        }}
      >
        {row.cells.map(cell => {
          return (
            <TableCell
              {...cell.getCellProps()}
              component={Box}
              variant="body"
              align={cell.column.numeric || false ? 'right' : 'left'}
              className={clsx(classes.cell, !cell.column.width && classes.expandingCell)}
              sx={{
                // pt: '0px',
                // pb: '0px',
                // ...(editing && { borderBottom: 'none' }),
                flexBasis: cell.column.width || false,
                height: ROW_HEIGHT,
                ...(cell.column.style && cell.column.style),
              }}
            >
              {cell.render(editing === true ? 'Editing' : 'Cell', {
                value: rowData[cell.column.id],
                rowData,
                onChange: val => updateRowData(cell.column.id, val),
                onRowDataChange: onRowDataChange,
                categoryOptions: categoryOptions,
                onKeyDown: onCellKeyPress,
                save: save,
                cancel: cancel,
              })}
            </TableCell>
          )
        })}
      </TableRow>
    </>
  )
}
