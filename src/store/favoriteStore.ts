import { create } from 'zustand';
import type { Movie } from '@/types/movie.types';

interface FavoriteState {
  favorites: Movie[];
  addFavorite: (movie: Movie) => void;
  removeFavorite: (movieId: number) => void;
  isFavorite: (movieId: number) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()((set, get) => ({
  favorites: [],

  // set: 상태를 변경하는 함수. 현재 state를 받아 새 state를 반환한다.
  // [...state.favorites, movie] — 기존 배열을 복사하고 새 영화를 추가 (불변성 유지)
  addFavorite: (movie) => set((state) => ({ favorites: [...state.favorites, movie] })),

  // filter로 해당 id를 제외한 새 배열을 만들어 교체한다.
  removeFavorite: (movieId) =>
    set((state) => ({
      favorites: state.favorites.filter((m) => m.id !== movieId)
    })),

  // get: set 없이 현재 상태를 읽기만 할 때 사용한다.
  // set을 쓰면 상태가 바뀌어 리렌더링이 발생하므로, 단순 조회는 get을 쓴다.
  isFavorite: (movieId) => get().favorites.some((m) => m.id === movieId)
}));
