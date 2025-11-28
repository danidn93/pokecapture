import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// ======================
// INTERFACES
// ======================
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

// ⭐ CORREGIDO: Leaderboard basado en POINTS
interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  points: number;
  level: number;
}

interface PokemonContextType {
  pokemons: Pokemon[];
  captures: Capture[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;

  addPokemon: (pokemon: Omit<Pokemon, 'id' | 'created_at'>) => Promise<boolean>;
  deletePokemon: (id: string) => Promise<boolean>;

  capturePokemon: (pokemonId: string) => Promise<boolean>;
  capturePokemonWithPoints: (pokemon: Pokemon) => Promise<boolean>;

  hasUserCaptured: (pokemonId: string) => boolean;
  isPokemonCaptured: (pokemonId: string) => boolean;

  getUserCaptures: () => Capture[];
  getPokemonByQr: (qrCode: string) => Pokemon | undefined;

  refreshData: () => Promise<void>;

  addGuessPokemon: (pokemon: { name: string; image_url: string }) => Promise<boolean>;
  deleteGuessPokemon: (id: string) => Promise<boolean>;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

export const PokemonProvider = ({ children }: { children: ReactNode }) => {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // ===========================
  // Cargar Pokémon
  // ===========================
  const fetchPokemons = async () => {
    const { data, error } = await supabase
      .from('pokemon')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPokemons(data as Pokemon[]);
    }
  };

  // ===========================
  // Cargar Capturas del usuario
  // ===========================
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
      setCaptures(
        data.map((c) => ({
          ...c,
          pokemon: c.pokemon as Pokemon,
        }))
      );
    }
  };

  // ===========================
  // ⭐ NUEVO: Leaderboard basado en POINTS
  // ===========================
  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, points, level')
      .order('points', { ascending: false });

    if (!error && data) {
      const leaderboardData: LeaderboardEntry[] = data.map((p: any) => ({
        user_id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        points: p.points,
        level: p.level,
      }));

      setLeaderboard(leaderboardData);
    }
  };

  // ===========================
  // Recargar datos
  // ===========================
  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPokemons(), fetchCaptures(), fetchLeaderboard()]);
    setLoading(false);
  };

  // Cargar al inicio
  useEffect(() => {
    refreshData();
  }, []);

  // Cuando cambia usuario, recargar capturas
  useEffect(() => {
    if (user) fetchCaptures();
    else setCaptures([]);
  }, [user]);

  // ===========================
  // CRUD Pokémon
  // ===========================
  const addPokemon = async (
    pokemon: Omit<Pokemon, 'id' | 'created_at'>
  ): Promise<boolean> => {
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
      setPokemons((prev) => [...prev, data as Pokemon]);
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
      setPokemons((prev) => prev.filter((p) => p.id !== id));
      setCaptures((prev) => prev.filter((c) => c.pokemon_id !== id));
      return true;
    }
    return false;
  };

  // ===========================
  // Adivinanza Pokémon (QR)
  // ===========================
  const addGuessPokemon = async (pokemon: {
    name: string;
    image_url: string;
  }): Promise<boolean> => {
    const { data, error } = await supabase
      .from('guess_pokemon')
      .insert({
        name: pokemon.name,
        image_url: pokemon.image_url,
      })
      .select()
      .single();

    return !error && !!data;
  };

  const deleteGuessPokemon = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('guess_pokemon')
      .delete()
      .eq('id', id);

    return !error;
  };

  // ===========================
  // Capturar Pokémon (simple)
  // ===========================
  const capturePokemon = async (pokemonId: string): Promise<boolean> => {
    if (!user || isPokemonCaptured(pokemonId)) return false;

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
      setCaptures((prev) => [
        ...prev,
        { ...data, pokemon: data.pokemon as Pokemon },
      ]);
      await fetchLeaderboard();
      return true;
    }
    return false;
  };

  // ===========================
  // ⭐ Capturar Pokémon con puntos
  // ===========================
  const capturePokemonWithPoints = async (
    pokemon: Pokemon
  ): Promise<boolean> => {
    if (!user) return false;

    if (captures.some((c) => c.pokemon_id === pokemon.id)) return false;

    // Insertar captura
    const { data, error } = await supabase
      .from('captures')
      .insert({
        user_id: user.id,
        pokemon_id: pokemon.id,
        captured_at: new Date().toISOString(),
      })
      .select(`
        *,
        pokemon:pokemon_id (*)
      `)
      .single();

    if (error || !data) return false;

    setCaptures((prev) => [
      ...prev,
      { ...data, pokemon: data.pokemon as Pokemon },
    ]);

    // Calcular puntos por rareza
    let gained = 5;
    if (pokemon.rarity === 'uncommon') gained = 8;
    if (pokemon.rarity === 'rare') gained = 12;
    if (pokemon.rarity === 'legendary') gained = 20;

    const { data: prof } = await supabase
      .from('profiles')
      .select('points, level')
      .eq('id', user.id)
      .single();

    if (!prof) return true;

    const newPoints = prof.points + gained;

    // Subida de nivel
    let newLevel = prof.level;
    const nextRequired = Math.pow(2, prof.level - 1) * 5;
    if (newPoints >= nextRequired) newLevel++;

    // Guardar cambios
    await supabase
      .from('profiles')
      .update({
        points: newPoints,
        level: newLevel,
      })
      .eq('id', user.id);

    await fetchLeaderboard();
    return true;
  };

  // ===========================
  // Helpers
  // ===========================
  const hasUserCaptured = (pokemonId: string): boolean => {
    return captures.some((c) => c.pokemon_id === pokemonId);
  };

  const isPokemonCaptured = (pokemonId: string): boolean => {
    return captures.some((c) => c.pokemon_id === pokemonId);
  };

  const getUserCaptures = (): Capture[] => captures;

  const getPokemonByQr = (qrCode: string): Pokemon | undefined => {
    return pokemons.find((p) => p.qr_code === qrCode);
  };

  // ===========================
  // RETURN PROVIDER
  // ===========================
  return (
    <PokemonContext.Provider
      value={{
        pokemons,
        captures,
        leaderboard,
        loading,
        addPokemon,
        deletePokemon,
        addGuessPokemon,
        deleteGuessPokemon,
        capturePokemon,
        capturePokemonWithPoints,
        hasUserCaptured,
        isPokemonCaptured,
        getUserCaptures,
        getPokemonByQr,
        refreshData,
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemon = () => {
  const context = useContext(PokemonContext);
  if (!context) throw new Error('usePokemon must be used within a PokemonProvider');
  return context;
};
