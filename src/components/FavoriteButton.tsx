'use client';

import { useFavoriteStore } from '@/store/favoriteStore';
import { Button } from '@/components/ui/button';
// 수정 전
//import type { Movie } from "@/types/movie.types";

// 수정 후
import type { Movie } from '@/types';

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
