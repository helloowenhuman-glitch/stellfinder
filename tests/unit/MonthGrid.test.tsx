// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import type { EventRecord } from '@/lib/domain'

const popupEvent: EventRecord = {
  id: 'popup',
  title: 'STELLIVE 팝업스토어',
  category: 'offline',
  startAt: '2026-08-14T00:00:00+09:00',
  endAt: '2026-08-16T23:59:59+09:00',
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

test('renders a rounded event bar for a multi-day event', () => {
  render(<MonthGrid year={2026} monthIndex={7} events={[popupEvent]} onSelectEvent={() => undefined} />)

  const eventBars = screen.getAllByText('STELLIVE 팝업스토어')

  expect(eventBars).toHaveLength(3)
  expect(eventBars[0]).toHaveClass('rounded-md')
})
