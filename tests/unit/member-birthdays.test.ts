import { expect, test } from 'vitest'
import { MEMBER_BIRTHDAYS, getBirthdaysOn } from '@/lib/member-birthdays'

test('stores every individual member birthday with an official profile URL', () => {
  expect(MEMBER_BIRTHDAYS).toHaveLength(10)
  expect(getBirthdaysOn(2026, 7, 7)).toEqual([
    expect.objectContaining({ member: '하나코 나나', profileUrl: 'https://stellive.me/nana' }),
  ])
  expect(getBirthdaysOn(2026, 6, 7)).toEqual([
    expect.objectContaining({ member: '사키하네 후야', profileUrl: 'https://stellive.me/huya' }),
  ])
})
