import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Pokemon {
  id: string;
  name: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  qr_code: string;
  created_at: string;
}

interface Capture {
  id: string;
  user_id: string;
  pokemon_id: string;
  captured_at: string;
  pokemon?: Pokemon;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  capture_count: number;
}

interface PokemonContextType {
  pokemons: Pokemon[];
  captures: Capture[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  addPokemon: (pokemon: Omit<Pokemon, 'id' | 'created_at'>) => Promise<boolean>;
  deletePokemon: (id: string) => Promise<boolean>;
  capturePokemon: (pokemonId: string) => Promise<boolean>;
  hasUserCaptured: (pokemonId: string) => boolean;
  isPokemonCaptured: (pokemonId: string) => boolean;
  getUserCaptures: () => Capture[];
  getPokemonByQr: (qrCode: string) => Pokemon | undefined;
  refreshData: () => Promise<void>;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

export const PokemonProvider = ({ children }: { children: ReactNode }) => {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPokemons = async () => {
    const { data, error } = await supabase
      .from('pokemon')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setPokemons(data as Pokemon[]);
    }
  };

  const fetchCaptures = async () => {
    if (!user) {
      setCaptures([]);
      return;
    }

    const { data, error } = await supabase
      .from('captures')
      .select(`
        *,
        pokemon:pokemon_id (*)
      `)
      .eq('user_id', user.id);
    
    if (!error && data) {
      setCaptures(data.map(c => ({
        ...c,
        pokemon: c.pokemon as Pokemon,
      })));
    }
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('captures')
      .select(`
        user_id,
        profiles:user_id (
          username,
          avatar_url
        )
      `);
    
    if (!error && data) {
      // Group captures by user
      const userCaptures: Record<string, { username: string; avatar_url?: string; count: number }> = {};
      
      data.forEach((capture: any) => {
        const userId = capture.user_id;
        if (!userCaptures[userId]) {
          userCaptures[userId] = {
            username: capture.profiles?.username || 'Unknown',
            avatar_url: capture.profiles?.avatar_url,
            count: 0,
          };
        }
        userCaptures[userId].count++;
      });
      
      const leaderboardData: LeaderboardEntry[] = Object.entries(userCaptures).map(([userId, data]) => ({
        user_id: userId,
        username: data.username,
        avatar_url: data.avatar_url,
        capture_count: data.count,
      }));
      
      leaderboardData.sort((a, b) => b.capture_count - a.capture_count);
      setLeaderboard(leaderboardData);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPokemons(), fetchCaptures(), fetchLeaderboard()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPokemons();
    fetchLeaderboard();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchCaptures();
    } else {
      setCaptures([]);
    }
  }, [user]);

  const addPokemon = async (pokemon: Omit<Pokemon, 'id' | 'created_at'>): Promise<boolean> => {
    const { data, error } = await supabase
      .from('pokemon')
      .insert({
        name: pokemon.name,
        image_url: pokemon.image_url,
        rarity: pokemon.rarity,
        qr_code: pokemon.qr_code,
      })
      .select()
      .single();
    
    if (!error && data) {
      setPokemons(prev => [...prev, data as Pokemon]);
      return true;
    }
    return false;
  };

  const deletePokemon = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('pokemon')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setPokemons(prev => prev.filter(p => p.id !== id));
      setCaptures(prev => prev.filter(c => c.pokemon_id !== id));
      return true;
    }
    return false;
  };

  const capturePokemon = async (pokemonId: string): Promise<boolean> => {
    if (!user || isPokemonCaptured(pokemonId)) {
      return false;
    }

    const { data, error } = await supabase
      .from('captures')
      .insert({
        user_id: user.id,
        pokemon_id: pokemonId,
      })
      .select(`
        *,
        pokemon:pokemon_id (*)
      `)
      .single();
    
    if (!error && data) {
      setCaptures(prev => [...prev, {
        ...data,
        pokemon: data.pokemon as Pokemon,
      }]);
      await fetchLeaderboard();
      return true;
    }
    return false;
  };

  const hasUserCaptured = (pokemonId: string): boolean => {
    return captures.some(c => c.pokemon_id === pokemonId);
  };

  const isPokemonCaptured = (pokemonId: string): boolean => {
    return captures.some(c => c.pokemon_id === pokemonId);
  };

  const getUserCaptures = (): Capture[] => {
    return captures;
  };

  const getPokemonByQr = (qrCode: string): Pokemon | undefined => {
    return pokemons.find(p => p.qr_code === qrCode);
  };

  return (
    <PokemonContext.Provider value={{
      pokemons,
      captures,
      leaderboard,
      loading,
      addPokemon,
      deletePokemon,
      capturePokemon,
      hasUserCaptured,
      isPokemonCaptured,
      getUserCaptures,
      getPokemonByQr,
      refreshData,
    }}>
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemon = () => {
  const context = useContext(PokemonContext);
  if (context === undefined) {
    throw new Error('usePokemon must be used within a PokemonProvider');
  }
  return context;
};
