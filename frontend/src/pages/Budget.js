import React from 'react'
import BudgetTable from '../components/BudgetTable/BudgetTable'
import BudgetDetails from '../components/BudgetDetails'
import Grid from '@mui/material/Grid'

export default function Budget(props) {
  return (
    <div style={{ maxWidth: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <BudgetTable />
        </Grid>
        <Grid item xs={3} spacing={2}>
          <BudgetDetails />
        </Grid>
      </Grid>
    </div>
  )
}
