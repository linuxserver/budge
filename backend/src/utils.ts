import { DateTime } from 'luxon'

export async function sleep(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export function getDateFromString(date: string): DateTime {
  return DateTime.fromISO(date)
}

export function formatMonthFromDateString(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }

  let tempDate = DateTime.fromISO(date.toISOString())
  tempDate = tempDate.set({ day: 1 })
  return tempDate.toISO().split('T')[0]
}

export function getMonthDate(): DateTime {
  const today = DateTime.now()
  return today.set({ day: 1 })
}

export function getMonthString(): string {
  return getMonthDate().toISO().split('T')[0]
}

export function getMonthStringFromNow(monthsAway: number): string {
  let today: DateTime = DateTime.now()
  today = today.set({ day: 1 }).plus({ month: monthsAway })

  return today.toISO().split('T')[0]
}
