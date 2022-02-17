import React, { useState } from 'react'
import TableBody from '@mui/material/TableBody'
import AccountTableRow from './AccountTableRow'
import { inputToDinero, valueToDinero } from '../../utils/Currency'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import { ROW_HEIGHT } from './constants'

export default function AccountTableBody({
  rows,
  prepareRow,
  onRowSave,
  classes,
  toggleRowSelected,
  selectedRowIds,
  cancelAddTransaction,
  onTransactionAdd,
  ...props
}) {
  const [editingRow, setEditingRow] = useState(0)

  const onSave = (newData, oldData) => {
    setEditingRow(0)

    if (newData.id === 0) {
      return onTransactionAdd({
        ...newData,
        amount: inputToDinero(newData.amount),
      })
    }

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

  const onCancel = id => {
    if (id !== 0) {
      return setEditingRow(0)
    }

    cancelAddTransaction()
  }

  const onRowClick = id => {
    // if (editingRow === id) {
    //   return
    // }

    // if (selectedRowIds[id] === true) {
    return setEditingRow(id)
    // }

    // toggleRowSelected({
    //   id: true,
    //   ...Object.keys(selectedRowIds).reduce((allIds, rowId) => {
    //     allIds[rowId] = false
    //     return allIds
    //   }, {}),
    // })
  }

  const Row = ({ index, style }) => {
    const row = rows[index]

    prepareRow(row)
    return (
      <AccountTableRow
        component="div"
        style={style}
        className={classes.row}
        editing={editingRow === row.id}
        onSave={rowData => onSave(rowData, row.original)}
        onCancel={onCancel}
        onClick={() => onRowClick(row.id)}
        setEditingRow={setEditingRow}
        row={row}
        classes={classes}
      />
    )
  }

  return (
    <TableBody component="div" className={classes.tbody} {...props}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            className={classes.list}
            height={height}
            width={width}
            itemCount={rows.length}
            itemSize={ROW_HEIGHT}
            // itemKey={itemKey}
            // itemData={itemData}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </TableBody>
  )
}
