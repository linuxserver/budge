import React, { useState } from 'react'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { valueToDinero } from '../../utils/Currency'
import { toUnit } from 'dinero.js'
import clsx from 'clsx'
import { ROW_HEIGHT } from './constants'

export default function AccountTableRow({
  id,
  row,
  editing,
  onCancel,
  onSave,
  onClick,
  classes,
  setEditingRow,
  ...props
}) {
  const [rowData, setRowData] = useState({
    ...row.original,
    amount: toUnit(valueToDinero(row.original.amount), { digits: 2 }),
  })

  const [focused, setFocused] = useState(new Set())

  const updateRowData = (field, val) => {
    setRowData({
      ...rowData,
      [field]: val,
    })
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
  }

  const cancel = () => {
    setRowData({
      ...row.original,
      amount: toUnit(valueToDinero(row.original.amount), { digits: 2 }),
    })
    onCancel(row.original.id)
  }

  const onFocus = e => {
    console.log('focus')
    const newSet = new Set(focused)
    newSet.add(e.target.id)
    setFocused(newSet)
  }

  const onBlur = e => {
    console.log('blur')
    const newSet = new Set(focused)
    newSet.delete(e.target.id)
    setFocused(newSet)

    if (newSet.size === 0) {
      // setEditingRow(null)
    }
  }

  return (
    <>
      <TableRow {...row.getRowProps()} onClick={onClick} {...props} sx={{ width: '100%', display: 'table-row' }}>
        {row.cells.map(cell => {
          return (
            <TableCell
              {...cell.getCellProps()}
              component="div"
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
                onRowDataChange: val => setRowData(val),
                onKeyDown: onCellKeyPress,
                save: save,
                cancel: cancel,
                onFocus: onFocus,
                onBlur: onBlur,
              })}
            </TableCell>
          )
        })}
      </TableRow>
    </>
  )
}
