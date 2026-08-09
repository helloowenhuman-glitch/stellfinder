import { expect, test } from 'vitest'
import { mapEventRow } from '@/lib/events'

test('maps a Supabase event row to the calendar event contract', () => {
  const event = mapEventRow({
    id: 'event-1', title: '린 콜라보', category: 'collaboration',
    start_at: '2026-08-21T00:00:00+09:00', end_at: null, all_day: true,
    participants: ['아오쿠모 린'], display_color: '#0045C8', location: null,
    summary: '공식 공지 기반 일정', source_url: 'https://stellive.me/news/1',
    source_channel: 'official-site', source_published_at: null, status: 'verified',
  })

  expect(event).toMatchObject({
    title: '린 콜라보', startAt: '2026-08-21T00:00:00+09:00',
    displayColor: '#0045C8', sourceChannel: 'official-site', status: 'verified',
  })
})
