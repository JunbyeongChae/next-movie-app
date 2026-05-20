export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

// MovieDetail은 Movie의 모든 필드를 그대로 가져오면서 상세 페이지에서만 필요한 필드를 추가합니다.
// extends를 쓰면 Movie의 필드를 중복 선언하지 않아도 되고,
// Movie 타입이 변경될 때 MovieDetail도 자동으로 반영됩니다.
export interface MovieDetail extends Movie {
  genres: Genre[];
  runtime: number;
}

export interface Genre {
  id: number;
  name: string;
}
