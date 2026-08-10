import { z } from 'zod'
import { EVENT_CATEGORIES, type EventCategory, type EventStatus } from '@/lib/domain'
import { getDisplayColor, MEMBER_COLORS, type Participant } from '@/lib/member-colors'

const participantNames = Object.keys(MEMBER_COLORS) as [Participant, ...Participant[]]

const rawCandidateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.enum(EVENT_CATEGORIES),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  allDay: z.boolean().optional().default(true),
  participants: z.array(z.enum(participantNames)).min(1),
  location: z.string().trim().max(300).nullable().optional().default(null),
  summary: z.string().trim().max(1200).optional().default(''),
  sourceUrl: z.string().url(),
  purchaseUrl: z.string().url().refine((url) => new URL(url).protocol === 'https:', {
    message: 'purchaseUrl must use HTTPS',
  }).nullable().optional().default(null),
  sourceChannel: z.enum(['official-site', 'official-x']),
  sourcePublishedAt: z.string().datetime({ offset: true }).nullable().optional().default(null),
  confidence: z.number().min(0).max(1),
}).superRefine((candidate, context) => {
  const source = new URL(candidate.sourceUrl)
  const isOfficialSite = source.hostname === 'stellive.me' || source.hostname.endsWith('.stellive.me')
  const isX = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(source.hostname)

  if ((candidate.sourceChannel === 'official-site' && !isOfficialSite)
    || (candidate.sourceChannel === 'official-x' && !isX)) {
    context.addIssue({
      code: 'custom',
      path: ['sourceUrl'],
      message: 'sourceUrl must match the selected official source channel',
    })
  }

  if (candidate.endAt && new Date(candidate.endAt) < new Date(candidate.startAt)) {
    context.addIssue({
      code: 'custom',
      path: ['endAt'],
      message: 'endAt must not be earlier than startAt',
    })
  }
})

export type ParsedCandidate = {
  title: string
  category: EventCategory
  startAt: string
  endAt: string | null
  allDay: boolean
  participants: Participant[]
  displayColor: string
  location: string | null
  summary: string
  sourceUrl: string
  purchaseUrl: string | null
  sourceChannel: 'official-site' | 'official-x'
  sourcePublishedAt: string | null
  status: EventStatus
}

export function parseCandidate(input: unknown): ParsedCandidate {
  const candidate = rawCandidateSchema.parse(input)

  return {
    ...candidate,
    endAt: candidate.endAt ?? null,
    displayColor: getDisplayColor(candidate.participants),
    status: candidate.confidence >= 0.9 ? 'verified' : 'needs_review',
  }
}

export function parseInboundPayload(input: unknown): ParsedCandidate[] {
  const payload = z.object({ events: z.array(z.unknown()).max(50) }).parse(input)
  return payload.events.map(parseCandidate)
}
