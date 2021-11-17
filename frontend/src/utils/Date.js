export function getDateFromString(date) {
  let [year, month, day] = date.split('-').map(val => parseInt(val))

  // Month is zero-indexed in JS...
  month = month - 1
  if (month < 0) {
    month = 11
    year = year - 1
  }

  return new Date(year, month, day)
}

export function formatMonthFromDateString(date) {
  let tempDate = new Date(date)
  tempDate.setHours(0)
  tempDate.setDate(1)
  return tempDate.toISOString().split('T')[0]
}
