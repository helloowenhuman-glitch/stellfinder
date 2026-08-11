# Member Birthdays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공식 프로필에 공개된 전 멤버 생일을 멤버색 배지로 월간 달력에 표시한다.

**Architecture:** `lib/member-birthdays.ts`가 멤버별 월·일과 공식 프로필 URL을 제공한다. `MonthGrid`는 선택 월의 날짜별 생일 배지를 렌더링하고, `CalendarPage`는 카테고리 필터에서 독립적인 생일 목록·멤버 필터·상세 팝업을 관리한다.

**Tech Stack:** Next.js 16.3.0, React Client Components, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- 생일 날짜는 공식 Stellive 프로필에서 확인한 월·일만 사용한다.
- 단체는 생일 목록에서 제외한다.
- 기존 멤버 색상, 행사 바의 색상·크기·배치를 변경하지 않는다.
- 생일은 모든 카테고리 필터에서 계속 보이고, 특정 멤버 필터에서는 그 멤버만 보인다.
- 생일은 `events` 테이블과 자동 수집 루틴에 저장하지 않고, 다가오는 일정 보기에 표시하지 않는다.
- 새 동작은 반드시 실패하는 테스트를 먼저 확인한 후 구현한다.

---

### Task 1: 생일 데이터 정의

**Files:**
- Create: `lib/member-birthdays.ts`
- Test: `tests/unit/member-birthdays.test.ts`

**Interfaces:**
- Consumes: `Participant`, `MEMBER_COLORS` from `lib/member-colors.ts`.
- Produces: `MemberBirthday`, `MEMBER_BIRTHDAYS`, `getBirthdaysOn(year, monthIndex, day)`.

- [ ] **Step 1: 월·일과 공식 프로필 URL을 기대하는 실패 테스트를 작성한다.**

```ts
expect(getBirthdaysOn(2026, 7, 7)).toEqual([
  expect.objectContaining({ member: '하나코 나나', profileUrl: 'https://stellive.me/nana' }),
])
```

- [ ] **Step 2: 테스트가 모듈을 찾지 못해 실패하는지 확인한다.**

Run: `npx vitest run tests/unit/member-birthdays.test.ts`

Expected: FAIL because `@/lib/member-birthdays` does not exist.

- [ ] **Step 3: 최소 생일 데이터와 날짜 조회 함수를 구현한다.**

```ts
export type MemberBirthday = {
  member: Participant
  month: number
  day: number
  profileUrl: string
}

export function getBirthdaysOn(year: number, monthIndex: number, day: number) {
  return MEMBER_BIRTHDAYS.filter((birthday) => birthday.month === monthIndex + 1 && birthday.day === day)
}
```

- [ ] **Step 4: 생일 데이터 단위 테스트를 통과시키고 커밋한다.**

Run: `npx vitest run tests/unit/member-birthdays.test.ts`

Expected: PASS.

Commit:

```bash
git add lib/member-birthdays.ts tests/unit/member-birthdays.test.ts
git commit -m "feat: add official member birthday data"
```

### Task 2: 월간 달력 생일 배지

**Files:**
- Modify: `components/calendar/MonthGrid.tsx`
- Test: `tests/unit/MonthGrid.test.tsx`

**Interfaces:**
- Consumes: `MemberBirthday[]`, `MEMBER_COLORS`.
- Produces: `onSelectBirthday(birthday: MemberBirthday)` callback from the calendar grid.

- [ ] **Step 1: 날짜 칸에 생일 배지와 멤버색을 기대하는 실패 테스트를 작성한다.**

```tsx
render(<MonthGrid birthdays={[huyaBirthday]} events={[]} monthIndex={6} year={2026} />)
expect(screen.getByRole('button', { name: '사키하네 후야 생일' })).toHaveStyle({ color: '#6847B3' })
```

- [ ] **Step 2: 새 `birthdays` prop이 없어 테스트가 실패하는지 확인한다.**

Run: `npx vitest run tests/unit/MonthGrid.test.tsx`

Expected: FAIL because `MonthGridProps` has no `birthdays` prop.

- [ ] **Step 3: 날짜 칸에서만 작고 둥근 생일 배지를 표시한다.**

```tsx
<button aria-label={`${birthday.member} 생일`} className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold" style={{ color: MEMBER_COLORS[birthday.member] }} type="button">
  {birthday.member} 생일
</button>
```

- [ ] **Step 4: 월간 생일 배지 테스트를 통과시키고 커밋한다.**

Run: `npx vitest run tests/unit/MonthGrid.test.tsx`

Expected: PASS.

Commit:

```bash
git add components/calendar/MonthGrid.tsx tests/unit/MonthGrid.test.tsx
git commit -m "feat: show member birthday badges in calendar"
```

### Task 3: 필터 연동과 생일 상세 팝업

**Files:**
- Modify: `components/calendar/CalendarPage.tsx`
- Test: `tests/unit/CalendarPage.test.tsx`

**Interfaces:**
- Consumes: `MEMBER_BIRTHDAYS`, `getBirthdaysOn`, `MemberBirthday`, `MonthGrid.onSelectBirthday`.
- Produces: 카테고리 필터와 분리된 `visibleBirthdays`, 생일 상세 dialog.

- [ ] **Step 1: 카테고리 필터 유지, 멤버 필터 제한, 공식 프로필 링크를 검증하는 실패 테스트를 작성한다.**

```tsx
fireEvent.click(screen.getByRole('button', { name: '굿즈' }))
expect(screen.getByRole('button', { name: '하나코 나나 생일' })).toBeVisible()
fireEvent.click(screen.getByRole('button', { name: '하나코 나나 생일' }))
expect(screen.getByRole('link', { name: '공식 프로필 보기' })).toHaveAttribute('href', 'https://stellive.me/nana')
```

- [ ] **Step 2: 현재 달력에 생일 배지와 팝업이 없어 테스트가 실패하는지 확인한다.**

Run: `npx vitest run tests/unit/CalendarPage.test.tsx`

Expected: FAIL because the birthday button and dialog are not rendered.

- [ ] **Step 3: 생일을 카테고리 이벤트 필터와 분리하고 생일 상세 팝업을 구현한다.**

```ts
const visibleBirthdays = MEMBER_BIRTHDAYS.filter((birthday) => member === 'all' || birthday.member === member)
```

- [ ] **Step 4: 생일 상호작용 테스트를 통과시키고 커밋한다.**

Run: `npx vitest run tests/unit/CalendarPage.test.tsx`

Expected: PASS.

Commit:

```bash
git add components/calendar/CalendarPage.tsx tests/unit/CalendarPage.test.tsx
git commit -m "feat: filter and open member birthdays"
```

### Task 4: 전체 검증과 배포

**Files:**
- Verify only: `lib/member-birthdays.ts`, `components/calendar/MonthGrid.tsx`, `components/calendar/CalendarPage.tsx`, related unit tests.

**Interfaces:**
- Consumes: Tasks 1–3 changes.
- Produces: lint, unit-test, production-build validation results.

- [ ] **Step 1: 포맷·lint 오류를 확인한다.**

Run: `npx eslint lib/member-birthdays.ts components/calendar/MonthGrid.tsx components/calendar/CalendarPage.tsx tests/unit/member-birthdays.test.ts tests/unit/MonthGrid.test.tsx tests/unit/CalendarPage.test.tsx`

Expected: PASS with no errors.

- [ ] **Step 2: 전체 단위 테스트를 실행한다.**

Run: `npm run test:run`

Expected: PASS.

- [ ] **Step 3: 프로덕션 빌드를 실행한다.**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: 변경을 검사하고 master에 푸시한다.**

Run: `git diff --check && git status --short`

Expected: 예상한 생일 기능·문서 파일만 변경됨.

Commit:

```bash
git add lib/member-birthdays.ts components/calendar/MonthGrid.tsx components/calendar/CalendarPage.tsx tests/unit/member-birthdays.test.ts tests/unit/MonthGrid.test.tsx tests/unit/CalendarPage.test.tsx
git commit -m "feat: add member birthday calendar badges"
git push origin master
```
