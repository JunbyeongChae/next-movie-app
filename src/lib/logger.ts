const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  // 에러는 프로덕션에서도 Sentry 등 모니터링 도구가 캡처하므로 항상 출력
  error: console.error.bind(console)
};
