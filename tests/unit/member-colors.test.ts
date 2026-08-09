import { expect, test } from 'vitest'
import { getDisplayColor } from '@/lib/member-colors'

test('two or more participants use the group color', () => {
  expect(getDisplayColor(['아야츠노 유니', '사키하네 후야'])).toBe('#8C6CFF')
})

test('강지 event uses 강지 color', () => {
  expect(getDisplayColor(['강지'])).toBe('#8282B7')
})

test('single member event uses that member color', () => {
  expect(getDisplayColor(['아오쿠모 린'])).toBe('#0045C8')
})
