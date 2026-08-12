// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import type { EventRecord } from '@/lib/domain'
import type { MemberBirthday } from '@/lib/member-birthdays'

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
  expect(eventBars[0]).toHaveClass('text-center')
  expect(eventBars[0]).toHaveStyle({ gridColumn: '4 / span 3' })
})

test('renders each weekly period bar with rounded ends and a centered title', () => {
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
  expect(eventBars[0]).toHaveClass('rounded-md', 'text-center')
  expect(eventBars[1]).toHaveStyle({ gridColumn: '1 / span 1' })
  expect(eventBars[1]).toHaveClass('rounded-md', 'text-center')
})

test('pins a calendar date to the top of its clickable cell', () => {
  render(<MonthGrid year={2026} monthIndex={7} events={[]} onSelectEvent={() => undefined} />)

  const dateCell = screen.getByRole('button', { name: '2026-08-02 일정 열기' })

  expect(dateCell).toHaveClass('flex', 'items-start')
})

test('renders a rounded member-color birthday badge on its date', () => {
  const huyaBirthday: MemberBirthday = {
    member: '사키하네 후야',
    month: 7,
    day: 7,
    profileUrl: 'https://stellive.me/huya',
  }

  render(<MonthGrid birthdays={[huyaBirthday]} year={2026} monthIndex={6} events={[]} onSelectEvent={() => undefined} onSelectBirthday={() => undefined} />)

  const birthdayBadge = screen.getByRole('button', { name: '사키하네 후야 생일' })

  expect(birthdayBadge).toHaveClass('rounded-full')
  expect(birthdayBadge).toHaveStyle({ color: '#6847B3' })
})

test('marks the supplied today key with a navy date marker', () => {
  render(<MonthGrid year={2026} monthIndex={7} events={[]} onSelectEvent={() => undefined} todayKey="2026-08-12" />)

  expect(screen.getByText('12')).toHaveClass('bg-[#102B52]', 'text-white')
})

test('shows three event rows and an overflow count for a dense date', () => {
  const events = Array.from({ length: 4 }, (_, index) => ({
    ...popupEvent,
    id: `dense-${index}`,
    title: `Dense event ${index + 1}`,
    startAt: '2026-08-07T00:00:00+09:00',
    endAt: null,
  }))

  render(<MonthGrid year={2026} monthIndex={7} events={events} onSelectEvent={() => undefined} />)

  expect(screen.getByText('Dense event 1')).toBeVisible()
  expect(screen.getByText('Dense event 2')).toBeVisible()
  expect(screen.getByText('Dense event 3')).toBeVisible()
  expect(screen.queryByText('Dense event 4')).not.toBeInTheDocument()
  expect(screen.getByLabelText('2026-08-07 hidden events 1')).toHaveClass('bg-[#E2E8F0]', 'text-[#475569]')
})

test('counts a birthday as the fourth calendar item on its date', () => {
  const events = Array.from({ length: 3 }, (_, index) => ({
    ...popupEvent,
    id: `birthday-dense-${index}`,
    title: `Birthday dense event ${index + 1}`,
    startAt: '2026-08-07T00:00:00+09:00',
    endAt: null,
  }))
  const birthday: MemberBirthday = {
    member: '사키하네 후야',
    month: 8,
    day: 7,
    profileUrl: 'https://stellive.me/huya',
  }

  render(<MonthGrid birthdays={[birthday]} year={2026} monthIndex={7} events={events} onSelectBirthday={() => undefined} onSelectEvent={() => undefined} />)

  expect(screen.queryByRole('button', { name: '사키하네 후야 생일' })).not.toBeInTheDocument()
  expect(screen.getByLabelText('2026-08-07 hidden events 1')).toBeVisible()
})

test('uses only the rendered event rows when placing birthdays', () => {
  const events = [7, 8, 9, 10].map((day) => ({
    ...popupEvent,
    id: `separate-${day}`,
    title: `Separate event ${day}`,
    startAt: `2026-08-${day}T00:00:00+09:00`,
    endAt: null,
  }))
  const birthday: MemberBirthday = {
    member: '사키하네 후야',
    month: 8,
    day: 12,
    profileUrl: 'https://stellive.me/huya',
  }

  render(<MonthGrid birthdays={[birthday]} year={2026} monthIndex={7} events={events} onSelectBirthday={() => undefined} onSelectEvent={() => undefined} />)

  expect(screen.getByRole('button', { name: '사키하네 후야 생일' }).parentElement).toHaveStyle({ top: '64px' })
})

test('hides the fourth item without adding a dense-cell gradient', () => {
  const events = Array.from({ length: 4 }, (_, index) => ({
    ...popupEvent,
    id: `dense-fade-${index}`,
    startAt: '2026-08-07T00:00:00+09:00',
    endAt: null,
  }))

  const { container } = render(<MonthGrid year={2026} monthIndex={7} events={events} onSelectEvent={() => undefined} />)

  expect(screen.getByLabelText('2026-08-07 hidden events 1')).toBeVisible()
  expect(container.querySelector('[class*="bg-gradient-to"]')).not.toBeInTheDocument()
})

test('shows an event on a later date when that date has fewer than three items', () => {
  const events = [
    { ...popupEvent, id: 'spanning-a', title: 'Spanning A', startAt: '2026-08-07T00:00:00+09:00', endAt: '2026-08-08T23:59:59+09:00' },
    { ...popupEvent, id: 'one-day-b', title: 'One-day B', startAt: '2026-08-07T00:00:00+09:00', endAt: null },
    { ...popupEvent, id: 'one-day-c', title: 'One-day C', startAt: '2026-08-07T00:00:00+09:00', endAt: null },
    { ...popupEvent, id: 'spanning-d', title: 'Spanning D', startAt: '2026-08-07T00:00:00+09:00', endAt: '2026-08-08T23:59:59+09:00' },
  ]

  render(<MonthGrid year={2026} monthIndex={7} events={events} onSelectEvent={() => undefined} />)

  const laterSegment = screen.getByText('Spanning D')

  expect(laterSegment).toHaveStyle({ gridColumn: '7 / span 1', gridRow: '2' })
  expect(screen.getByLabelText('2026-08-07 hidden events 1')).toBeVisible()
})
