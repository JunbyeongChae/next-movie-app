// src/app/search/page.tsx
import { searchMovies } from '@/lib/tmdb'
import MovieList from '@/components/MovieList'
import SearchForm from '@/components/SearchForm'
import { Suspense } from 'react'

interface SearchPageProps {
  searchParams: Promise<{ query?: string }>
}

/**
  page.tsx는 서버 컴포넌트로 빌드 타임에 정적으로 완성된다.
  그런데 SearchForm은 useSearchParams()로 URL을 읽어야 하므로
  실행 시점(런타임)에야 값을 알 수 있는 동적 컴포넌트다.
  Suspense로 감싸면 page.tsx 나머지는 빌드 타임에 정적으로 만들고,
  SearchForm만 런타임에 브라우저에서 별도로 처리되도록 유예할 수 있다.
*/
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { query } = await searchParams

  const movies = query ? await searchMovies(query) : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">검색</h1>

      <Suspense>
        <SearchForm />
      </Suspense>

      {query && (
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">"{query}"</span> 검색 결과 {movies.length}건
        </p>
      )}

      {query && <MovieList movies={movies} />}
    </div>
  )
}