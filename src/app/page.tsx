// src/app/page.tsx
import { fetchPopularMovies, fetchGenres } from '@/lib/tmdb'
import GenreFilter from '@/components/GenreFilter'

// 장르와 영화 데이터를 서버에서 미리 가져옵니다. 페이지가 로드될 때 이미 데이터가 준비되어 있습니다.
export default async function HomePage() {
  const [movies, genres] = await Promise.all([  // promise.all로 두 API 요청을 동시에 처리하여 로딩 시간을 줄입니다.
    fetchPopularMovies(),
    fetchGenres(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">인기 영화</h1>
      <GenreFilter genres={genres} movies={movies} />
    </div>
  )
}