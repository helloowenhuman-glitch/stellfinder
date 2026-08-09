# Stellfinder

스텔라이브의 공연, 굿즈, 콜라보, 오프라인 행사를 월간 캘린더로 정리하는 팬 프로젝트입니다. 정기 방송 일정은 표시하지 않습니다.

## VS Code에서 시작하기

1. VS Code에서 이 폴더를 엽니다.
2. 추천 확장 프로그램 설치 알림이 나타나면 설치합니다.
3. `.env.example`을 복사해 `.env.local` 파일을 만들고 필요한 값을 채웁니다.
4. VS Code 터미널에서 아래 명령을 실행합니다.

```bash
npm run dev
```

5. 브라우저에서 `http://localhost:3000`을 엽니다.

## 자주 쓰는 명령

```bash
# 단위 테스트
npm run test:run

# 코드 품질 검사
npm run lint

# 프로덕션 빌드 확인
npm run build

# 브라우저 E2E 테스트
npm run test:e2e
```

## 환경 변수

| 이름 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저에서 쓰는 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 수집 작업에서만 쓰는 서버 전용 키 |
| `CLAUDE_WEBHOOK_SECRET` | Claude 루틴이 자동 등록 API를 호출할 때 사용하는 전용 비밀 키 |

`SUPABASE_SERVICE_ROLE_KEY`, `CLAUDE_WEBHOOK_SECRET`은 브라우저 코드, Git, Claude 대화에 절대 넣지 않습니다.

## Claude 루틴 자동 등록

Claude 루틴은 매일 공식 Stellive 웹사이트와 공식 X 게시물만 확인한 뒤, 아래 URL로 행사 후보를 보냅니다.

```text
POST https://내-배포-주소/api/inbound/claude
Authorization: Bearer <CLAUDE_WEBHOOK_SECRET>
Content-Type: application/json
```

요청 본문은 다음 형식입니다. `sourceUrl`은 반드시 공식 Stellive 도메인 또는 X 링크여야 하며, 정기 방송 일정은 보내지 않습니다.

```json
{
  "events": [
    {
      "title": "행사명",
      "category": "performance",
      "startAt": "2026-08-20T19:00:00+09:00",
      "endAt": null,
      "allDay": false,
      "participants": ["아오쿠모 린"],
      "location": "행사 장소 또는 온라인",
      "summary": "공식 공지를 짧게 요약한 내용",
      "sourceUrl": "https://stellive.me/news/example",
      "sourceChannel": "official-site",
      "sourcePublishedAt": "2026-08-10T09:00:00+09:00",
      "confidence": 0.95
    }
  ]
}
```

신뢰도 `0.90` 이상인 항목은 즉시 캘린더에 표시되고, 그보다 낮은 항목은 `needs_review`로 저장되어 공개되지 않습니다. 같은 `sourceUrl`이 다시 오면 새 행사를 중복 생성하지 않고 기존 행사를 갱신합니다.
