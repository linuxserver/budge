export async function sleep(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export function formatMonthFromDateString(date: Date): string {
  let tempDate = new Date(date)
  tempDate.setHours(0)
  tempDate.setDate(1)
  return tempDate.toISOString().split('T')[0]
}
