// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { CalendarPage } from '@/components/calendar/CalendarPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('centers the calendar and upcoming view switch below the month heading', () => {
  render(<CalendarPage />)

  expect(screen.getByRole('navigation', { name: '보기 전환' })).toHaveClass('justify-center')
})

test('selects a future month from the month picker', () => {
  render(<CalendarPage />)

  fireEvent.click(screen.getByRole('button', { name: '월 선택 열기' }))
  fireEvent.change(screen.getByRole('spinbutton', { name: '연도 선택' }), { target: { value: '2027' } })
  fireEvent.click(screen.getByRole('button', { name: '월 목록 열기' }))
  fireEvent.click(screen.getByRole('option', { name: '2월' }))
  fireEvent.click(screen.getByRole('button', { name: '완료' }))

  expect(screen.getByRole('button', { name: '월 선택 열기' })).toHaveTextContent('2027.02')
})

test('starts the calendar at August 2026 and does not allow earlier months', () => {
  render(<CalendarPage />)

  expect(screen.getByRole('button', { name: '이전 달' })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: '월 선택 열기' }))
  fireEvent.click(screen.getByRole('button', { name: '월 목록 열기' }))

  expect(screen.getByRole('option', { name: '1월' })).toBeDisabled()
  expect(screen.getByRole('option', { name: '8월' })).not.toBeDisabled()
})

test('uses a compact year field and a rounded month option list', () => {
  render(<CalendarPage />)

  fireEvent.click(screen.getByRole('button', { name: '월 선택 열기' }))

  expect(screen.getByRole('spinbutton', { name: '연도 선택' })).toHaveClass('w-40')

  fireEvent.click(screen.getByRole('button', { name: '월 목록 열기' }))

  expect(screen.getByRole('listbox', { name: '월 선택지' })).toHaveClass('rounded-xl')
})

test('shows the month picker opener without a trailing arrow glyph', () => {
  render(<CalendarPage />)

  fireEvent.click(screen.getByRole('button', { name: '월 선택 열기' }))

  expect(screen.getByRole('button', { name: '월 목록 열기' })).not.toHaveTextContent('⌄')
})

test('loads events from the public events API', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [{
      id: 'real-1', title: '실제 히나 일정', category: 'goods',
      startAt: '2026-08-12T00:00:00+09:00', endAt: null, allDay: true,
      participants: ['시라유키 히나'], displayColor: '#FF4A60', location: null,
      summary: '실제 데이터', sourceUrl: 'https://stellive.me/news/real-1',
      sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
    }] }),
  }))

  render(<CalendarPage />)

  expect(await screen.findByText('실제 히나 일정')).toBeVisible()
})

test('filters events by the member selected from the single member menu', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [
      {
        id: 'fuya-1', title: '후야 굿즈', category: 'goods',
        startAt: '2026-08-07T00:00:00+09:00', endAt: null, allDay: true,
        participants: ['사키하네 후야'], displayColor: '#6847B3', location: null,
        summary: '후야 행사', sourceUrl: 'https://stellive.me/news/fuya-1',
        sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
      },
      {
        id: 'nana-1', title: '나나 굿즈', category: 'goods',
        startAt: '2026-08-08T00:00:00+09:00', endAt: null, allDay: true,
        participants: ['하나코 나나'], displayColor: '#FF87CE', location: null,
        summary: '나나 행사', sourceUrl: 'https://stellive.me/news/nana-1',
        sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
      },
    ] }),
  }))

  render(<CalendarPage />)

  expect(await screen.findByText('후야 굿즈')).toBeVisible()
  expect(screen.queryByText('월간')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '멤버: 전체' }))
  fireEvent.click(screen.getByRole('button', { name: '사키하네 후야' }))

  expect(screen.getByRole('button', { name: '멤버: 사키하네 후야' })).toBeVisible()
  expect(screen.getByText('후야 굿즈')).toBeVisible()
  expect(screen.queryByText('나나 굿즈')).not.toBeInTheDocument()
})

test('shows only D-15 events in the upcoming view', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [
      {
        id: 'soon-sale', title: '마감 임박 굿즈', category: 'goods',
        startAt: '2026-08-07T00:00:00+09:00', endAt: '2026-08-22T23:59:59+09:00', allDay: true,
        participants: ['사키하네 후야'], displayColor: '#6847B3', location: null,
        summary: '마감 임박 행사', sourceUrl: 'https://stellive.me/news/soon-sale',
        purchaseUrl: 'https://shop.example.jp/soon-sale', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
      },
      {
        id: 'later-sale', title: '나중 굿즈', category: 'goods',
        startAt: '2026-08-07T00:00:00+09:00', endAt: '2026-09-07T23:59:59+09:00', allDay: true,
        participants: ['하나코 나나'], displayColor: '#FF87CE', location: null,
        summary: '아직 먼 행사', sourceUrl: 'https://stellive.me/news/later-sale',
        purchaseUrl: null, sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
      },
    ] }),
  }))

  render(<CalendarPage todayKey="2026-08-07" />)

  await screen.findAllByText('마감 임박 굿즈 D-15')
  fireEvent.click(screen.getByRole('button', { name: '다가오는 일정 보기' }))

  expect(screen.getByText('마감 임박 굿즈 D-15')).toBeVisible()
  expect(screen.queryByText('나중 굿즈 D-31')).not.toBeInTheDocument()
})

test('opens a date agenda before the event detail actions', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [{
      id: 'soon-sale', title: '마감 임박 굿즈', category: 'goods',
      startAt: '2026-08-07T00:00:00+09:00', endAt: '2026-08-22T23:59:59+09:00', allDay: true,
      participants: ['사키하네 후야'], displayColor: '#6847B3', location: null,
      summary: '마감 임박 행사', sourceUrl: 'https://stellive.me/news/soon-sale',
      purchaseUrl: 'https://shop.example.jp/soon-sale', sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
    }] }),
  }))

  render(<CalendarPage todayKey="2026-08-07" />)

  await screen.findAllByText('마감 임박 굿즈 D-15')
  fireEvent.click(screen.getByRole('button', { name: '2026-08-07 일정 열기' }))
  fireEvent.click(within(screen.getByRole('dialog', { name: '2026-08-07 일정' })).getByRole('button', { name: '마감 임박 굿즈 D-15' }))

  expect(screen.getByRole('link', { name: '구매하기' })).toHaveAttribute('href', 'https://shop.example.jp/soon-sale')
  expect(screen.getByRole('link', { name: '공식 공지 보기' })).toHaveAttribute('href', 'https://stellive.me/news/soon-sale')
})

test('keeps birthday badges visible across category filters and limits them to the chosen member', () => {
  render(<CalendarPage />)

  fireEvent.click(screen.getByRole('button', { name: '굿즈' }))
  expect(screen.getByRole('button', { name: '하나코 나나 생일' })).toBeVisible()

  fireEvent.click(screen.getByRole('button', { name: '멤버: 전체' }))
  fireEvent.click(screen.getByRole('button', { name: '하나코 나나' }))

  expect(screen.getByRole('button', { name: '하나코 나나 생일' })).toBeVisible()
})

test('opens the official profile from a birthday badge', () => {
  render(<CalendarPage />)

  fireEvent.click(screen.getByRole('button', { name: '하나코 나나 생일' }))

  expect(screen.getByRole('dialog', { name: '하나코 나나 생일 상세' })).toBeVisible()
  expect(screen.getByText('하나코 나나의 생일입니다.')).toBeVisible()
  expect(screen.getByRole('link', { name: '나무위키에서 보기' })).toHaveAttribute('href', 'https://namu.wiki/w/%ED%95%98%EB%82%98%EC%BD%94%20%EB%82%98%EB%82%98')
})

test('shows birthdays alongside events in a date agenda', () => {
  render(<CalendarPage />)

  fireEvent.click(screen.getByRole('button', { name: '2026-08-07 일정 열기' }))

  expect(within(screen.getByRole('dialog', { name: '2026-08-07 일정' })).getByRole('button', { name: '하나코 나나 생일' })).toBeVisible()
})

test('opens a date agenda instead of event detail when selecting a calendar bar', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ events: [{
      id: 'agenda-bar', title: '일정 바', category: 'goods',
      startAt: '2026-08-07T00:00:00+09:00', endAt: null, allDay: true,
      participants: ['사키하네 후야'], displayColor: '#6847B3', location: null,
      summary: null, sourceUrl: 'https://stellive.me/news/agenda-bar',
      sourceChannel: 'official-site', sourcePublishedAt: null, status: 'verified',
    }] }),
  }))

  render(<CalendarPage />)

  fireEvent.click(await screen.findByText('일정 바'))

  expect(screen.getByRole('dialog', { name: '2026-08-07 일정' })).toBeVisible()
  expect(screen.queryByRole('dialog', { name: '일정 바 상세' })).not.toBeInTheDocument()
})
