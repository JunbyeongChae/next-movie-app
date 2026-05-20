'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Genre, Movie } from '@/types/movie.types';
import MovieList from './MovieList';

interface GenreFilterProps {
  genres: Genre[];
  movies: Movie[];
}

export default function GenreFilter({ genres, movies }: GenreFilterProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = selectedId === null ? movies : movies.filter((movie) => movie.genre_ids.includes(selectedId));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant={selectedId === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedId(null)}>
          전체
        </Button>
        {genres.map((genre) => (
          <Button key={genre.id} variant={selectedId === genre.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedId(genre.id)}>
            {genre.name}
          </Button>
        ))}
      </div>
      <MovieList movies={filtered} />
    </div>
  );
}
