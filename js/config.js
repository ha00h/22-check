// 22 체크 설정. 비밀값은 절대 넣지 마세요.
window.CONFIG = {
  // 슬라임 스프라이트: 32x32 프레임을 가로로 이어 붙인 시트, 프레임별 ms
  SLIME_SHEET: 'assets/slime_B_sheet.png',
  SLIME_FRAMES_MS: [160, 120, 120, 160, 120, 160],
  // 공개 의견 전송 서버 (POST /api/feedback 만 사용). 비어 있으면 전송 꺼짐(임시 보관만).
  FEEDBACK_API_BASE: 'https://desktop-tqlte9r.tail4b5a54.ts.net:10000',
  // 관리자 서버 (Tailscale 내부 전용, GET /api/feedback + 비밀키 헤더). 비어 있으면 서버 꺼짐 표시.
  ADMIN_API_BASE: 'https://desktop-tqlte9r.tail4b5a54.ts.net:9443',
  TIMER_MINUTES: 20,
  RETRY_INTERVAL_MS: 60 * 1000
};
