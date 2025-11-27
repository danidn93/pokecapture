import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePokemon } from '@/contexts/PokemonContext';
import NavBar from '@/components/NavBar';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();
  const { leaderboard, loading } = usePokemon();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-pokemon-yellow" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-sm font-display text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-pokemon-yellow/20 to-pokemon-yellow/5 border-pokemon-yellow/50';
      case 2:
        return 'bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/30';
      default:
        return 'bg-card/50 border-border';
    }
  };

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
              Los mejores entrenadores Pokemon
            </p>
          </motion.div>

          {/* Leaderboard List */}
          <div className="max-w-md mx-auto space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === user?.id;
                
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 ${getRankStyles(rank)} ${
                      isCurrentUser ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="w-10 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-semibold text-foreground truncate">
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(Tú)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.capture_count} Pokemon capturados
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <img 
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif"
                        alt=""
                        className="w-8 h-8"
                      />
                      <span className="font-display text-lg text-pokemon-yellow">
                        {entry.capture_count}
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
                  Sin clasificación aún
                </h3>
                <p className="text-muted-foreground font-body">
                  ¡Sé el primero en capturar Pokemon!
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
