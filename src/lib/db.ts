import { Pool } from 'pg';

// 개발 중 Hot Reload 시 Pool이 중복 생성되는 것을 방지합니다.
// process.env.NODE_ENV가 'production'이 아니면(= 개발 환경이면)
// 처음 만든 Pool을 전역 변수에 저장해 재사용합니다.
// 이렇게 하는 이유는? 개발 서버는 코드가 변경될 때마다 모듈을 다시 불러오기 때문입니다.
// globalThis는 브라우저의 window, Node.js의 global과 같은 전역 객체입니다.
const globalForDb = globalThis as unknown as { pool: Pool | undefined };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export default pool;
