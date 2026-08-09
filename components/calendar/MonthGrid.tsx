import type { EventRecord } from '@/lib/domain'
import { getMonthGrid, toDateKey } from '@/lib/calendar'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface MonthGridProps {
  year: number
  monthIndex: number
  events: EventRecord[]
  onSelectEvent: (event: EventRecord) => void
}

function occursOn(event: EventRecord, dateKey: string) {
  const start = event.startAt.slice(0, 10)
  const end = event.endAt?.slice(0, 10) ?? start
  return start <= dateKey && dateKey <= end
}

export function MonthGrid({ year, monthIndex, events, onSelectEvent }: MonthGridProps) {
  const dates = getMonthGrid(year, monthIndex)

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label={`${year}년 ${monthIndex + 1}월 일정`}>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-sm font-semibold">
        {WEEKDAYS.map((weekday, index) => (
          <div className={index === 0 ? 'py-3 text-rose-500' : index === 6 ? 'py-3 text-blue-600' : 'py-3 text-slate-700'} key={weekday}>{weekday}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dates.map((date) => {
          const dateKey = toDateKey(date)
          const inCurrentMonth = date.getMonth() === monthIndex
          const dayEvents = events.filter((event) => occursOn(event, dateKey))
          const weekday = date.getDay()

          return (
            <div className="min-h-32 border-b border-r border-slate-200 p-2 last:border-r-0" key={dateKey}>
              <time className={weekday === 0 ? 'text-sm font-semibold text-rose-500' : weekday === 6 ? 'text-sm font-semibold text-blue-600' : inCurrentMonth ? 'text-sm font-semibold text-slate-700' : 'text-sm text-slate-300'} dateTime={dateKey}>{date.getDate()}</time>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    className="block w-full truncate rounded-md border px-2 py-1 text-left text-xs font-semibold"
                    key={`${event.id}-${dateKey}`}
                    onClick={() => onSelectEvent(event)}
                    style={{ backgroundColor: `${event.displayColor}20`, borderColor: `${event.displayColor}55`, color: event.displayColor }}
                    type="button"
                  >
                    {event.title}
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
