import { expect, test, vi } from 'vitest'
import { ingestCandidates } from '@/lib/ingestion/ingest'
import { POST } from '@/app/api/inbound/claude/route'

vi.mock('@/lib/ingestion/ingest', () => ({
  ingestCandidates: vi.fn(),
}))

vi.mock('@/lib/ingestion/supabase-writer', () => ({
  createSupabaseEventWriter: vi.fn(),
}))

test('rejects an inbound Claude request without the webhook secret', async () => {
  process.env.CLAUDE_WEBHOOK_SECRET = 'test-secret'

  const response = await POST(new Request('http://localhost/api/inbound/claude', {
    method: 'POST',
    body: JSON.stringify({ events: [] }),
  }))

  expect(response.status).toBe(401)
  await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
})

test('reports event storage failures separately from invalid payloads', async () => {
  process.env.CLAUDE_WEBHOOK_SECRET = 'test-secret'
  vi.mocked(ingestCandidates).mockRejectedValueOnce(new Error('database connection failed'))

  const response = await POST(new Request('http://localhost/api/inbound/claude', {
    method: 'POST',
    headers: { authorization: 'Bearer test-secret' },
    body: JSON.stringify({ events: [] }),
  }))

  expect(response.status).toBe(500)
  await expect(response.json()).resolves.toEqual({ error: 'Event storage failure' })
})
