// src/components/FavoritesList.tsx
'use client'

import { useFavoriteStore } from '@/store/favoriteStore'
import MovieList from './MovieList'

export default function FavoritesList() {
  const { favorites } = useFavoriteStore()

  if (favorites.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        즐겨찾기한 영화가 없습니다.
      </p>
    )
  }

  return <MovieList movies={favorites} />
}