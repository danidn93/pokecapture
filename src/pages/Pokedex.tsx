import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePokemon } from "@/contexts/PokemonContext";
import PokemonCard from "@/components/PokemonCard";
import NavBar from "@/components/NavBar";
import { Backpack, Frown } from "lucide-react";

const Pokedex = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { getUserCaptures, loading } = usePokemon();

  if (!user) {
    navigate("/login");
    return null;
  }

  const captures = getUserCaptures();
  const captureCount = captures.length;

  // =====================================
  // SISTEMA DE NIVELES
  // =====================================

  const points = profile?.points ?? 0;
  const level = profile?.level ?? 1;

  // nivel actual → puntos requeridos prev/next
  const previousRequired = level === 1 ? 0 : Math.pow(2, level - 2) * 5;
  const nextRequired = Math.pow(2, level - 1) * 5;

  const levelProgress =
    ((points - previousRequired) / (nextRequired - previousRequired)) *
    100;

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

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary mb-4">
              <Backpack className="w-5 h-5" />
              <span className="font-body text-sm">Tu Colección</span>
            </div>

            <h1 className="text-xl font-display text-foreground mb-1">
              MI POKÉDEX
            </h1>

            <p className="text-muted-foreground font-body mb-1">
              Has capturado <b>{captureCount}</b> Pokémon
            </p>

            {/* NIVEL */}
            <div className="mt-4 max-w-xs mx-auto">
              <p className="text-xs text-muted-foreground">
                Nivel de Entrenador: <b>{level}</b>
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {points} pts • Siguiente nivel: {nextRequired} pts
              </p>

              <div className="h-3 mt-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(levelProgress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-pokemon-green to-pokemon-blue rounded-full"
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Progreso: {Math.floor(levelProgress)}%
              </p>
            </div>
          </motion.div>

          {/* GRID */}
          {captures.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            >
              {captures.map((capture, index) =>
                capture.pokemon ? (
                  <motion.div
                    key={capture.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                  >
                    <PokemonCard
                      pokemon={capture.pokemon}
                      capturedAt={capture.captured_at}
                    />
                  </motion.div>
                ) : null
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <Frown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-body text-foreground mb-2">
                Tu Pokédex está vacía
              </h3>
              <p className="text-muted-foreground font-body mb-6">
                ¡Escanea códigos QR para capturar Pokémon!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/scan")}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm"
              >
                IR A ESCANEAR
              </motion.button>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
};

export default Pokedex;
