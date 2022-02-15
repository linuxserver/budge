import React, { useState } from 'react'
import TableBody from '@mui/material/TableBody'
import AccountTableRow from './AccountTableRow'
import { inputToDinero, valueToDinero } from '../../utils/Currency'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'

export default function AccountTableBody({ rows, prepareRow, onRowSave, ...props }) {
  const [editingRow, setEditingRow] = useState(null)

  const onSave = (newData, oldData) => {
    setEditingRow(null)
    onRowSave(
      {
        ...newData,
        amount: inputToDinero(newData.amount),
      },
      {
        ...oldData,
        amount: valueToDinero(oldData.amount),
      },
    )
  }

  const onCancel = () => {
    setEditingRow(null)
  }

  return (
    <TableBody>
      {rows.map((row, i) => {
        prepareRow(row)
        return (
          <AccountTableRow
            editing={editingRow === row.id}
            onSave={rowData => onSave(rowData, row.original)}
            onCancel={onCancel}
            onClick={() => setEditingRow(row.id)}
            row={row}
          />
        )
      })}
    </TableBody>
  )
}
