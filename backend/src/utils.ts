export async function sleep(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export function getDateFromString(date: string): Date {
  let [year, month, day] = date.split('-').map(val => parseInt(val))

  // Month is zero-indexed in JS...
  month = month - 1
  if (month < 0) {
    month = 11
    year = year - 1
  }

  return new Date(year, month, day)
}

export function formatMonthFromDateString(date: Date): string {
  let tempDate = new Date(date)
  tempDate.setHours(0)
  tempDate.setDate(1)
  return tempDate.toISOString().split('T')[0]
}

export function getMonthDate(): Date {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), 1)
  return date
}

export function getMonthString(): string {
  return getMonthDate().toISOString().split('T')[0]
}

export function getMonthStringFromNow(monthsAway: number): string {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), 1)
  date.setMonth(date.getMonth() + monthsAway)
  return date.toISOString().split('T')[0]
}
