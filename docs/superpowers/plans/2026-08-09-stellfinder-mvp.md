# Stellfinder MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공식 스텔라이브 공지를 매일 수집하고, 특별 행사를 멤버 색상의 월간 캘린더로 제공한다.

**Architecture:** Next.js App Router가 공개 캘린더와 서버 API를 제공한다. Supabase Postgres는 행사와 수집 기록을 저장하며, 브라우저에는 공개(`verified`) 행사만 읽기 권한을 준다. 보호된 일일 cron Route Handler가 OpenAI Responses API의 web search로 공식 웹사이트와 공식 X를 검색하고, 구조화한 후보를 중복 없이 저장한다.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Supabase Postgres/CLI, OpenAI JavaScript SDK (Responses API + web search), Vitest, React Testing Library, Playwright, Vercel Cron, VS Code.

## Global Constraints

- Node.js 20 이상과 npm을 사용한다.
- 페이지는 한국어로 작성하고 정기 방송 일정은 저장하거나 표시하지 않는다.
- 수집 후보는 공식 원문 URL이 있어야 하며, 공개 목록에는 `verified` 행사만 보인다.
- Supabase service-role 키와 OpenAI API 키는 서버에서만 사용하고 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- 모든 공개 테이블에 RLS를 활성화하고 anon 역할에는 `verified` 행사 읽기만 허용한다.
- 색상 기준값은 기획서의 HEX를 그대로 사용한다.
- VS Code 설정은 `.vscode/`에만 추가하며, 개인 로컬 설정과 비밀값은 커밋하지 않는다.

---

## File Structure

| 경로 | 책임 |
| --- | --- |
| `app/page.tsx` | 월간 캘린더 공개 페이지 |
| `app/api/events/route.ts` | 지정한 월의 공개 행사 JSON API |
| `app/api/cron/ingest/route.ts` | CRON_SECRET으로 보호된 일일 수집 API |
| `components/calendar/*` | 월 네비게이션, 필터, 그리드, 일정 바, 상세 다이얼로그 |
| `lib/calendar.ts` | 월 범위, 7열 날짜 셀, 기간 일정 배치 순수 함수 |
| `lib/events.ts` | Supabase 행사 조회와 색상 결정 규칙 |
| `lib/ingestion/*` | 검색 프롬프트, 응답 검증, 중복 upsert |
| `lib/supabase/*` | 브라우저 및 서버 Supabase 클라이언트 |
| `supabase/migrations/` | 스키마, 인덱스, RLS 정책 |
| `supabase/seed.sql` | UI 개발용 검증된 예시 행사 |
| `tests/unit/*` | 날짜, 색상, 추출 결과 검증 테스트 |
| `tests/e2e/calendar.spec.ts` | 공개 캘린더 핵심 흐름 |
| `.vscode/*` | VS Code 확장 추천, 테스트/개발 작업, 디버그 설정 |

## Task 1: 프로젝트 뼈대와 VS Code 개발 환경

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
- Create: `.vscode/extensions.json`, `.vscode/tasks.json`, `.vscode/launch.json`, `.env.example`, `README.md`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: `npm run dev`, `npm run test`, `npm run test:e2e`, `npm run lint` scripts.

- [ ] **Step 1: Next.js TypeScript 프로젝트를 생성한다.**

Run: `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir=false --use-npm --import-alias "@/*"`

- [ ] **Step 2: 테스트 도구를 추가한다.**

Run: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom playwright @playwright/test`

- [ ] **Step 3: 실패하는 smoke 테스트를 작성한다.**

```ts
// tests/unit/smoke.test.ts
import { expect, test } from 'vitest'

test('test runner is configured', () => {
  expect(true).toBe(true)
})
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다.**

Run: `npm run test -- --run`

Expected: `1 passed`.

- [ ] **Step 5: VS Code와 환경변수 파일을 작성한다.**

`.vscode/extensions.json`에는 `dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`, `ms-playwright.playwright`, `supabase.supabase-vscode`를 추천한다. `.env.example`에는 아래 키 이름만 둔다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
CRON_SECRET=
```

`README.md`에는 VS Code에서 폴더 열기, `.env.local` 생성, `npm run dev`, `npm run test -- --run` 순서를 적는다.

- [ ] **Step 6: 품질 검사를 실행한다.**

Run: `npm run lint && npm run test -- --run`

- [ ] **Step 7: 커밋한다.**

```bash
git add .
git commit -m "chore: scaffold Stellfinder web app"
```

## Task 2: 행사 스키마, 색상 규칙, 공개 권한

**Files:**
- Create: `supabase/migrations/202608090001_create_events.sql`, `supabase/seed.sql`
- Create: `lib/domain.ts`, `lib/member-colors.ts`
- Test: `tests/unit/member-colors.test.ts`

**Interfaces:**
- Produces: `EventRecord`, `EventCategory`, `EventStatus`, `getDisplayColor(participants: Participant[])`.
- Consumes: Supabase CLI migration convention.

- [ ] **Step 1: 색상 선택의 실패 테스트를 작성한다.**

```ts
import { expect, test } from 'vitest'
import { getDisplayColor } from '@/lib/member-colors'

test('two or more participants use group color', () => {
  expect(getDisplayColor(['아야츠노 유니', '사키하네 후야'])).toBe('#8C6CFF')
})

test('강지 event uses 강지 color', () => {
  expect(getDisplayColor(['강지'])).toBe('#8282B7')
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `npm run test -- --run tests/unit/member-colors.test.ts`

Expected: FAIL with module-not-found error.

- [ ] **Step 3: 도메인 타입과 정확한 색상표를 구현한다.**

```ts
export const MEMBER_COLORS = {
  '아야츠노 유니': '#8100FF', '시라유키 히나': '#FF4A60',
  '네네코 마시로': '#B3B3B3', '아카네 리제': '#B61B1C',
  '아라하시 타비': '#64BCFF', '텐코 시부키': '#C3B8FF',
  '아오쿠모 린': '#0045C8', '유즈하 리코': '#BBFFB4',
  '하나코 나나': '#FF87CE', '사키하네 후야': '#6847B3',
  '강지': '#8282B7', '스텔라이브 단체': '#8C6CFF',
} as const

export function getDisplayColor(participants: (keyof typeof MEMBER_COLORS)[]) {
  return participants.length === 1 ? MEMBER_COLORS[participants[0]] : MEMBER_COLORS['스텔라이브 단체']
}
```

- [ ] **Step 4: migration을 작성한다.**

`events` 테이블에는 UUID `id`, `title`, `category`, `start_at`, nullable `end_at`, `all_day`, `participants text[]`, `display_color`, nullable `location`, `summary`, `source_url unique`, `source_channel`, `source_published_at`, `status`, `external_id unique`, `created_at`, `updated_at`를 만든다. `category`는 `performance`, `goods`, `collaboration`, `offline`만, `status`는 `verified`, `needs_review`만 허용하는 CHECK 제약을 둔다. `start_at` 및 `status` 인덱스를 만든다.

`events`에 RLS를 켜고 anon/authenticated 역할의 SELECT 정책은 `status = 'verified'`인 행으로 제한한다. insert/update/delete 정책은 만들지 않는다.

- [ ] **Step 5: 예시 데이터를 넣는다.**

`supabase/seed.sql`에는 2026년 8월의 단일 행사 4개와 8월 14일~16일 단체 팝업스토어 1개를 `verified`로 넣는다. 모든 행은 `source_url`을 `https://stellive.me/news/example-<번호>` 형식으로 두며, 실제 공지처럼 주장하지 않는 개발용 데이터임을 SQL 주석에 명시한다.

- [ ] **Step 6: 로컬 DB에서 migration과 색상 테스트를 확인한다.**

Run: `supabase start && supabase db reset && npm run test -- --run tests/unit/member-colors.test.ts`

Expected: migration 적용 및 색상 테스트 PASS.

- [ ] **Step 7: 커밋한다.**

```bash
git add supabase lib tests
git commit -m "feat: add event schema and member colors"
```

## Task 3: 월간 날짜 계산과 공개 행사 조회 API

**Files:**
- Create: `lib/calendar.ts`, `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `lib/events.ts`, `app/api/events/route.ts`
- Test: `tests/unit/calendar.test.ts`, `tests/unit/events-api.test.ts`

**Interfaces:**
- Produces: `getMonthGrid(year: number, monthIndex: number): Date[]`, `getMonthRange(year: number, monthIndex: number)`, `GET /api/events?month=2026-08`.
- Consumes: `EventRecord` and public RLS policy.

- [ ] **Step 1: 월 경계 실패 테스트를 작성한다.**

```ts
import { expect, test } from 'vitest'
import { getMonthGrid } from '@/lib/calendar'

test('August 2026 grid starts on Sunday and has 42 cells', () => {
  const grid = getMonthGrid(2026, 7)
  expect(grid).toHaveLength(42)
  expect(grid[0].toISOString().slice(0, 10)).toBe('2026-07-26')
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `npm run test -- --run tests/unit/calendar.test.ts`

Expected: FAIL with module-not-found error.

- [ ] **Step 3: 순수 날짜 함수를 구현한다.**

`getMonthGrid`는 항상 일요일부터 시작하는 6주, 42개 날짜를 반환한다. `getMonthRange`는 UTC 기준으로 해당 월 첫날 00:00과 다음 월 첫날 00:00을 반환한다. 브라우저 시간대 때문에 날짜가 밀리지 않도록 화면용 날짜 문자열은 `YYYY-MM-DD`로 별도 생성한다.

- [ ] **Step 4: 서버 Supabase 조회를 구현한다.**

`listVerifiedEventsForMonth(month: string)`은 `start_at < 다음달` 및 `(end_at is null and start_at >= 이번달) or end_at >= 이번달` 조건으로 기간 일정도 포함해 정렬한다. API는 `month`가 `^\\d{4}-(0[1-9]|1[0-2])$`가 아니면 400 JSON을 반환한다.

- [ ] **Step 5: 테스트를 통과시킨다.**

Run: `npm run test -- --run tests/unit/calendar.test.ts tests/unit/events-api.test.ts`

Expected: PASS.

- [ ] **Step 6: 커밋한다.**

```bash
git add app lib tests
git commit -m "feat: add public event query API"
```

## Task 4: 월간 캘린더 UI와 필터·상세 화면

**Files:**
- Create: `components/calendar/CalendarPage.tsx`, `MonthNavigator.tsx`, `CategoryFilter.tsx`, `MonthGrid.tsx`, `EventBar.tsx`, `EventDialog.tsx`
- Modify: `app/page.tsx`, `app/globals.css`
- Test: `tests/unit/MonthGrid.test.tsx`, `tests/e2e/calendar.spec.ts`

**Interfaces:**
- Consumes: `GET /api/events?month=YYYY-MM`, `EventRecord`, `getMonthGrid`.
- Produces: 키보드로 접근 가능한 월 이동, 유형 필터, 일정 상세 다이얼로그.

- [ ] **Step 1: 기간 일정 표현의 실패 테스트를 작성한다.**

```tsx
render(<MonthGrid month="2026-08" events={[popupEvent]} />)
expect(screen.getByText('STELLIVE 팝업스토어')).toBeVisible()
expect(screen.getByText('STELLIVE 팝업스토어')).toHaveClass('rounded-md')
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `npm run test -- --run tests/unit/MonthGrid.test.tsx`

Expected: FAIL with component-not-found error.

- [ ] **Step 3: 참고 시안의 구조를 구현한다.**

좌측에는 `STELLFINDER`, 중앙에는 월 이동 화살표와 `YYYY.MM`, 우측에는 월간 보기 표시를 둔다. 그 아래에는 전체/공연/굿즈/콜라보/오프라인 단일 선택 필터를 둔다. 캘린더는 7열과 얇은 회색 테두리, 일요일 빨간 날짜, 토요일 파란 날짜로 구현한다.

- [ ] **Step 4: 이벤트 바와 상세 다이얼로그를 구현한다.**

`EventBar`는 `style={{ '--event-color': event.displayColor }}`를 사용해 연한 배경과 진한 제목색을 계산하고 Tailwind `rounded-md`를 적용한다. 클릭하면 `EventDialog`에서 제목, 유형, 기간, 관련 인물, 장소, 요약, 원문 링크, 상태를 표시한다. 외부 원문 링크에는 `target="_blank" rel="noreferrer"`를 쓴다.

- [ ] **Step 5: 필터와 월 이동을 검증한다.**

Playwright 테스트에서 2026년 8월을 열고 `굿즈` 필터 선택 시 goods 행사만 남는지, 오른쪽 화살표 선택 시 `2026.09`로 변하는지, 행사 선택 시 원문 링크가 있는 다이얼로그가 열리는지 확인한다.

- [ ] **Step 6: 전체 UI 테스트를 실행한다.**

Run: `npm run test -- --run && npx playwright test`

Expected: 모든 단위 및 E2E 테스트 PASS.

- [ ] **Step 7: 커밋한다.**

```bash
git add app components lib tests
git commit -m "feat: build monthly event calendar"
```

## Task 5: 공식 공지 AI 수집과 중복·검수 처리

**Files:**
- Create: `lib/ingestion/prompt.ts`, `lib/ingestion/schema.ts`, `lib/ingestion/ingest.ts`, `app/api/cron/ingest/route.ts`
- Create: `vercel.json`
- Test: `tests/unit/ingestion-schema.test.ts`, `tests/unit/ingest.test.ts`

**Interfaces:**
- Produces: `ingestOfficialEvents(): Promise<{ created: number; updated: number; review: number }>` and protected `GET /api/cron/ingest`.
- Consumes: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

- [ ] **Step 1: 구조화 응답 검증의 실패 테스트를 작성한다.**

```ts
import { expect, test } from 'vitest'
import { parseCandidate } from '@/lib/ingestion/schema'

test('candidate without official URL is rejected', () => {
  expect(() => parseCandidate({ title: '행사', sourceUrl: '' })).toThrow('sourceUrl')
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `npm run test -- --run tests/unit/ingestion-schema.test.ts`

Expected: FAIL with module-not-found error.

- [ ] **Step 3: 수집 프롬프트와 검증 스키마를 구현한다.**

OpenAI Responses API 호출은 `tools: [{ type: 'web_search' }]`를 사용한다. 프롬프트에는 `site:stellive.me`와 공식 X만 근거로 쓰고, 정기 방송은 제외하며, 공식 URL 없는 결과는 반환하지 말고, `title`, `category`, `startAt`, `endAt`, `participants`, `location`, `summary`, `sourceUrl`, `sourceChannel`, `sourcePublishedAt`, `confidence` JSON만 반환하라고 명시한다.

`parseCandidate`는 `sourceUrl`이 `https://stellive.me/` 또는 공식 X 호스트인지, category가 4개 허용값인지, 참여자가 확정된 이름인지 검증한다. 검증 실패 후보는 로그에 이유만 남기고 저장하지 않는다.

- [ ] **Step 4: upsert와 검수 규칙을 구현한다.**

`source_url`을 conflict target으로 upsert한다. 공식 URL, 유효 날짜, 허용 category, 참가자 존재, `confidence >= 0.9`를 모두 만족하면 `verified`, 하나라도 부족하면 `needs_review`로 저장한다. service-role 클라이언트는 이 서버 파일에서만 생성한다.

- [ ] **Step 5: cron Route Handler를 보호한다.**

`Authorization: Bearer <CRON_SECRET>`이 일치하지 않으면 401을 반환한다. 성공하면 수집 결과의 created/updated/review 수만 JSON으로 반환하고, API 키나 원문 전체를 응답에 포함하지 않는다. `vercel.json`에 매일 UTC 00:15 실행되는 `/api/cron/ingest` cron을 추가한다.

- [ ] **Step 6: 단위 테스트를 통과시킨다.**

Run: `npm run test -- --run tests/unit/ingestion-schema.test.ts tests/unit/ingest.test.ts`

Expected: URL 누락 후보 거절, 중복 URL update, 저신뢰 후보 검수 대기 테스트 PASS.

- [ ] **Step 7: 커밋한다.**

```bash
git add app lib tests vercel.json
git commit -m "feat: ingest official event announcements daily"
```

## Task 6: 배포 전 검증과 운영 문서

**Files:**
- Modify: `README.md`, `.env.example`
- Create: `docs/operations.md`
- Test: `tests/e2e/calendar.spec.ts`

**Interfaces:**
- Produces: 로컬 개발, Supabase migration, Vercel 환경변수, 수집 실패 대응 절차.

- [ ] **Step 1: 운영 문서에 정확한 설정 절차를 작성한다.**

`docs/operations.md`에는 Supabase 프로젝트 연결, `supabase db push`, Vercel 환경변수 5개 설정, Vercel cron 수동 호출 검증, `needs_review` 행을 Supabase Dashboard에서 `verified` 또는 삭제로 처리하는 절차를 적는다. 서비스 키와 OpenAI 키가 브라우저 코드에 노출되면 안 된다는 경고를 포함한다.

데이터 보관 기준도 함께 적는다. 공지 이미지·원문 HTML·AI 검색 전문은 저장하지 않으며, 제외 후보는 90일 뒤 삭제한다. DB 전체 사용량이 480MB를 넘으면 일일 작업 시작 전에 가장 오래된 행사부터 삭제해 480MB 미만으로 낮추고, 삭제 건수와 기준 날짜를 운영 로그에 기록한다.

- [ ] **Step 2: 공개 데이터 보호를 수동 검증한다.**

Supabase SQL Editor에서 anon 역할로 `status = 'needs_review'` 행을 읽을 수 없는지, `verified` 행은 API에서 읽히는지 확인한다.

- [ ] **Step 3: 프로덕션 빌드와 브라우저 흐름을 실행한다.**

Run: `npm run lint && npm run test -- --run && npm run build && npx playwright test`

Expected: lint, unit tests, production build, E2E 모두 PASS.

- [ ] **Step 4: README의 VS Code 시작 절차를 실제로 따라 검증한다.**

VS Code에서 프로젝트 폴더를 열고 추천 확장 설치 알림, `Run Task: dev`, Playwright 테스트 실행 명령이 보이는지 확인한다.

- [ ] **Step 5: 커밋한다.**

```bash
git add README.md .env.example docs .vscode
git commit -m "docs: add Stellfinder operations guide"
```

## Plan Self-Review

- 기획서의 특별 행사 범위, 방송 제외, 색상표, 둥근 기간 바, 월 이동, 유형 필터, 상세 출처 링크, 매일 공식 수집, 검수 상태를 각각 Task 2~5에서 구현한다.
- 공개 데이터에는 RLS SELECT 정책을, 수집에는 서버 전용 service-role 및 cron 비밀값을 사용한다.
- 각 새 순수 함수와 입력 검증에는 실패-통과 테스트 단계를 넣었다.
- 실제 배포에 앞서 production build, E2E, 수동 RLS 검증, VS Code 작업 흐름 검증을 수행한다.
