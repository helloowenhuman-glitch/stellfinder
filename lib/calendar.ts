import type { EventRecord } from '@/lib/domain'

const pad = (value: number) => String(value).padStart(2, '0')

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getMonthGrid(year: number, monthIndex: number): Date[] {
  const firstDay = new Date(year, monthIndex, 1)
  const gridStart = new Date(year, monthIndex, 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

export function getKoreaDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value

  return `${value('year')}-${value('month')}-${value('day')}`
}

function daysBetween(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)

  return Math.round((Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000)
}

function upcomingTargetDate(event: EventRecord): string {
  return (event.category === 'goods' && event.endAt ? event.endAt : event.startAt).slice(0, 10)
}

export function getDdayLabel(event: EventRecord, today = getKoreaDateKey()): string | null {
  if (event.category !== 'goods' || !event.endAt) {
    return null
  }

  const daysRemaining = daysBetween(today, event.endAt.slice(0, 10))

  if (daysRemaining < 0) {
    return null
  }

  return daysRemaining === 0 ? 'D-DAY' : `D-${daysRemaining}`
}

export function isUpcomingWithinFifteenDays(event: EventRecord, today = getKoreaDateKey()): boolean {
  const daysRemaining = daysBetween(today, upcomingTargetDate(event))

  return daysRemaining >= 0 && daysRemaining <= 15
}

export function getCalendarEventTitle(event: EventRecord, today = getKoreaDateKey()): string {
  const dday = getDdayLabel(event, today)

  return dday ? `${event.title} ${dday}` : event.title
}
