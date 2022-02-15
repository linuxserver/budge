import React, { useState } from 'react'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { valueToDinero } from '../../utils/Currency'
import { toUnit } from 'dinero.js'

export default function AccountTableRow({ id, row, editing, onCancel, onSave, ...props }) {
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
    console.log(rowData)
    onSave(rowData)
  }

  const cancel = () => {
    setRowData({
      ...row.original,
      amount: toUnit(valueToDinero(row.original.amount), { digits: 2 }),
    })
    onCancel()
  }

  return (
    <>
      <TableRow {...row.getRowProps()} onClick={props.onClick} sx={{ width: '100%', display: 'table-row' }}>
        {row.cells.map(cell => {
          return (
            <TableCell
              {...cell.getCellProps()}
              sx={{
                pt: '0px',
                pb: '0px',
                display: 'table-cell',
                ...(editing && { borderBottom: 'none' }),
              }}
            >
              {cell.render(editing === true ? 'Editing' : 'Cell', {
                value: rowData[cell.column.id],
                rowData,
                onChange: val => updateRowData(cell.column.id, val),
                onRowDataChange: val => setRowData(val),
                onKeyDown: onCellKeyPress,
              })}
            </TableCell>
          )
        })}
      </TableRow>
      {editing && (
        <TableRow>
          <TableCell colSpan={5} sx={{ p: 0 }}></TableCell>
          <TableCell colSpan={2} sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ width: '100%', pr: 2, pb: 0.5 }}>
              <Button size="small" onClick={save}>
                Save
              </Button>
              <Button size="small" onClick={cancel}>
                Cancel
              </Button>
            </Stack>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
