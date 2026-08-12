# Calendar Today and Density Design

## Goal

Make the current day immediately recognizable and prevent dense calendar cells from overflowing their weekly row.

## Today indicator

- The date matching `todayKey` uses a compact navy (`#102B52`) filled rounded square with white date text.
- Weekend date colors remain unchanged for dates that are not today.
- The indicator applies even when the viewed month contains dates from an adjacent month.

## Dense date behavior

- A calendar date exposes at most three event rows within its cell.
- If four or more event rows occur on a date, only the first three are rendered for that date; no gradient is applied.
- The lower-right corner of that cell shows a circular `+N` badge, where `N` is the number of events not rendered for that date.
- The badge uses a restrained light-gray palette: background `#E2E8F0`, border `#CBD5E1`, and text `#475569`.
- The badge is not shown when all event rows for the date are visible.

## Event layout

- Preserve the existing continuous weekly bars where an event is visible; split a bar only when it must be hidden on a date that already has three events.
- Compute each segment's visual row so a segment that overlaps another segment horizontally is placed on a separate row.
- Keep the week row height fixed by rendering no more than three event rows. Birthday badges render beneath the visible event rows without increasing the event-row limit.

## Interaction and accessibility

- Existing event and birthday click behavior remains unchanged for visible items.
- The `+N` badge is informational and does not open a new interaction.
- The current-day date cell remains an accessible button with its existing date label.

## Verification

- Unit tests cover the current-day style, per-date three-row rendering limit, hidden-row count, no-gradient behavior, and no badge at three or fewer rows.
- Existing multi-day bar and birthday tests must continue to pass.
