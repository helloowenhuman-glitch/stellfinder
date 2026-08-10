import type { EventRecord } from '@/lib/domain'
import { getCalendarEventTitle, getKoreaDateKey, getMonthGrid, toDateKey } from '@/lib/calendar'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface MonthGridProps {
  year: number
  monthIndex: number
  events: EventRecord[]
  onSelectEvent: (event: EventRecord) => void
  onSelectDate?: (dateKey: string) => void
  todayKey?: string
}

interface WeekEventSegment {
  event: EventRecord
  startColumn: number
  span: number
}

function getWeekEventSegments(events: EventRecord[], week: Date[]): WeekEventSegment[] {
  const weekStart = toDateKey(week[0])
  const weekEnd = toDateKey(week[week.length - 1])

  return events.flatMap((event) => {
    const start = event.startAt.slice(0, 10)
    const end = event.endAt?.slice(0, 10) ?? start

    if (start > weekEnd || end < weekStart) {
      return []
    }

    const segmentStart = start < weekStart ? weekStart : start
    const segmentEnd = end > weekEnd ? weekEnd : end
    const startIndex = week.findIndex((date) => toDateKey(date) === segmentStart)
    const endIndex = week.findIndex((date) => toDateKey(date) === segmentEnd)

    return [{
      event,
      startColumn: startIndex + 1,
      span: endIndex - startIndex + 1,
    }]
  })
}

export function MonthGrid({ year, monthIndex, events, onSelectEvent, onSelectDate, todayKey = getKoreaDateKey() }: MonthGridProps) {
  const dates = getMonthGrid(year, monthIndex)
  const weeks = Array.from({ length: dates.length / 7 }, (_, index) => dates.slice(index * 7, index * 7 + 7))

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label={`${year}년 ${monthIndex + 1}월 일정`}>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-sm font-semibold">
        {WEEKDAYS.map((weekday, index) => (
          <div className={index === 0 ? 'py-3 text-rose-500' : index === 6 ? 'py-3 text-blue-600' : 'py-3 text-slate-700'} key={weekday}>{weekday}</div>
        ))}
      </div>
      <div>
        {weeks.map((week) => {
          const segments = getWeekEventSegments(events, week)

          return (
            <div className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0" key={toDateKey(week[0])}>
              {week.map((date) => {
                const dateKey = toDateKey(date)
                const inCurrentMonth = date.getMonth() === monthIndex
                const weekday = date.getDay()

                return (
                  <button aria-label={`${dateKey} 일정 열기`} className="min-h-32 border-r border-slate-200 p-2 text-left last:border-r-0" key={dateKey} onClick={() => onSelectDate?.(dateKey)} type="button">
                    <time className={weekday === 0 ? 'text-sm font-semibold text-rose-500' : weekday === 6 ? 'text-sm font-semibold text-blue-600' : inCurrentMonth ? 'text-sm font-semibold text-slate-700' : 'text-sm text-slate-300'} dateTime={dateKey}>{date.getDate()}</time>
                  </button>
                )
              })}
              <div className="pointer-events-none absolute inset-x-2 top-9 grid grid-cols-7 auto-rows-min gap-y-1">
                {segments.map((segment) => (
                  <button
                    className="pointer-events-auto w-full truncate rounded-md border px-2 py-1 text-center text-xs font-semibold"
                    key={`${segment.event.id}-${toDateKey(week[0])}`}
                    onClick={() => onSelectEvent(segment.event)}
                    style={{ backgroundColor: `${segment.event.displayColor}20`, borderColor: `${segment.event.displayColor}55`, color: segment.event.displayColor, gridColumn: `${segment.startColumn} / span ${segment.span}` }}
                    type="button"
                  >
                    {getCalendarEventTitle(segment.event, todayKey)}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
