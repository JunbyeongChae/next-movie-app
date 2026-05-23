// src/lib/tmdb.ts
import { Movie, MovieDetail, Genre } from '../types/movie.types'

import { logger } from "@/lib/logger";

const BASE_URL = 'https://api.themoviedb.org/3'

// process.env는 Node.js가 제공하는 환경변수 저장소입니다.
// .env.local 파일에 저장한 값을 코드 안에서 읽어오는 방법입니다.
// import 없이 어디서든 사용할 수 있습니다.
//
// ❌ 코드에 직접 작성하면 GitHub에 올릴 때 전 세계에 노출됩니다.
//    const API_KEY = 'abc123xyz'
// ✅ 환경변수로 분리하면 .env.local은 .gitignore에 포함되어 노출되지 않습니다.
const API_KEY = process.env.TMDB_API_KEY

// 모든 TMDB 요청의 공통 로직을 담은 내부 함수입니다. export하지 않으므로 이 파일 안에서만 사용합니다.
//
// async
//   → 이 함수 안에서 await를 사용할 수 있습니다. 네트워크 요청처럼 시간이 걸리는 작업을 기다립니다.
//
// function tmdbFetch
//   → 함수 이름입니다. export가 없으므로 이 파일 내부에서만 호출할 수 있습니다.
//
// <T>
//   → 제네릭(Generic)입니다. 응답 데이터의 타입을 호출하는 쪽에서 직접 지정합니다.
//     예) tmdbFetch<{ results: Movie[] }>(...) → T가 { results: Movie[] }로 결정됩니다.
//     같은 함수로 다양한 응답 형태를 타입 안전하게 처리할 수 있습니다.
//
// endpoint: string
//   → 호출할 API 경로입니다. 예) '/movie/popular', '/movie/123'
//
// params = ''
//   → 추가 쿼리 파라미터입니다. 기본값이 빈 문자열이므로 넘기지 않아도 됩니다.
//     검색 시에만 '&query=어벤저스' 형태로 넘깁니다.
//
// : Promise<T>
//   → 반환 타입입니다. async 함수는 항상 Promise를 반환합니다.
//     Promise가 완료되면 T 타입의 값을 돌려줍니다.
async function tmdbFetch<T>(endpoint: string, params = ''): Promise<T> {
  const res = await fetch(
    // BASE_URL + endpoint    : 요청할 API 경로
    // api_key=${API_KEY}     : 인증 키
    // language=ko-KR         : 한국어 응답 요청
    // params                 : 검색어 등 추가 파라미터 (기본값 빈 문자열)
    `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=ko-KR${params}`,
    { next: { revalidate: 3600 } }  // 1시간마다 데이터 갱신
  )

  // if (!res.ok) throw new Error(`TMDB 요청 실패:${endpoint}`)
  // return res.json()

  // 수정 후
  if (!res.ok) throw new Error(`TMDB 요청 실패:${endpoint}`);
  const data = await res.json();
  // console.log("[tmdb] 응답:", endpoint, data);
  // 수정 후
  logger.log("[tmdb] 응답:", endpoint, data);
  return data;

}

// 인기 영화 목록을 가져옵니다. 홈 페이지에서 사용합니다.
// tmdbFetch의 응답 타입을 { results: Movie[] }로 지정하면
// data.results가 Movie[] 타입임을 TypeScript가 알 수 있습니다.
export async function fetchPopularMovies() {
  const data = await tmdbFetch<{ results: Movie[] }>('/movie/popular')
  return data.results
}

// 영화 상세 정보를 가져옵니다. 상세 페이지(/movies/[id])에서 사용합니다.
export async function fetchMovie(id: string) {
  return tmdbFetch<MovieDetail>(`/movie/${id}`)
}

// 키워드로 영화를 검색합니다. 검색 페이지에서 사용합니다.
export async function searchMovies(query: string) {
  const data = await tmdbFetch<{ results: Movie[] }>(
    '/search/movie',
    `&query=${encodeURIComponent(query)}`  // 한글 등 특수문자를 URL 안전 형식으로 변환합니다.
  )
  return data.results
}

// 장르 목록을 가져옵니다. 홈 페이지의 장르 필터에서 사용합니다.
export async function fetchGenres() {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list')
  return data.genres
}

// 포스터 이미지의 전체 URL을 만들어 반환합니다.
// TMDB는 poster_path만 제공하고 앞에 CDN 주소를 붙여야 실제 이미지가 표시됩니다.
export function getPosterUrl(posterPath: string | null, size = 'w500') {
  if (!posterPath) return '/no-image.png'
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}