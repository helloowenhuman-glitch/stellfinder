import { ingestCandidates } from '@/lib/ingestion/ingest'
import { parseInboundPayload } from '@/lib/ingestion/schema'
import { createSupabaseEventWriter } from '@/lib/ingestion/supabase-writer'

export const runtime = 'nodejs'

function isAuthorized(request: Request) {
  const secret = process.env.CLAUDE_WEBHOOK_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

function storageOperation(error: unknown) {
  if (!(error instanceof Error)) {
    return undefined
  }

  if (error.message.startsWith('Unable to check existing events:')) {
    return 'lookup'
  }

  if (error.message.startsWith('Unable to save events:')) {
    return 'upsert'
  }

  return undefined
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let candidates

  try {
    candidates = parseInboundPayload(await request.json())
  } catch {
    return Response.json({ error: 'Invalid request payload' }, { status: 400 })
  }

  try {
    const result = await ingestCandidates(candidates, createSupabaseEventWriter())
    return Response.json({ received: candidates.length, ...result })
  } catch (error) {
    const operation = storageOperation(error)
    console.error(`Event storage failed${operation ? ` during ${operation}` : ''}`)
    return Response.json({ error: 'Event storage failure', ...(operation ? { operation } : {}) }, { status: 500 })
  }
}
