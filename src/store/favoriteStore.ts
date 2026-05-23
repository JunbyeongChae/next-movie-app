// src/store/favoriteStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Movie } from '@/types/movie.types'

interface FavoriteState {
  favorites: Movie[]
  addFavorite: (movie: Movie) => void
  removeFavorite: (movieId: number) => void
  isFavorite: (movieId: number) => boolean
}

// create 함수 : zustand가 관리하는 상태 저장소를 생성하는 함수입니다. FavoriteState 인터페이스를 사용하여 상태의 타입을 정의합니다.
// persist 미들웨어 : 상태를 localStorage에 저장하여 페이지 새로고침 시에도 상태가 유지되도록 합니다. createJSONStorage를 사용하여 JSON 형식으로 저장합니다.
// partialize 옵션 : 상태 객체에서 favorites 배열만 저장하도록 지정합니다. addFavorite, removeFavorite, isFavorite 함수는 저장하지 않습니다.
export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      // 액션 생성 함수(리듀서), set: 상태를 업데이트하는 함수입니다. get: 현재 상태를 가져오는 함수입니다.
      addFavorite: (movie) =>
        set((state) => ({ favorites: [...state.favorites, movie] })),

      removeFavorite: (movieId) =>
        set((state) => ({
          favorites: state.favorites.filter((m) => m.id !== movieId),
        })),

      isFavorite: (movieId) =>
        get().favorites.some((m) => m.id === movieId),
    }),
    {
      name: 'favorite-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
)
