import React from 'react'
import BudgetTable from '../components/BudgetTable/BudgetTable'
import BudgetDetails from '../components/BudgetDetails'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/styles'
import { useSelector } from 'react-redux'

export default function Budget(props) {
  const theme = useTheme()

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ width: '100%', height: '100%' }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.details,
          width: '100%',
        }}
      >
        <BudgetTable index={0} />
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.background.details,
          width: 600,
          maxWidth: 600,
          display: 'grid',
          height: '100vh',
          overflow: 'auto',
          borderLeft: `1px solid ${theme.palette.action.disabledBackground}`,
        }}
      >
        <BudgetDetails />
      </Box>
    </Stack>
  )
}
