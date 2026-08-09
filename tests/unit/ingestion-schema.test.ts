import { expect, test } from 'vitest'
import { parseCandidate } from '@/lib/ingestion/schema'

test('rejects a candidate whose source is not an official Stellive or X URL', () => {
  expect(() => parseCandidate({
    title: '외부 출처 행사',
    category: 'goods',
    startAt: '2026-08-12T00:00:00+09:00',
    participants: ['시라유키 히나'],
    sourceUrl: 'https://example.com/event',
    sourceChannel: 'official-site',
    confidence: 0.95,
  })).toThrow(/sourceUrl/)
})

test('normalizes a trusted multi-member candidate for calendar storage', () => {
  expect(parseCandidate({
    title: 'STELLIVE 합동 팝업',
    category: 'offline',
    startAt: '2026-08-14T00:00:00+09:00',
    endAt: '2026-08-16T14:59:59+09:00',
    participants: ['아야츠노 유니', '아오쿠모 린'],
    sourceUrl: 'https://stellive.me/news/popup',
    sourceChannel: 'official-site',
    confidence: 0.95,
  })).toMatchObject({
    displayColor: '#8C6CFF',
    status: 'verified',
    allDay: true,
  })
})
