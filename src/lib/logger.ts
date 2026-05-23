// src/lib/logger.ts

const isDev = process.env.NODE_ENV === "development"; // 현재 앱실행이 개발모드 또는 프로덕션 모드인지 판단하는 상수입니다.

export const logger = {
  log: isDev ? console.log.bind(console) : () => {}, // 개발 모드에서는 console.log를 그대로 사용하지만, 프로덕션 모드에서는 빈 함수로 대체하여 로그가 출력되지 않도록 합니다.
  warn: isDev ? console.warn.bind(console) : () => {},
  // 에러는 프로덕션에서도 Sentry 등 모니터링 도구가 캡처하므로 항상 출력
  error: console.error.bind(console),
};