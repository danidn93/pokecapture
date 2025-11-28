import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePokemon } from '@/contexts/PokemonContext';
import NavBar from '@/components/NavBar';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();
  const { leaderboard, loading } = usePokemon();

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-hero-gradient pb-24 pt-20 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  const sorted = [...leaderboard].sort((a, b) => b.points - a.points);

  return (
    <>
      <NavBar />

      <div className="min-h-screen bg-hero-gradient pb-24 pt-20">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pokemon-yellow/20 text-pokemon-yellow mb-4">
              <Trophy className="w-5 h-5" />
              <span className="font-body text-sm">Clasificación</span>
            </div>

            <h1 className="text-xl font-display text-foreground mb-2">
              RANKING GLOBAL
            </h1>
            <p className="text-muted-foreground font-body">
              Tabla de puntuación de entrenadores Pokémon
            </p>
          </motion.div>

          {/* Leaderboard */}
          <div className="max-w-md mx-auto space-y-3">
            {sorted.length > 0 ? (
              sorted.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === user?.id;

                // MEDALLAS
                const medalIcon =
                  rank === 1 ? (
                    <Crown className="w-6 h-6 text-yellow-400" />
                  ) : rank === 2 ? (
                    <Medal className="w-6 h-6 text-gray-300" />
                  ) : rank === 3 ? (
                    <Award className="w-6 h-6 text-amber-600" />
                  ) : (
                    <span className="text-sm font-display text-muted-foreground">
                      #{rank}
                    </span>
                  );

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 bg-card/40 backdrop-blur-sm 
                      ${isCurrentUser ? 'ring-2 ring-primary' : 'border-border'}
                    `}
                  >
                    {/* Lugar */}
                    <div className="w-10 flex items-center justify-center">
                      {medalIcon}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Username */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-semibold text-foreground truncate">
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(Tú)</span>
                        )}
                      </h3>
                    </div>

                    {/* PUNTOS */}
                    <div className="flex items-center gap-1">
                      <span className="font-display text-lg text-pokemon-yellow">
                        {entry.points}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-body text-foreground mb-2">
                  Sin puntos aún
                </h3>
                <p className="text-muted-foreground font-body">
                  ¡Sé el primero en ganar puntos!
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
