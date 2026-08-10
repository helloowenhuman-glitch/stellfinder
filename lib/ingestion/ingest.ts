import type { ParsedCandidate } from '@/lib/ingestion/schema'

export type EventInsert = {
  title: string
  category: ParsedCandidate['category']
  start_at: string
  end_at: string | null
  all_day: boolean
  participants: ParsedCandidate['participants']
  display_color: string
  location: string | null
  summary: string
  source_url: string
  purchase_url: string | null
  source_channel: ParsedCandidate['sourceChannel']
  source_published_at: string | null
  status: ParsedCandidate['status']
  external_id: string
}

export type EventWriter = {
  findExistingSourceUrls(sourceUrls: string[]): Promise<Set<string>>
  upsert(events: EventInsert[]): Promise<void>
}

function toEventInsert(candidate: ParsedCandidate): EventInsert {
  return {
    title: candidate.title,
    category: candidate.category,
    start_at: candidate.startAt,
    end_at: candidate.endAt,
    all_day: candidate.allDay,
    participants: candidate.participants,
    display_color: candidate.displayColor,
    location: candidate.location,
    summary: candidate.summary,
    source_url: candidate.sourceUrl,
    purchase_url: candidate.purchaseUrl,
    source_channel: candidate.sourceChannel,
    source_published_at: candidate.sourcePublishedAt,
    status: candidate.status,
    external_id: candidate.sourceUrl,
  }
}

export async function ingestCandidates(candidates: ParsedCandidate[], writer: EventWriter) {
  const events = [...new Map(candidates.map((candidate) => [candidate.sourceUrl, toEventInsert(candidate)])).values()]
  const existing = await writer.findExistingSourceUrls(events.map((event) => event.source_url))

  if (events.length > 0) {
    await writer.upsert(events)
  }

  return events.reduce((result, event) => ({
    created: result.created + (existing.has(event.source_url) ? 0 : 1),
    updated: result.updated + (existing.has(event.source_url) ? 1 : 0),
    review: result.review + (event.status === 'needs_review' ? 1 : 0),
  }), { created: 0, updated: 0, review: 0 })
}
