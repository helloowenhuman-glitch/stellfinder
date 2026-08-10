// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import type { EventRecord } from '@/lib/domain'

afterEach(cleanup)

const popupEvent: EventRecord = {
  id: 'popup',
  title: 'STELLIVE 팝업스토어',
  category: 'offline',
  startAt: '2026-08-12T00:00:00+09:00',
  endAt: '2026-08-14T23:59:59+09:00',
  allDay: true,
  participants: ['스텔라이브 단체'],
  displayColor: '#8C6CFF',
  location: '서울',
  summary: '예시 기간 행사',
  sourceUrl: 'https://stellive.me/news/example-popup',
  sourceChannel: 'official-site',
  sourcePublishedAt: null,
  status: 'verified',
}

test('renders one continuous bar across dates for a multi-day event in the same week', () => {
  render(<MonthGrid year={2026} monthIndex={7} events={[popupEvent]} onSelectEvent={() => undefined} />)

  const eventBars = screen.getAllByText('STELLIVE 팝업스토어')

  expect(eventBars).toHaveLength(1)
  expect(eventBars[0]).toHaveClass('rounded-md')
  expect(eventBars[0]).toHaveStyle({ gridColumn: '4 / span 3' })
})

test('splits a period bar at a week boundary without rounding the middle edges', () => {
  const crossingEvent: EventRecord = {
    ...popupEvent,
    id: 'crossing-popup',
    startAt: '2026-08-14T00:00:00+09:00',
    endAt: '2026-08-16T23:59:59+09:00',
  }

  render(<MonthGrid year={2026} monthIndex={7} events={[crossingEvent]} onSelectEvent={() => undefined} />)

  const eventBars = screen.getAllByText('STELLIVE 팝업스토어')

  expect(eventBars).toHaveLength(2)
  expect(eventBars[0]).toHaveStyle({ gridColumn: '6 / span 2' })
  expect(eventBars[0]).toHaveClass('rounded-l-md', 'rounded-r-none')
  expect(eventBars[1]).toHaveStyle({ gridColumn: '1 / span 1' })
  expect(eventBars[1]).toHaveClass('rounded-l-none', 'rounded-r-md')
})
