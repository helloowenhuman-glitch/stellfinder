export const MEMBER_COLORS = {
  '아야츠노 유니': '#8100FF',
  '시라유키 히나': '#FF4A60',
  '네네코 마시로': '#B3B3B3',
  '아카네 리제': '#B61B1C',
  '아라하시 타비': '#64BCFF',
  '텐코 시부키': '#C3B8FF',
  '아오쿠모 린': '#0045C8',
  '유즈하 리코': '#BBFFB4',
  '하나코 나나': '#FF87CE',
  '사키하네 후야': '#6847B3',
  '강지': '#8282B7',
  '스텔라이브 단체': '#8C6CFF',
} as const

export type Participant = keyof typeof MEMBER_COLORS

export function getDisplayColor(participants: Participant[]): string {
  if (participants.length !== 1) {
    return MEMBER_COLORS['스텔라이브 단체']
  }

  return MEMBER_COLORS[participants[0]]
}
