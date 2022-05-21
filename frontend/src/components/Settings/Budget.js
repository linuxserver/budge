import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import { useSelector, useDispatch } from 'react-redux'
import { selectActiveBudget, updateBudget } from '../../redux/slices/Budgets'
import { Currency } from '../../utils/Currency'

export default function Account({ index, value, ...props }) {
  const dispatch = useDispatch()

  const budget = useSelector(selectActiveBudget)
  const [budgetName, setBudgetName] = useState(budget.name)
  const [currency, setCurrency] = useState(budget.currency)

  const submit = async () => {
    if (!budgetName) {
      // error
    }

    await dispatch(
      updateBudget({
        name: budgetName,
        currency,
      }),
    )
    props.close()

    if (currency !== budget.currency) {
      window.location.reload(false)
    }
  }

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...props}
      sx={{ height: '90%' }} // @TODO: this this
    >
      {value === index && (
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="space-around"
          spacing={0}
          sx={{ pt: 2, height: '100%' }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
            <TextField
              value={budgetName}
              onChange={e => setBudgetName(e.target.value)}
              variant="standard"
              label="Budget Name"
            />
            <Stack direction="column">
              <InputLabel id="demo-simple-select-label">Currency</InputLabel>
              <Select
                labelId="currency-selection"
                id="currency-select"
                value={currency}
                label="Currency"
                variant="standard"
                onChange={e => setCurrency(e.target.value)}
              >
                {Currency.getAvailableCurrencies().map(currency => (
                  <MenuItem value={currency}>{currency}</MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ pt: 2 }}>
            <Button size="small" onClick={submit}>
              SAVE
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
