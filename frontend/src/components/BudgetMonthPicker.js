import React, { useState } from 'react'
import Popover from '@mui/material/Popover'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import StaticDatePicker from '@mui/lab/StaticDatePicker'
import TextField from '@mui/material/TextField'
import { getDateFromString } from '../utils/Date'
import {
  bindPopover,
} from 'material-ui-popup-state/hooks'
import { useDispatch } from 'react-redux'
import { setCurrentMonth } from "../redux/slices/Budgets";

export default function BudgetMonthPicker(props) {
  const dispatch = useDispatch()

  const [value, setValue] = useState(getDateFromString(props.currentMonth))

  const onChange = (newValue) => {
    if (value.getMonth() === newValue.getMonth()) {
      if (value.getYear() === newValue.getYear()) {
        return props.popupState.close()
      }

      // return
    }

    setValue(newValue)
    setMonth(newValue)
  }

  const setMonth = async (month) => {
    props.popupState.close()
    if (!month) {
      return
    }

    await dispatch(setCurrentMonth(month))
  }

  return (
    <Popover
      id={props.open ? 'month-picker-popover' : undefined}
      {...bindPopover(props.popupState)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      BackdropProps={{ onClick: () => props.popupState.close()}}
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
          onChange={() => true}
          onMonthChange={onChange}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
    </Popover>
  )
}
