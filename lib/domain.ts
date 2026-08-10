import type { Participant } from '@/lib/member-colors'

export const EVENT_CATEGORIES = ['performance', 'goods', 'collaboration', 'offline'] as const
export const EVENT_STATUSES = ['verified', 'needs_review'] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]
export type EventStatus = (typeof EVENT_STATUSES)[number]

export interface EventRecord {
  id: string
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
  purchaseUrl?: string | null
  sourceChannel: 'official-site' | 'official-x'
  sourcePublishedAt: string | null
  status: EventStatus
}
