import { expect, test, vi } from 'vitest'
import { ingestCandidates } from '@/lib/ingestion/ingest'
import { parseCandidate } from '@/lib/ingestion/schema'

test('stores valid candidates and reports whether they were created or updated', async () => {
  const candidate = parseCandidate({
    title: '히나 생일 이벤트',
    category: 'goods',
    startAt: '2026-08-12T00:00:00+09:00',
    participants: ['시라유키 히나'],
    sourceUrl: 'https://stellive.me/news/hina-birthday',
    sourceChannel: 'official-site',
    confidence: 0.95,
  })
  const writer = {
    findExistingSourceUrls: vi.fn().mockResolvedValue(new Set<string>()),
    upsert: vi.fn().mockResolvedValue(undefined),
  }

  await expect(ingestCandidates([candidate], writer)).resolves.toEqual({
    created: 1,
    updated: 0,
    review: 0,
  })
  expect(writer.upsert).toHaveBeenCalledWith([expect.objectContaining({
    source_url: 'https://stellive.me/news/hina-birthday',
    external_id: 'https://stellive.me/news/hina-birthday',
    display_color: '#FF4A60',
    status: 'verified',
  })])
})
