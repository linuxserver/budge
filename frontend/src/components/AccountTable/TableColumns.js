import React from 'react'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import { ROW_SIZE } from '../constants'

/**
 * Renders the headers row based on the columns provided.
 */
const TableColumns = ({ classes, columns }) => (
  <TableRow component={Box} className={`${classes.row} ${classes.headerRow}`}>
    {columns.map((column, colIndex) => {
      return (
        <TableCell
          key={colIndex}
          component={Box}
          variant="head"
          align={column.numeric || false ? 'right' : 'left'}
          className={`${classes.cell} ${classes.column}`}
          style={{
            flexBasis: column.width || false,
            height: ROW_SIZE,
          }}
          scope="col"
        >
          {column.label}
        </TableCell>
      )
    })}
  </TableRow>
)

export default TableColumns
