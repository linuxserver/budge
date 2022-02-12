import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { accountsSelectors, editAccount } from '../../redux/slices/Accounts'
import { FromAPI, getBalanceColor, intlFormat } from '../../utils/Currency'
import { usePopupState } from 'material-ui-popup-state/hooks'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/styles'
import { createSelector } from '@reduxjs/toolkit'

export default function BalanceCalculation({ account }) {
  const theme = useTheme()

  return (
    <Stack direction="row" justifyContent="space-evenly" alignItems="center" spacing={0}>
      <div>
        <Stack
          direction="column"
          justifyContent="center"
          alignItems="center"
          // spacing={2}
        >
          <Typography
            style={{
              color: getBalanceColor(account.cleared, theme),
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            {intlFormat(account.cleared)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Cleared
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
              color: getBalanceColor(account.uncleared, theme),
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            {intlFormat(account.uncleared)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Uncleared
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
              color: getBalanceColor(account.balance, theme),
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            {intlFormat(account.balance)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
            }}
          >
            Balance
          </Typography>
        </Stack>
      </div>
    </Stack>
  )
}
