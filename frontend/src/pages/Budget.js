import React from 'react'
import BudgetTable from '../components/BudgetTable/BudgetTable'
import BudgetDetails from '../components/BudgetDetails'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/styles'
import BudgetTableHeader from '../components/BudgetTable/BudgetTableHeader'

export default function Budget(props) {
  const theme = useTheme()

  return (
    <Box sx={{ backgroundColor: theme.palette.background.details, maxWidth: '100%' }}>
      <Grid container>
        <Grid item xs={4}>
          <BudgetDetails />
        </Grid>

        <Grid
          item
          xs={8}
          sx={{
            backgroundColor: theme.palette.background.tableBody,
            borderLeft: `1px solid ${theme.palette.action.disabledBackground}`,
          }}
        >
          <BudgetTable index={0} />
        </Grid>
      </Grid>
    </Box>
  )
}
