import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/styles'
import { getBalanceColor, inputToDinero, intlFormat, valueToDinero } from '../../utils/Currency'
import { selectActiveBudget } from '../../redux/slices/Budgets'
import { add } from 'dinero.js'

export default function BudgetMonthCalculation({ account }) {
  const theme = useTheme()

  const month = useSelector(state => state.budgets.currentMonth)
  const budgetMonth = useSelector(state => {
    return state.budgetMonths.entities[month] || null
  })

  const income = budgetMonth ? valueToDinero(budgetMonth.income) : inputToDinero(0)
  const activity = budgetMonth ? valueToDinero(budgetMonth.activity) : inputToDinero(0)

  return (
    <Stack direction="row" justifyContent="space-evenly" alignItems="center" spacing={2}>
      <div>
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          // spacing={2}
        >
          <Typography
            style={{
              color: getBalanceColor(income, theme),
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            {intlFormat(income)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Income
          </Typography>
        </Stack>
      </div>

      <Box
        sx={{
          ...theme.typography.h6,
        }}
      >
        +
      </Box>

      <div>
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          // spacing={2}
        >
          <Typography
            style={{
              color: getBalanceColor(activity, theme),
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            {intlFormat(activity)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Spent
          </Typography>
        </Stack>
      </div>

      <Box
        sx={{
          ...theme.typography.h6,
        }}
      >
        =
      </Box>

      <div>
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          // spacing={2}
        >
          <Typography
            style={{
              color: getBalanceColor(add(income, activity), theme),
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            {intlFormat(add(income, activity))}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Net
          </Typography>
        </Stack>
      </div>
    </Stack>
  )
}
