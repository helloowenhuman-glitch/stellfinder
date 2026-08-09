import { expect, test } from 'vitest'
import { getMonthGrid, toDateKey } from '@/lib/calendar'

test('August 2026 grid starts on Sunday and has six weeks', () => {
  const grid = getMonthGrid(2026, 7)

  expect(grid).toHaveLength(42)
  expect(toDateKey(grid[0])).toBe('2026-07-26')
  expect(toDateKey(grid[41])).toBe('2026-09-05')
})

test('date key is stable in the Korean time zone', () => {
  expect(toDateKey(new Date('2026-08-01T00:00:00+09:00'))).toBe('2026-08-01')
})
