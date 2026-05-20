import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { fetchMovie, getPosterUrl } from '@/lib/tmdb';
import FavoriteButton from '@/components/FavoriteButton';

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MovieDetailPageProps) {
  const { id } = await params;
  const movie = await fetchMovie(id);
  return {
    title: `${movie.title} — MovieApp`,
    description: movie.overview
  };
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params;

  let movie;
  try {
    movie = await fetchMovie(id);
  } catch {
    notFound();
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="relative w-full md:w-64 aspect-2/3 shrink-0">
        <Image src={getPosterUrl(movie.poster_path, 'w342')} alt={movie.title} fill className="object-cover rounded-lg" priority />
      </div>

      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold">{movie.title}</h1>

        <div className="flex items-center gap-3 text-muted-foreground">
          <span>{movie.release_date?.slice(0, 4)}</span>
          <span>•</span>
          <span>{movie.runtime}분</span>
          <span>•</span>
          <span>⭐ {movie.vote_average.toFixed(1)}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {movie.genres.map((genre) => (
            <Badge key={genre.id} variant="outline">
              {genre.name}
            </Badge>
          ))}
        </div>

        <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
        <FavoriteButton movie={movie} />
      </div>
    </div>
  );
}
