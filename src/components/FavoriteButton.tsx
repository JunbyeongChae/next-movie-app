'use client';

import { useFavoriteStore } from '@/store/favoriteStore';
import { Button } from '@/components/ui/button';
import type { Movie } from '@/types/movie.types';

interface FavoriteButtonProps {
  movie: Movie;
}

export default function FavoriteButton({ movie }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const favorited = isFavorite(movie.id);

  function handleClick() {
    if (favorited) {
      removeFavorite(movie.id);
    } else {
      addFavorite(movie);
    }
  }

  return (
    <Button onClick={handleClick} variant={favorited ? 'default' : 'outline'}>
      {favorited ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
    </Button>
  );
}
