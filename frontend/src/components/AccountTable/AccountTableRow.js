import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import { valueToDinero } from '../../utils/Currency'
import { toUnit } from 'dinero.js'
import clsx from 'clsx'
import { ROW_HEIGHT } from './constants'
import { setEditingRow } from '../../redux/slices/Accounts'

export default function AccountTableRow({ id, row, onCancel, onSave, classes, cancelAddTransaction, ...props }) {
  const dispatch = useDispatch()

  const editing = useSelector(state => state.accounts.editingRow === row.original.id)

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

    cancelAddTransaction()

    return dispatch(setEditingRow(row.original.id))
  }

  console.log('rendering')
  return (
    <>
      <TableRow {...row.getRowProps()} onClick={onRowClick} {...props} sx={{ width: '100%', display: 'table-row' }}>
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
              })}
            </TableCell>
          )
        })}
      </TableRow>
    </>
  )
}
