import 'server-only'

import type { EventInsert, EventWriter } from '@/lib/ingestion/ingest'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export function createSupabaseEventWriter(): EventWriter {
  const supabase = createAdminSupabaseClient()

  return {
    async findExistingSourceUrls(sourceUrls) {
      if (sourceUrls.length === 0) {
        return new Set()
      }

      const { data, error } = await supabase
        .from('events')
        .select('source_url')
        .in('source_url', sourceUrls)

      if (error) {
        throw new Error(`Unable to check existing events: ${error.message}`)
      }

      return new Set(data.map((event) => event.source_url))
    },
    async upsert(events: EventInsert[]) {
      const { error } = await supabase
        .from('events')
        .upsert(events, { onConflict: 'source_url' })

      if (error) {
        throw new Error(`Unable to save events: ${error.message}`)
      }
    },
  }
}
