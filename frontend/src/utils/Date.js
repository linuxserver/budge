export function formatMonthFromDateString(date) {
  let tempDate = new Date(date)
  tempDate.setHours(0)
  tempDate.setDate(1)
  return tempDate.toISOString().split('T')[0]
}
