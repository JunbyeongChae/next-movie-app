// src/app/favorites/page.tsx
import FavoritesList from '@/components/FavoritesList'

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">즐겨찾기</h1>
      <FavoritesList />
    </div>
  )
}