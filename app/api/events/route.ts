import { listVerifiedEventsForMonth } from '@/lib/events'

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get('month')

  if (!month || !MONTH_PATTERN.test(month)) {
    return Response.json({ error: 'month must use YYYY-MM format' }, { status: 400 })
  }

  try {
    return Response.json({ events: await listVerifiedEventsForMonth(month) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load events'
    return Response.json({ error: message }, { status: 500 })
  }
}
