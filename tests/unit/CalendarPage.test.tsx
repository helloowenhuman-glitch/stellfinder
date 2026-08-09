// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { CalendarPage } from '@/components/calendar/CalendarPage'

afterEach(() => vi.restoreAllMocks())

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
