import React from 'react'
import BudgetTable from '../components/BudgetTable/BudgetTable'
import BudgetDetails from '../components/BudgetDetails'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/styles'

export default function Budget(props) {
  const theme = useTheme()

  return (
    <Box sx={{ backgroundColor: theme.palette.background.tableBody, maxWidth: '100%' }}>
      <Grid container>
        <Grid item xs={8}>
          <BudgetTable />
        </Grid>

        <Grid
          item
          xs={4}
          sx={{
            backgroundColor: theme.palette.background.details,
            borderLeft: `1px solid ${theme.palette.action.disabledBackground}`,
          }}
        >
          <BudgetDetails />
        </Grid>
      </Grid>
    </Box>
  )
}
