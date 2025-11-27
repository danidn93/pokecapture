export interface Pokemon {
  id: string;
  name: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  qr_code: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Capture {
  id: string;
  user_id: string;
  pokemon_id: string;
  captured_at: string;
  pokemon?: Pokemon;
  user?: User;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  capture_count: number;
}
