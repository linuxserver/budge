import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useSelector, useDispatch } from 'react-redux'
import Button from '@mui/material/Button'
import { parse } from 'csv-parse/browser/esm/sync'
import { multiply } from 'dinero.js'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import CircularProgress from '@mui/material/CircularProgress'
import { inputToDinero } from '../utils/Currency'
import { fetchAccounts, createTransactions, fetchAccountTransactions } from '../redux/slices/Accounts'
import { createPayee, fetchPayees } from '../redux/slices/Payees'
import { refreshBudget, fetchAvailableMonths } from '../redux/slices/Budgets'
import { fetchBudgetMonths } from '../redux/slices/BudgetMonths'

export default function ImportCSV({ accountId, open, close }) {
  const dispatch = useDispatch()

  const [stage, setStage] = useState('UPLOAD')
  const [headersIncluded, setHeadersIncluded] = useState(false)
  const [columnsMap, setColumnsMap] = useState([])
  const [data, setData] = useState([])

  const inflowCategory = useSelector(state => Object.values(state.categories.entities).find(cat => cat.inflow === true))
  const payees = useSelector(state => Object.values(state.payees.entities))

  let availableColumns = ['Ignore', 'Amount', 'Inflow', 'Outflow', 'Payee', 'Memo', 'Date']

  const uploadFile = event => {
    let file = event.target.files[0]

    if (file) {
      const reader = new FileReader()
      reader.addEventListener(
        'load',
        () => {
          // this will then display a text file
          const csvData = parse(reader.result, {
            // columns: headersIncluded,
          })
          setData(csvData)
          setColumnsMap(csvData[0].map(() => 'Ignore'))
          setStage('MATCH')
        },
        false,
      )

      reader.readAsText(file)
    }
  }

  const setHeadersChecked = e => {
    setHeadersIncluded(e.target.checked)
  }

  const setMapping = (index, value) => {
    setColumnsMap(columnsMap.map((currentValue, i) => (index === i ? value : currentValue)))
  }

  const createNewPayee = async name => {
    name = name.replace(/^New: /, '')
    return (
      await dispatch(
        createPayee({
          name,
        }),
      )
    ).payload
  }

  const importTransactions = async () => {
    setStage('IMPORT')
    const newPayees = {}
    let bulk = []

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      if (rowIndex === 0 && headersIncluded) {
        continue
      }

      let newTransaction = {
        accountId: accountId,
        amount: 0,
        date: new Date(),
        memo: '',
        payeeId: '',
        categoryId: inflowCategory.id,
        status: 0,
      }

      for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
        const value = row[columnIndex]

        switch (columnsMap[columnIndex]) {
          case 'Ignore':
            break
          case 'Amount':
            newTransaction.amount = inputToDinero(parseFloat(value.replace(/[^0-9\.]/, '')))
            break
          case 'Inflow':
            if (parseFloat(value) !== 0) {
              newTransaction.amount = inputToDinero(parseFloat(value.replace(/[^0-9\.]/, '')))
            }
            break
          case 'Outflow':
            if (parseFloat(value) !== 0) {
              newTransaction.amount = multiply(inputToDinero(parseFloat(value.replace(/[^0-9\.]/, ''))), -1)
            }
            break
          case 'Memo':
            newTransaction.memo = value
            break
          case 'Date':
            newTransaction.date = new Date(value)
            break
          case 'Payee':
            const existingPayee = payees.find(payee => payee.name === value)
            if (!existingPayee) {
              if (newPayees[value]) {
                newTransaction.payeeId = newPayees[value]
              } else {
                newTransaction.payeeId = (await createNewPayee(value)).id
                newPayees[value] = newTransaction.payeeId
              }
            } else {
              newTransaction.payeeId = existingPayee.id
            }

            break
        }
      }

      bulk.push(newTransaction)
      if (bulk.length >= 100) {
        await dispatch(createTransactions({ transactions: bulk }))
        bulk = []
        break
      }
    }

    if (bulk.length > 0) {
      await dispatch(createTransactions({ transactions: bulk }))
    }

    await dispatch(fetchBudgetMonths())
    dispatch(refreshBudget())
    dispatch(fetchAvailableMonths())
    dispatch(fetchAccounts())
    dispatch(fetchPayees())
    dispatch(fetchAccountTransactions({ accountId }))

    onClose()
  }

  const onClose = () => {
    close()
    setStage('UPLOAD')
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Import from CSV</DialogTitle>
      <Box
        sx={{
          minWidth: '600px',
          p: 2,
        }}
      >
        {stage === 'UPLOAD' && (
          <Box sx={{}}>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={headersIncluded} onChange={setHeadersChecked} />}
                label="Headers Included"
              />
            </FormGroup>

            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0} sx={{ pt: 2 }}>
              <Button size="small" component="label">
                Select File
                <input type="file" hidden accept=".csv" onChange={uploadFile} />
              </Button>
              <Button size="small" component="label" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </Box>
        )}

        {stage === 'MATCH' && (
          <Box>
            <Typography variant="h6">Map CSV Columns</Typography>
            {data[0].map((value, index) => (
              <Box key={index} sx={{ width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0}>
                  <Box>{value}</Box>
                  <Box>
                    <Select
                      variant="standard"
                      dense
                      value={columnsMap[index]}
                      onChange={e => setMapping(index, e.target.value)}
                      sx={{ minWidth: '150px' }}
                    >
                      {availableColumns.map(column => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Stack>
              </Box>
            ))}

            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0} sx={{ pt: 2 }}>
              <Button size="small" component="label" onClick={importTransactions}>
                Import
              </Button>

              <Button size="small" component="label" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </Box>
        )}

        {stage === 'IMPORT' && (
          <Box sx={{ display: 'flex' }} sx={{ textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
