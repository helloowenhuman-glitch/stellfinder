import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test, vi } from 'vitest'

const scriptUrl = new URL('../../scripts/submit-events.mjs', import.meta.url).href

async function writeEventPayload() {
  const directory = await mkdtemp(path.join(tmpdir(), 'stellfinder-submit-events-'))
  const filePath = path.join(directory, 'events.json')
  await writeFile(filePath, JSON.stringify({ events: [] }), 'utf8')
  return { directory, filePath }
}

test('posts the event JSON to the inbound webhook with the webhook secret', async () => {
  const { submitEvents } = await import(scriptUrl)
  const { directory, filePath } = await writeEventPayload()
  const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ received: 0 }), { status: 200 }))

  try {
    await expect(submitEvents({ filePath, secret: 'test-webhook-secret', fetchImpl })).resolves.toEqual({ received: 0 })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://stellfinder.vercel.app/api/inbound/claude',
      expect.objectContaining({
        method: 'POST',
        headers: {
          authorization: 'Bearer test-webhook-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ events: [] }),
      }),
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('refuses to send an event file when the webhook secret is missing', async () => {
  const { submitEvents } = await import(scriptUrl)
  const fetchImpl = vi.fn()
  const { directory, filePath } = await writeEventPayload()

  try {
    await expect(submitEvents({ filePath, secret: '', fetchImpl })).rejects.toThrow('CLAUDE_WEBHOOK_SECRET is required')
    expect(fetchImpl).not.toHaveBeenCalled()
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('reports the safe storage operation from a rejected webhook response', async () => {
  const { submitEvents } = await import(scriptUrl)
  const { directory, filePath } = await writeEventPayload()
  const fetchImpl = vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ error: 'Event storage failure', operation: 'upsert' }),
    { status: 500 },
  ))

  try {
    await expect(submitEvents({ filePath, secret: 'test-webhook-secret', fetchImpl }))
      .rejects.toThrow('The Stellfinder inbound webhook returned HTTP 500 (upsert).')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
