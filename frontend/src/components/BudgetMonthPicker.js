import React, { useState } from 'react'
import Popover from '@mui/material/Popover'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import StaticDatePicker from '@mui/lab/StaticDatePicker'
import TextField from '@mui/material/TextField'
import Backdrop from '@mui/material/Backdrop'
import { getDateFromString, formatMonthFromDateString } from '../utils/Date'

export default function BudgetMonthPicker(props) {
  const [value, setValue] = useState(getDateFromString(props.currentMonth))

  const onChange = (newValue) => {
    if (value.getMonth() === newValue.getMonth()) {
      if (value.getYear() === newValue.getYear()) {
        return handleClose()
      }

      return
    }

    setValue(newValue)
    handleClose(newValue)
  }

  const handleClose = (value) => {
    props.onClose(value)
  }

  return (
    <Popover
      id={props.open ? 'month-picker-popover' : undefined}
      open={props.open}
      anchorEl={props.anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      BackdropProps={{ onClick: () => handleClose(null)}}
    >
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          views={['month', 'year']}
          openTo="month"
          showTodayButton={true}
          minDate={new Date(Date.UTC(...props.minDate.split('-')))}
          maxDate={new Date(Date.UTC(...props.maxDate.split('-')))}
          value={value}
          onChange={onChange}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
    </Popover>
  )
}
