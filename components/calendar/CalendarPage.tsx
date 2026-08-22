'use client'

import { useEffect, useMemo, useState } from 'react'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { getCalendarEventTitle, getDdayLabel, getKoreaDateKey, isUpcomingWithinFifteenDays } from '@/lib/calendar'
import type { EventCategory, EventRecord } from '@/lib/domain'
import { MEMBER_BIRTHDAYS, type MemberBirthday } from '@/lib/member-birthdays'
import { MEMBER_COLORS, type Participant } from '@/lib/member-colors'

const CATEGORY_LABELS: Record<'all' | EventCategory, string> = {
  all: '전체', performance: '공연', goods: '굿즈', collaboration: '콜라보', offline: '오프라인',
}

const MEMBERS = Object.keys(MEMBER_COLORS).filter((member) => member !== '스텔라이브 단체') as Participant[]

const SAMPLE_EVENTS: EventRecord[] = [
  { id: 'kangji', title: '강지 팬미팅', category: 'performance', startAt: '2026-08-08T00:00:00+09:00', endAt: null, allDay: true, participants: ['강지'], displayColor: '#8282B7', location: null, summary: '개발용 예시 일정입니다.', sourceUrl: 'https://stellive.me/news/example-kangji', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified' },
  { id: 'hina', title: '히나 생일 이벤트', category: 'goods', startAt: '2026-08-12T00:00:00+09:00', endAt: null, allDay: true, participants: ['시라유키 히나'], displayColor: '#FF4A60', location: null, summary: '개발용 예시 일정입니다.', sourceUrl: 'https://stellive.me/news/example-hina', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified' },
  { id: 'popup', title: 'STELLIVE 팝업스토어', category: 'offline', startAt: '2026-08-14T00:00:00+09:00', endAt: '2026-08-16T23:59:59+09:00', allDay: true, participants: ['스텔라이브 단체'], displayColor: '#8C6CFF', location: '서울', summary: '개발용 예시 기간 일정입니다.', sourceUrl: 'https://stellive.me/news/example-popup', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified' },
  { id: 'tabi', title: '타비 오프라인 사인회', category: 'offline', startAt: '2026-08-18T00:00:00+09:00', endAt: null, allDay: true, participants: ['아라하시 타비'], displayColor: '#64BCFF', location: null, summary: '개발용 예시 일정입니다.', sourceUrl: 'https://stellive.me/news/example-tabi', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified' },
  { id: 'mashiro', title: '마시로 굿즈 예약 오픈', category: 'goods', startAt: '2026-08-19T00:00:00+09:00', endAt: null, allDay: true, participants: ['네네코 마시로'], displayColor: '#B3B3B3', location: null, summary: '개발용 예시 일정입니다.', sourceUrl: 'https://stellive.me/news/example-mashiro', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified' },
]

type CalendarView = 'calendar' | 'upcoming'

const FIRST_CALENDAR_MONTH = new Date(2026, 7, 1)

type CalendarPageProps = {
  todayKey?: string
}

function getInitialCalendarMonth(todayKey?: string) {
  if (!todayKey) {
    return FIRST_CALENDAR_MONTH
  }

  const [year, month] = todayKey.slice(0, 7).split('-').map(Number)
  const currentMonth = new Date(year, month - 1, 1)

  return currentMonth < FIRST_CALENDAR_MONTH ? FIRST_CALENDAR_MONTH : currentMonth
}

function occursOn(event: EventRecord, dateKey: string) {
  const start = event.startAt.slice(0, 10)
  const end = event.endAt?.slice(0, 10) ?? start

  return start <= dateKey && dateKey <= end
}

function upcomingDateKey(event: EventRecord) {
  return (event.category === 'goods' && event.endAt ? event.endAt : event.startAt).slice(0, 10)
}

function formatPeriod(event: EventRecord) {
  const end = event.endAt ? ` ~ ${event.endAt.slice(0, 16).replace('T', ' ')}` : ''

  return `${event.startAt.slice(0, 16).replace('T', ' ')}${end}`
}

function EventButton({ event, onSelect, todayKey }: { event: EventRecord; onSelect: (event: EventRecord) => void; todayKey: string }) {
  return (
    <button
      className="w-full truncate rounded-md border px-3 py-2 text-center text-sm font-semibold"
      onClick={() => onSelect(event)}
      style={{ backgroundColor: `${event.displayColor}20`, borderColor: `${event.displayColor}55`, color: event.displayColor }}
      type="button"
    >
      {getCalendarEventTitle(event, todayKey)}
    </button>
  )
}

function EventDetailDialog({ event, onClose, todayKey }: { event: EventRecord; onClose: () => void; todayKey: string }) {
  const dday = getDdayLabel(event, todayKey)
  const sourceLabel = event.sourceChannel === 'official-x' ? '공식 X 보기' : '공식 공지 보기'

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={`${event.title} 상세`}>
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button className="float-right text-slate-500" onClick={onClose} type="button" aria-label="닫기">×</button>
        <p className="text-sm font-semibold" style={{ color: event.displayColor }}>{CATEGORY_LABELS[event.category]}{dday ? ` · ${dday}` : ''}</p>
        <h2 className="mt-2 text-xl font-bold">{event.title}</h2>
        <p className="mt-3 text-sm text-slate-600">{formatPeriod(event)}</p>
        <p className="mt-2 text-sm text-slate-600">참여 멤버: {event.participants.join(', ')}</p>
        {event.location && <p className="mt-2 text-sm text-slate-600">장소: {event.location}</p>}
        {event.summary && <p className="mt-3 text-sm text-slate-600">{event.summary}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {event.purchaseUrl && <a className="rounded-lg bg-[#6847B3] px-4 py-2 text-sm font-semibold text-white" href={event.purchaseUrl} rel="noreferrer" target="_blank">구매하기</a>}
          <a className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#6847B3]" href={event.sourceUrl} rel="noreferrer" target="_blank">{sourceLabel}</a>
        </div>
      </section>
    </div>
  )
}

function BirthdayDetailDialog({ birthday, onClose }: { birthday: MemberBirthday; onClose: () => void }) {
  const color = MEMBER_COLORS[birthday.member]
  const namuWikiUrl = `https://namu.wiki/w/${encodeURIComponent(birthday.member)}`

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={`${birthday.member} 생일 상세`}>
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button aria-label="닫기" className="float-right text-slate-500" onClick={onClose} type="button">×</button>
        <p className="text-sm font-semibold" style={{ color }}>생일</p>
        <h2 className="mt-2 text-xl font-bold">{birthday.member}의 생일입니다.</h2>
        <p className="mt-3 text-sm text-slate-600">{birthday.month}월 {birthday.day}일</p>
        <a className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold" href={namuWikiUrl} rel="noreferrer" style={{ color }} target="_blank">나무위키에서 보기</a>
      </section>
    </div>
  )
}

export function CalendarPage({ todayKey }: CalendarPageProps) {
  const initialCalendarMonth = getInitialCalendarMonth(todayKey)
  const [resolvedTodayKey, setResolvedTodayKey] = useState(todayKey ?? '')
  const [month, setMonth] = useState(initialCalendarMonth)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isMonthListOpen, setIsMonthListOpen] = useState(false)
  const [draftYear, setDraftYear] = useState(initialCalendarMonth.getFullYear())
  const [draftMonth, setDraftMonth] = useState(initialCalendarMonth.getMonth() + 1)
  const [view, setView] = useState<CalendarView>('calendar')
  const [category, setCategory] = useState<'all' | EventCategory>('all')
  const [member, setMember] = useState<'all' | Participant>('all')
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null)
  const [selectedBirthday, setSelectedBirthday] = useState<MemberBirthday | null>(null)
  const [events, setEvents] = useState<EventRecord[]>(SAMPLE_EVENTS)

  useEffect(() => {
    if (todayKey) {
      setResolvedTodayKey(todayKey)
      return
    }

    const currentKoreaDateKey = getKoreaDateKey()

    setResolvedTodayKey(currentKoreaDateKey)
    setMonth(getInitialCalendarMonth(currentKoreaDateKey))
  }, [todayKey])

  const filteredEvents = useMemo(() => events.filter((event) => (
    (category === 'all' || event.category === category)
    && (member === 'all' || event.participants.includes(member))
  )), [category, events, member])
  const visibleBirthdays = useMemo(() => MEMBER_BIRTHDAYS.filter((birthday) => (
    member === 'all' || birthday.member === member
  )), [member])
  const upcomingEvents = useMemo(() => filteredEvents
    .filter((event) => isUpcomingWithinFifteenDays(event, resolvedTodayKey))
    .sort((left, right) => upcomingDateKey(left).localeCompare(upcomingDateKey(right))), [filteredEvents, resolvedTodayKey])
  const selectedDateEvents = selectedDate ? filteredEvents.filter((event) => occursOn(event, selectedDate)) : []
  const selectedDateBirthdays = selectedDate ? visibleBirthdays.filter((birthday) => (
    `${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}` === selectedDate.slice(5)
  )) : []

  useEffect(() => {
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    fetch(`/api/events?month=${monthKey}`)
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load events')))
      .then((payload: { events: EventRecord[] }) => setEvents(payload.events))
      .catch(() => setEvents(SAMPLE_EVENTS))
  }, [month])

  const isFirstCalendarMonth = month.getFullYear() === FIRST_CALENDAR_MONTH.getFullYear()
    && month.getMonth() === FIRST_CALENDAR_MONTH.getMonth()
  const changeMonth = (offset: number) => setMonth((current) => {
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1)

    return next < FIRST_CALENDAR_MONTH ? current : next
  })
  const openMonthPicker = () => {
    setDraftYear(month.getFullYear())
    setDraftMonth(month.getMonth() + 1)
    setIsMonthListOpen(false)
    setIsMonthPickerOpen(true)
  }
  const selectDraftYear = (value: number) => {
    setDraftYear(value)
    if (value === FIRST_CALENDAR_MONTH.getFullYear() && draftMonth < FIRST_CALENDAR_MONTH.getMonth() + 1) {
      setDraftMonth(FIRST_CALENDAR_MONTH.getMonth() + 1)
    }
  }
  const applyMonthPicker = () => {
    const selected = new Date(draftYear, draftMonth - 1, 1)

    setMonth(selected < FIRST_CALENDAR_MONTH ? FIRST_CALENDAR_MONTH : selected)
    setIsMonthListOpen(false)
    setIsMonthPickerOpen(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-y-3 md:gap-5">
          <p className="col-span-3 text-2xl font-black tracking-[0.12em] md:col-span-1">STELLFINDER</p>
          <div className="col-start-2 flex items-center justify-center gap-5 text-2xl font-bold md:col-start-auto"><button aria-label="이전 달" className="disabled:cursor-not-allowed disabled:opacity-30" disabled={isFirstCalendarMonth} onClick={() => changeMonth(-1)} type="button">‹</button><h1><button aria-label="월 선택 열기" className="rounded-md px-2 py-1 hover:bg-slate-100" onClick={openMonthPicker} type="button">{month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, '0')}</button></h1><button aria-label="다음 달" onClick={() => changeMonth(1)} type="button">›</button></div>
          <div aria-hidden="true" className="hidden md:block" />
        </header>
        <nav className="mb-4 flex flex-wrap justify-center gap-2" aria-label="보기 전환">
          <button className={view === 'calendar' ? 'rounded-lg bg-[#8C6CFF] px-5 py-2 text-sm font-semibold text-white' : 'rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600'} onClick={() => setView('calendar')} type="button">캘린더 보기</button>
          <button className={view === 'upcoming' ? 'rounded-lg bg-[#8C6CFF] px-5 py-2 text-sm font-semibold text-white' : 'rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600'} onClick={() => setView('upcoming')} type="button">다가오는 일정 보기</button>
        </nav>
        <nav className="mb-4 flex flex-wrap gap-2" aria-label="행사 유형 필터">
          {(Object.keys(CATEGORY_LABELS) as ('all' | EventCategory)[]).map((key) => <button className={category === key ? 'rounded-lg bg-[#8C6CFF] px-5 py-2 text-sm font-semibold text-white' : 'rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600'} key={key} onClick={() => setCategory(key)} type="button">{CATEGORY_LABELS[key]}</button>)}
          <div className="relative">
            <button
              aria-expanded={isMemberMenuOpen}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600"
              onClick={() => setIsMemberMenuOpen((open) => !open)}
              type="button"
            >
              멤버: {member === 'all' ? '전체' : member}
            </button>
            {isMemberMenuOpen && (
              <div className="absolute left-0 z-20 mt-2 max-h-80 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setMember('all'); setIsMemberMenuOpen(false) }} type="button">전체</button>
                {MEMBERS.map((memberName) => (
                  <button className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" key={memberName} onClick={() => { setMember(memberName); setIsMemberMenuOpen(false) }} type="button">{memberName}</button>
                ))}
              </div>
            )}
          </div>
        </nav>
        {view === 'calendar' ? (
          <MonthGrid birthdays={visibleBirthdays} year={month.getFullYear()} monthIndex={month.getMonth()} events={filteredEvents} onSelectBirthday={setSelectedBirthday} onSelectDate={setSelectedDate} onSelectEvent={setSelectedEvent} todayKey={resolvedTodayKey} />
        ) : (
          <section aria-label="다가오는 일정" className="rounded-xl border border-slate-200 bg-white p-4">
            {upcomingEvents.length === 0 ? <p className="text-sm text-slate-500">앞으로 15일 안에 챙길 일정이 없습니다.</p> : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id}>
                    <p className="mb-2 text-sm font-semibold text-slate-600">{upcomingDateKey(event).replaceAll('-', '.')}</p>
                    <EventButton event={event} onSelect={setSelectedEvent} todayKey={resolvedTodayKey} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {isMonthPickerOpen && (
          <div className="fixed inset-0 z-40 flex items-end bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label="월 선택">
            <section className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-center text-xl font-bold">{draftYear}년 {draftMonth}월 선택</h2>
              <div className="mt-6 grid grid-cols-[10rem_minmax(0,1fr)] gap-4">
                <label className="grid gap-2 text-sm font-semibold text-slate-600">연도
                  <input aria-label="연도 선택" className="w-40 rounded-xl border border-slate-200 px-3 py-3 text-lg font-bold text-slate-900" min={FIRST_CALENDAR_MONTH.getFullYear()} onChange={(event) => selectDraftYear(Number(event.target.value))} type="number" value={draftYear} />
                </label>
                <label className="relative grid gap-2 text-sm font-semibold text-slate-600">월
                  <button aria-expanded={isMonthListOpen} aria-label="월 목록 열기" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-lg font-bold text-slate-900" onClick={() => setIsMonthListOpen((open) => !open)} type="button">{draftMonth}월</button>
                  {isMonthListOpen && (
                    <div aria-label="월 선택지" className="absolute bottom-full z-10 mb-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl" role="listbox">
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => {
                        const isUnavailable = draftYear === FIRST_CALENDAR_MONTH.getFullYear() && value < FIRST_CALENDAR_MONTH.getMonth() + 1

                        return <button aria-selected={draftMonth === value} className={draftMonth === value ? 'w-full rounded-lg bg-[#8C6CFF] px-3 py-2 text-left font-semibold text-white' : 'w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300'} disabled={isUnavailable} key={value} onClick={() => { setDraftMonth(value); setIsMonthListOpen(false) }} role="option" type="button">{value}월</button>
                      })}
                    </div>
                  )}
                </label>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-600" onClick={() => setIsMonthPickerOpen(false)} type="button">취소</button>
                <button className="rounded-lg bg-[#8C6CFF] px-4 py-3 font-semibold text-white" onClick={applyMonthPicker} type="button">완료</button>
              </div>
            </section>
          </div>
        )}
        {selectedDate && <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={`${selectedDate} 일정`}><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><button className="float-right text-slate-500" onClick={() => setSelectedDate(null)} type="button" aria-label="닫기">×</button><h2 className="mb-4 text-xl font-bold">{selectedDate.replaceAll('-', '.')} 일정</h2>{selectedDateEvents.length === 0 && selectedDateBirthdays.length === 0 ? <p className="text-sm text-slate-500">등록된 행사가 없습니다.</p> : <div className="space-y-2">{selectedDateEvents.map((event) => <EventButton event={event} key={event.id} onSelect={(selected) => { setSelectedDate(null); setSelectedEvent(selected) }} todayKey={resolvedTodayKey} />)}{selectedDateBirthdays.map((birthday) => { const color = MEMBER_COLORS[birthday.member]; return <button aria-label={`${birthday.member} 생일`} className="w-full truncate rounded-full border px-3 py-2 text-left text-sm font-semibold" key={birthday.member} onClick={() => { setSelectedDate(null); setSelectedBirthday(birthday) }} style={{ backgroundColor: `${color}15`, borderColor: `${color}55`, color }} type="button">{birthday.member} 생일</button> })}</div>}</section></div>}
        {selectedEvent && <EventDetailDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} todayKey={resolvedTodayKey} />}
        {selectedBirthday && <BirthdayDetailDialog birthday={selectedBirthday} onClose={() => setSelectedBirthday(null)} />}
      </div>
    </main>
  )
}
