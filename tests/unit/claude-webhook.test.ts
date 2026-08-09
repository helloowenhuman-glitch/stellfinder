import { expect, test } from 'vitest'
import { POST } from '@/app/api/inbound/claude/route'

test('rejects an inbound Claude request without the webhook secret', async () => {
  process.env.CLAUDE_WEBHOOK_SECRET = 'test-secret'

  const response = await POST(new Request('http://localhost/api/inbound/claude', {
    method: 'POST',
    body: JSON.stringify({ events: [] }),
  }))

  expect(response.status).toBe(401)
  await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
})
