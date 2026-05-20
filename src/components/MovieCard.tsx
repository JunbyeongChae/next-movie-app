import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { getPosterUrl } from '@/lib/tmdb';
import type { Movie } from '@/types/movie.types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movies/${movie.id}`} className="block group">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="relative aspect-2/3">
          <Image src={getPosterUrl(movie.poster_path)} alt={movie.title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" priority />
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-1">{movie.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">{movie.release_date?.slice(0, 4)}</span>
            <Badge variant="secondary">⭐ {movie.vote_average.toFixed(1)}</Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
