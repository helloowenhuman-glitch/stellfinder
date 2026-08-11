import type { Participant } from '@/lib/member-colors'

export type MemberBirthday = {
  member: Participant
  month: number
  day: number
  profileUrl: string
}

export const MEMBER_BIRTHDAYS: MemberBirthday[] = [
  { member: '아야츠노 유니', month: 5, day: 21, profileUrl: 'https://stellive.me/yuni' },
  { member: '시라유키 히나', month: 1, day: 5, profileUrl: 'https://stellive.me/hina' },
  { member: '네네코 마시로', month: 2, day: 22, profileUrl: 'https://stellive.me/mashiro' },
  { member: '아카네 리제', month: 10, day: 1, profileUrl: 'https://stellive.me/lize' },
  { member: '아라하시 타비', month: 9, day: 7, profileUrl: 'https://stellive.me/tabi' },
  { member: '텐코 시부키', month: 3, day: 21, profileUrl: 'https://stellive.me/shibuki' },
  { member: '유즈하 리코', month: 4, day: 13, profileUrl: 'https://stellive.me/riko' },
  { member: '아오쿠모 린', month: 5, day: 3, profileUrl: 'https://stellive.me/rin' },
  { member: '사키하네 후야', month: 7, day: 7, profileUrl: 'https://stellive.me/huya' },
  { member: '하나코 나나', month: 8, day: 7, profileUrl: 'https://stellive.me/nana' },
]

export function getBirthdaysOn(_year: number, monthIndex: number, day: number) {
  return MEMBER_BIRTHDAYS.filter((birthday) => birthday.month === monthIndex + 1 && birthday.day === day)
}
