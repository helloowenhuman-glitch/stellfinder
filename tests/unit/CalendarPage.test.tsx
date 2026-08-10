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
