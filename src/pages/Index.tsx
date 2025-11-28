import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import Pokeball from '@/components/Pokeball';
import { Scan, Trophy, Sparkles, Settings } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-hero-gradient pb-24 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              className="inline-block mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Pokeball size={80} />
            </motion.div>
            
            <h1 className="text-2xl sm:text-3xl font-display text-pokemon-yellow mb-4 leading-relaxed">
              ¡Bienvenido,
              <br />
              {profile?.username || 'Entrenador'}!
            </h1>
            
            <p className="text-muted-foreground font-body text-lg">
              ¡Sal a capturar Pokemon!
            </p>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid gap-4 max-w-md mx-auto">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/scan')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow-red"
            >
              <div className="p-3 rounded-xl bg-white/20">
                <Scan className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="font-display text-sm mb-1">ESCANEAR QR</h3>
                <p className="font-body text-sm opacity-80">
                  Captura nuevos Pokemon
                </p>
              </div>
              <Sparkles className="w-6 h-6 ml-auto animate-pulse" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/pokedex')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground"
            >
              <div className="p-3 rounded-xl bg-white/20">
                <img 
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif"
                  alt="Pokemon"
                  className="w-8 h-8"
                />
              </div>
              <div className="text-left">
                <h3 className="font-display text-sm mb-1">MI POKÉDEX</h3>
                <p className="font-body text-sm opacity-80">
                  Ver tus Pokemon capturados
                </p>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/leaderboard')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-pokemon-yellow/90 to-pokemon-yellow/70 text-background"
            >
              <div className="p-3 rounded-xl bg-black/20">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="font-display text-sm mb-1">RANKING</h3>
                <p className="font-body text-sm opacity-80">
                  ¿Quién tiene más Pokemon?
                </p>
              </div>
            </motion.button>

            {isAdmin && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/admin')}
                className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white"
              >
                <div className="p-3 rounded-xl bg-white/20">
                  <Settings className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="font-display text-sm mb-1">ADMIN</h3>
                  <p className="font-body text-sm opacity-80">
                    Panel de administración
                  </p>
                </div>
              </motion.button>
            )}

            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/guess')}
              className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white"
            >
              <div className="p-3 rounded-xl bg-white/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="font-display text-sm mb-1">¿QUIÉN ES ESE POKÉMON?</h3>
                <p className="font-body text-sm opacity-80">
                  Gana puntos extra adivinando
                </p>
              </div>
            </motion.button>

          </div>

          {/* Floating Pokemon decoration */}
          <motion.div
            className="fixed bottom-32 right-4 opacity-30 pointer-events-none"
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <img 
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif"
              alt=""
              className="w-16 h-16"
            />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Index;
