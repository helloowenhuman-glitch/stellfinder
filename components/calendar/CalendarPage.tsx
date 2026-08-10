'use client'

import { useEffect, useMemo, useState } from 'react'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import type { EventCategory, EventRecord } from '@/lib/domain'
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

export function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 7, 1))
  const [category, setCategory] = useState<'all' | EventCategory>('all')
  const [member, setMember] = useState<'all' | Participant>('all')
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null)
  const [events, setEvents] = useState<EventRecord[]>(SAMPLE_EVENTS)
  const filteredEvents = useMemo(() => events.filter((event) => (
    (category === 'all' || event.category === category)
    && (member === 'all' || event.participants.includes(member))
  )), [category, events, member])

  useEffect(() => {
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    fetch(`/api/events?month=${monthKey}`)
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load events')))
      .then((payload: { events: EventRecord[] }) => setEvents(payload.events))
      .catch(() => setEvents(SAMPLE_EVENTS))
  }, [month])

  const changeMonth = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
          <p className="text-2xl font-black tracking-[0.12em]">STELLFINDER</p>
          <div className="flex items-center justify-center gap-5 text-2xl font-bold"><button aria-label="이전 달" onClick={() => changeMonth(-1)} type="button">‹</button><h1>{month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, '0')}</h1><button aria-label="다음 달" onClick={() => changeMonth(1)} type="button">›</button></div>
          <div aria-hidden="true" />
        </header>
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
              <div className="absolute left-0 z-10 mt-2 max-h-80 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setMember('all'); setIsMemberMenuOpen(false) }} type="button">전체</button>
                {MEMBERS.map((memberName) => (
                  <button className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50" key={memberName} onClick={() => { setMember(memberName); setIsMemberMenuOpen(false) }} type="button">{memberName}</button>
                ))}
              </div>
            )}
          </div>
        </nav>
        <MonthGrid year={month.getFullYear()} monthIndex={month.getMonth()} events={filteredEvents} onSelectEvent={setSelectedEvent} />
        {selectedEvent && <div className="fixed inset-0 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><button className="float-right text-slate-500" onClick={() => setSelectedEvent(null)} type="button" aria-label="닫기">×</button><p className="text-sm font-semibold" style={{ color: selectedEvent.displayColor }}>{CATEGORY_LABELS[selectedEvent.category]}</p><h2 className="mt-2 text-xl font-bold">{selectedEvent.title}</h2><p className="mt-3 text-sm text-slate-600">{selectedEvent.summary}</p><a className="mt-5 inline-block text-sm font-semibold text-[#6847B3] underline" href={selectedEvent.sourceUrl} rel="noreferrer" target="_blank">공식 공지 보기</a></section></div>}
      </div>
    </main>
  )
}
