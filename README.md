# 22-check

'역행자'를 읽고 만든 독서 메모 + 20분 독서 타이머 모바일 웹. 빌드 없는 정적 HTML/CSS/JS, GitHub Pages(main /)로 호스팅.

## 구조
- `index.html` 홈: 메모 입력·목록(localStorage), 20분 타이머, 의견 보내기, 소개
- `admin.html` 관리자 의견 게시판 (공개 페이지에서 링크하지 않음, noindex)
- `js/config.js` 설정: `SLIME_SRC`(슬라임 교체), `FEEDBACK_API_BASE`(공개, POST /api/feedback), `ADMIN_API_BASE`(Tailscale 내부, GET /api/feedback + `X-Admin-Key`)
- 비밀키는 코드에 넣지 않습니다. 검증과 5회 실패 시 15분 차단은 서버가 담당합니다.

## 서버 응답 규칙 (예정)
- POST /api/feedback `{id,text,createdAt}` → 2xx 또는 409(중복 id)면 완료
- GET /api/feedback → 200 `[{id,text,createdAt}]` / 401 `{remaining}` / 429(+Retry-After) 차단

## 변경 기록
- 초기화: README, index.html 자리표시
- 프론트 1차: 메모·타이머(실제 시간 기준, Wake Lock)·의견 임시 보관함(1분마다 재전송, id 중복 제거)·관리자 화면 상태 구현. 서버 주소는 아직 비어 있음.
