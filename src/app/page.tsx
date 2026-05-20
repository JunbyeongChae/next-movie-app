// src/app/page.tsx
import { fetchPopularMovies, fetchGenres } from '@/lib/tmdb';
import GenreFilter from '@/components/GenreFilter';

// page.tsx는 서버 컴포넌트이므로 async/await를 바로 사용할 수 있습니다.
// 브라우저가 아닌 서버에서 TMDB를 호출하고 완성된 HTML을 내려줍니다.
export default async function HomePage() {
  const [movies, genres] = await Promise.all([fetchPopularMovies(), fetchGenres()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">인기 영화</h1>
      <GenreFilter genres={genres} movies={movies} />
    </div>
  );
}
