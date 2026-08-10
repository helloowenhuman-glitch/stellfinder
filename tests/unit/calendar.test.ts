import { expect, test } from 'vitest'
import { getDdayLabel, getMonthGrid, isUpcomingWithinFifteenDays, toDateKey } from '@/lib/calendar'
import type { EventRecord } from '@/lib/domain'

test('August 2026 grid starts on Sunday and has six weeks', () => {
  const grid = getMonthGrid(2026, 7)

  expect(grid).toHaveLength(42)
  expect(toDateKey(grid[0])).toBe('2026-07-26')
  expect(toDateKey(grid[41])).toBe('2026-09-05')
})

test('date key is stable in the Korean time zone', () => {
  expect(toDateKey(new Date('2026-08-01T00:00:00+09:00'))).toBe('2026-08-01')
})

const saleEvent: EventRecord = {
  id: 'sale',
  title: '생일 한정 굿즈 예약 판매',
  category: 'goods',
  startAt: '2026-08-01T00:00:00+09:00',
  endAt: '2026-09-07T23:59:59+09:00',
  allDay: true,
  participants: ['사키하네 후야'],
  displayColor: '#6847B3',
  location: null,
  summary: '',
  sourceUrl: 'https://stellive.me/news/fuya-goods',
  sourceChannel: 'official-site',
  sourcePublishedAt: null,
  status: 'verified',
}

test('shows a sale countdown from the Korean calendar date through D-DAY', () => {
  expect(getDdayLabel(saleEvent, '2026-08-07')).toBe('D-31')
  expect(getDdayLabel(saleEvent, '2026-09-07')).toBe('D-DAY')
})

test('includes only events with fifteen or fewer days remaining in the upcoming view', () => {
  expect(isUpcomingWithinFifteenDays(saleEvent, '2026-08-23')).toBe(true)
  expect(isUpcomingWithinFifteenDays(saleEvent, '2026-08-22')).toBe(false)
})
