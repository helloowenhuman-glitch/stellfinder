import type { EventRecord } from '@/lib/domain'
import { getCalendarEventTitle, getKoreaDateKey, getMonthGrid, toDateKey } from '@/lib/calendar'
import { MEMBER_COLORS } from '@/lib/member-colors'
import type { MemberBirthday } from '@/lib/member-birthdays'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface MonthGridProps {
  year: number
  monthIndex: number
  events: EventRecord[]
  birthdays?: MemberBirthday[]
  onSelectEvent: (event: EventRecord) => void
  onSelectBirthday?: (birthday: MemberBirthday) => void
  onSelectDate?: (dateKey: string) => void
  todayKey?: string
}

interface WeekEventSegment {
  event: EventRecord
  startColumn: number
  span: number
  row: number
}

interface WeekBirthdaySegment {
  birthday: MemberBirthday
  column: number
}

interface VisibleWeekEventSegment extends WeekEventSegment {
  row: number
}

function getWeekEventSegments(events: EventRecord[], week: Date[]): WeekEventSegment[] {
  const weekStart = toDateKey(week[0])
  const weekEnd = toDateKey(week[week.length - 1])

  const segments = events.flatMap((event) => {
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

  const occupiedColumnsByRow: boolean[][] = []

  return segments.map((segment) => {
    const columns = Array.from({ length: segment.span }, (_, index) => segment.startColumn - 1 + index)
    let row = occupiedColumnsByRow.findIndex((occupied) => columns.every((column) => !occupied[column]))

    if (row === -1) {
      row = occupiedColumnsByRow.length
      occupiedColumnsByRow.push(Array(7).fill(false))
    }

    columns.forEach((column) => { occupiedColumnsByRow[row][column] = true })

    return { ...segment, row }
  })
}

function getWeekBirthdaySegments(birthdays: MemberBirthday[], week: Date[]): WeekBirthdaySegment[] {
  return birthdays.flatMap((birthday) => {
    const dayIndex = week.findIndex((date) => date.getMonth() + 1 === birthday.month && date.getDate() === birthday.day)

    return dayIndex === -1 ? [] : [{ birthday, column: dayIndex + 1 }]
  })
}

function getVisibleWeekEventSegments(segments: WeekEventSegment[]): VisibleWeekEventSegment[] {
  const visibleSegments: VisibleWeekEventSegment[] = []

  segments.forEach((segment) => {
    let visiblePart: VisibleWeekEventSegment | undefined

    for (let column = segment.startColumn; column < segment.startColumn + segment.span; column += 1) {
      const eventsOnDate = segments.filter((candidate) => (
        column >= candidate.startColumn
        && column < candidate.startColumn + candidate.span
      ))
      const row = eventsOnDate.findIndex((candidate) => candidate.event.id === segment.event.id)

      if (row < 3) {
        if (visiblePart && visiblePart.row === row && visiblePart.startColumn + visiblePart.span === column) {
          visiblePart.span += 1
        } else {
          visiblePart = { ...segment, startColumn: column, span: 1, row }
          visibleSegments.push(visiblePart)
        }
      } else {
        visiblePart = undefined
      }
    }
  })

  return visibleSegments
}

export function MonthGrid({ year, monthIndex, events, birthdays = [], onSelectEvent, onSelectBirthday, onSelectDate, todayKey = getKoreaDateKey() }: MonthGridProps) {
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
          const birthdaySegments = getWeekBirthdaySegments(birthdays, week)
          const visibleSegments = getVisibleWeekEventSegments(segments)
          const visibleEventRows = visibleSegments.length === 0 ? 0 : Math.max(...visibleSegments.map((segment) => segment.row + 1))
          const eventCountByDate = new Map(week.map((date, column) => [
            toDateKey(date),
            segments.filter((segment) => (
              column + 1 >= segment.startColumn
              && column + 1 < segment.startColumn + segment.span
            )).length,
          ]))
          const hiddenCountByDate = new Map(week.map((date, column) => [
            toDateKey(date),
            Math.max(0, (eventCountByDate.get(toDateKey(date)) ?? 0) - 3)
              + (birthdaySegments.some(({ column: birthdayColumn }) => birthdayColumn === column + 1) && (eventCountByDate.get(toDateKey(date)) ?? 0) >= 3 ? 1 : 0),
          ]))

          return (
            <div className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0" key={toDateKey(week[0])}>
              {week.map((date) => {
                const dateKey = toDateKey(date)
                const inCurrentMonth = date.getMonth() === monthIndex
                const weekday = date.getDay()
                const dateClassName = dateKey === todayKey
                  ? 'inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-[#102B52] px-1 text-sm font-semibold text-white'
                  : weekday === 0
                    ? 'text-sm font-semibold text-rose-500'
                    : weekday === 6
                      ? 'text-sm font-semibold text-blue-600'
                      : inCurrentMonth
                        ? 'text-sm font-semibold text-slate-700'
                        : 'text-sm text-slate-300'

                return (
                  <button aria-label={`${dateKey} 일정 열기`} className="flex min-h-32 items-start border-r border-slate-200 p-2 text-left last:border-r-0" key={dateKey} onClick={() => onSelectDate?.(dateKey)} type="button">
                    <time className={dateClassName} dateTime={dateKey}>{date.getDate()}</time>
                  </button>
                )
              })}
              <div className="pointer-events-none absolute inset-x-2 top-9 grid grid-cols-7 auto-rows-min gap-y-1">
                {visibleSegments.map((segment) => (
                  <button
                    className="pointer-events-auto w-full truncate rounded-md border px-2 py-1 text-center text-xs font-semibold"
                    key={`${segment.event.id}-${toDateKey(week[0])}-${segment.startColumn}-${segment.span}`}
                    onClick={() => onSelectEvent(segment.event)}
                    style={{ backgroundColor: `${segment.event.displayColor}20`, borderColor: `${segment.event.displayColor}55`, color: segment.event.displayColor, gridColumn: `${segment.startColumn} / span ${segment.span}`, gridRow: segment.row + 1 }}
                    type="button"
                  >
                    {getCalendarEventTitle(segment.event, todayKey)}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid grid-cols-7">
                {week.map((date, column) => {
                  const dateKey = toDateKey(date)
                  const hiddenCount = hiddenCountByDate.get(dateKey) ?? 0

                  return hiddenCount > 0 ? (
                    <div className="relative h-10" key={`${dateKey}-overflow`} style={{ gridColumn: column + 1 }}>
                      <span aria-label={`${dateKey} hidden events ${hiddenCount}`} className="absolute bottom-2 right-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[#CBD5E1] bg-[#E2E8F0] px-2 text-xs font-bold text-[#475569]">+{hiddenCount}</span>
                    </div>
                  ) : null
                })}
              </div>
              <div className="pointer-events-none absolute inset-x-2 grid grid-cols-7 auto-rows-min gap-y-1" style={{ top: `${2.25 + visibleEventRows * 1.75}rem` }}>
                {birthdaySegments.filter(({ column }) => (eventCountByDate.get(toDateKey(week[column - 1])) ?? 0) < 3).map(({ birthday, column }) => {
                  const color = MEMBER_COLORS[birthday.member]

                  return (
                    <button
                      aria-label={`${birthday.member} 생일`}
                      className="pointer-events-auto w-full truncate rounded-full border px-2 py-1 text-left text-xs font-semibold"
                      key={birthday.member}
                      onClick={() => onSelectBirthday?.(birthday)}
                      style={{ backgroundColor: `${color}15`, borderColor: `${color}55`, color, gridColumn: column }}
                      type="button"
                    >
                      {birthday.member} 생일
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
