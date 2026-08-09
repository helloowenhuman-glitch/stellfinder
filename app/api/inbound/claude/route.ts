import { ingestCandidates } from '@/lib/ingestion/ingest'
import { parseInboundPayload } from '@/lib/ingestion/schema'
import { createSupabaseEventWriter } from '@/lib/ingestion/supabase-writer'

export const runtime = 'nodejs'

function isAuthorized(request: Request) {
  const secret = process.env.CLAUDE_WEBHOOK_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const candidates = parseInboundPayload(await request.json())
    const result = await ingestCandidates(candidates, createSupabaseEventWriter())
    return Response.json({ received: candidates.length, ...result })
  } catch {
    return Response.json({ error: 'Invalid request payload or event storage failure' }, { status: 400 })
  }
}
