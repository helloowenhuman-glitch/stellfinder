// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { CalendarPage } from '@/components/calendar/CalendarPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('loads events from the public events API', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [{
      id: 'real-1', title: '실제 히나 일정', category: 'goods',
      startAt: '2026-08-12T00:00:00+09:00', endAt: null, allDay: true,
      participants: ['시라유키 히나'], displayColor: '#FF4A60', location: null,
      summary: '실제 데이터', sourceUrl: 'https://stellive.me/news/real-1',
      sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
    }] }),
  }))

  render(<CalendarPage />)

  expect(await screen.findByText('실제 히나 일정')).toBeVisible()
})

test('filters events by the member selected from the single member menu', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [
      {
        id: 'fuya-1', title: '후야 굿즈', category: 'goods',
        startAt: '2026-08-07T00:00:00+09:00', endAt: null, allDay: true,
        participants: ['사키하네 후야'], displayColor: '#6847B3', location: null,
        summary: '후야 행사', sourceUrl: 'https://stellive.me/news/fuya-1',
        sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
      },
      {
        id: 'nana-1', title: '나나 굿즈', category: 'goods',
        startAt: '2026-08-08T00:00:00+09:00', endAt: null, allDay: true,
        participants: ['하나코 나나'], displayColor: '#FF87CE', location: null,
        summary: '나나 행사', sourceUrl: 'https://stellive.me/news/nana-1',
        sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
      },
    ] }),
  }))

  render(<CalendarPage />)

  expect(await screen.findByText('후야 굿즈')).toBeVisible()
  expect(screen.queryByText('월간')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '멤버: 전체' }))
  fireEvent.click(screen.getByRole('button', { name: '사키하네 후야' }))

  expect(screen.getByRole('button', { name: '멤버: 사키하네 후야' })).toBeVisible()
  expect(screen.getByText('후야 굿즈')).toBeVisible()
  expect(screen.queryByText('나나 굿즈')).not.toBeInTheDocument()
})
