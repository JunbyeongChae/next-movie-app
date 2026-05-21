import MovieCard from './MovieCard';
// 수정 전
//import type { Movie } from "@/types/movie.types";

// 수정 후
import type { Movie } from '@/types';

interface MovieListProps {
  movies: Movie[];
}

export default function MovieList({ movies }: MovieListProps) {
  if (movies.length === 0) {
    return <p className="text-center text-muted-foreground py-12">표시할 영화가 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
