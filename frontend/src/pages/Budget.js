import React from 'react'
import BudgetTable from '../components/BudgetTable/BudgetTable'
import BudgetDetails from '../components/BudgetDetails'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/styles'

export default function Budget(props) {
  const theme = useTheme()

  return (
    <Box sx={{ backgroundColor: theme.palette.background.header, maxWidth: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <BudgetTable />
        </Grid>
        <Grid item xs={4} spacing={2}>
          <BudgetDetails />
        </Grid>
      </Grid>
    </Box>
  )
}
