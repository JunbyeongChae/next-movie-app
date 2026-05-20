import { searchMovies } from '@/lib/tmdb';
import MovieList from '@/components/MovieList';
import SearchForm from '@/components/SearchForm';
import { Suspense } from 'react';

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query } = await searchParams;

  const movies = query ? await searchMovies(query) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">검색</h1>

      {/* SearchForm은 useSearchParams를 사용하므로 Suspense로 감싸야 합니다 */}
      <Suspense>
        <SearchForm />
      </Suspense>

      {query && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">&quot;{query}&quot;</span> 검색 결과 {movies.length}건
        </p>
      )}

      {query && <MovieList movies={movies} />}
    </div>
  );
}
