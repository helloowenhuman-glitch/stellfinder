import type { EventRecord } from '@/lib/domain'
import type { Participant } from '@/lib/member-colors'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type EventRow = {
  id: string
  title: string
  category: EventRecord['category']
  start_at: string
  end_at: string | null
  all_day: boolean
  participants: Participant[]
  display_color: string
  location: string | null
  summary: string
  source_url: string
  purchase_url: string | null
  source_channel: EventRecord['sourceChannel']
  source_published_at: string | null
  status: EventRecord['status']
}

export function mapEventRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    participants: row.participants,
    displayColor: row.display_color,
    location: row.location,
    summary: row.summary,
    sourceUrl: row.source_url,
    purchaseUrl: row.purchase_url,
    sourceChannel: row.source_channel,
    sourcePublishedAt: row.source_published_at,
    status: row.status,
  }
}

export async function listVerifiedEventsForMonth(month: string): Promise<EventRecord[]> {
  const [year, monthNumber] = month.split('-').map(Number)
  const start = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString()
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1)).toISOString()
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select('id,title,category,start_at,end_at,all_day,participants,display_color,location,summary,source_url,purchase_url,source_channel,source_published_at,status')
    .eq('status', 'verified')
    .lt('start_at', nextMonth)
    .or(`end_at.is.null,end_at.gte.${start}`)
    .order('start_at', { ascending: true })

  if (error) {
    throw new Error(`Unable to load events: ${error.message}`)
  }

  return (data as EventRow[]).map(mapEventRow)
}
