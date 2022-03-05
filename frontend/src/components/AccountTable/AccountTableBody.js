import React, { useEffect, useState } from 'react'
import TableBody from '@mui/material/TableBody'
import Box from '@mui/material/Box'
import AccountTableRow from './AccountTableRow'
import { inputToDinero, valueToDinero } from '../../utils/Currency'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import { ROW_HEIGHT } from './constants'
import { setEditingRow } from '../../redux/slices/Accounts'

export default function AccountTableBody({
  rows,
  prepareRow,
  onRowSave,
  classes,
  selectedRowIds,
  cancelAddTransaction,
  onTransactionAdd,
  toggleRowSelected,
  toggleAllRowsSelected,
  categoriesMap,
  ...props
}) {
  useEffect(() => {})

  const onSave = (newData, oldData) => {
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
    cancelAddTransaction()
  }

  const Row = ({ index, style }) => {
    const row = rows[index]

    prepareRow(row)
    return (
      <AccountTableRow
        component={Box}
        style={style}
        className={classes.row}
        onSave={rowData => onSave(rowData, row.original)}
        onCancel={onCancel}
        row={row}
        classes={classes}
        cancelAddTransaction={cancelAddTransaction}
        toggleRowSelected={toggleRowSelected}
        toggleAllRowsSelected={toggleAllRowsSelected}
        categoriesMap={categoriesMap}
      />
    )
  }

  return (
    <TableBody component={Box} className={classes.tbody} {...props}>
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
