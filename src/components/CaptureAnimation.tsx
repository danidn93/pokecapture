import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Pokeball from "./Pokeball";
import { Pokemon } from "@/types/pokemon";
import confetti from "canvas-confetti";
import { usePokemon } from "@/contexts/PokemonContext";

interface CaptureAnimationProps {
  pokemon: Pokemon;
  onComplete: (success: boolean) => void;
  alreadyCaptured?: boolean;
}

const CaptureAnimation = ({
  pokemon,
  onComplete,
  alreadyCaptured = false,
}: CaptureAnimationProps) => {

  const [phase, setPhase] = useState<"throw" | "capture" | "fail">("throw");

  const { capturePokemonWithPoints } = usePokemon();

  // Refs para hitbox
  const pokemonRef = useRef<HTMLImageElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  // Posición inicial de la Pokébola (simula distancia)
  const initialPos = { x: 0, y: 260 };

  const [ballPosition, setBallPosition] = useState(initialPos);

  // ------------------------------------
  // UTILS
  // ------------------------------------
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 135,
      spread: 65,
      origin: { y: 0.6 },
      colors: ["#dc2626", "#facc15", "#3b82f6", "#22c55e"],
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-pokemon-yellow";
      case "rare":
        return "text-pokemon-purple";
      case "uncommon":
        return "text-pokemon-blue";
      default:
        return "text-pokemon-green";
    }
  };

  // ------------------------------------
  // DETECCIÓN DE COLISIÓN
  // ------------------------------------
  const checkCollision = () => {
    if (!pokemonRef.current || !ballRef.current) return false;

    const pokeRect = pokemonRef.current.getBoundingClientRect();
    const ballRect = ballRef.current.getBoundingClientRect();

    return !(
      ballRect.right < pokeRect.left ||
      ballRect.left > pokeRect.right ||
      ballRect.bottom < pokeRect.top ||
      ballRect.top > pokeRect.bottom
    );
  };

  // ------------------------------------
  // LANZAMIENTO REAL
  // ------------------------------------
  const handleThrow = async () => {
    await wait(200);

    if (alreadyCaptured) {
      setPhase("fail");
      vibrate(200);
      await wait(1500);
      onComplete(false);
      return;
    }

    if (checkCollision()) {
      // CAPTURADO
      setPhase("capture");
      vibrate([200, 100, 200]);

      triggerConfetti();
      await capturePokemonWithPoints(pokemon);

      await wait(2200);
      onComplete(true);
      return;
    }

    // FALLO → PERMITIR REINTENTOS
    setPhase("fail");
    vibrate(300);

    await wait(900);

    // Volver a intentar automáticamente
    setBallPosition(initialPos);
    setPhase("throw");
  };

  // ------------------------------------
  // UI PRINCIPAL
  // ------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <AnimatePresence mode="wait">

        {/* ==============================
            THROW (LANZAR LA POKÉBOLA)
        =============================== */}
        {phase === "throw" && (
          <motion.div
            key="throw"
            className="flex flex-col items-center relative"
          >
            {/* Pokémon (a ~3 metros visuales) */}
            <motion.img
              ref={pokemonRef}
              src={pokemon.image_url}
              alt={pokemon.name}
              className="w-40 h-40 mb-32" // Pokémon más arriba
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.3 }}
            />

            {/* Pokébola lanzable */}
            <motion.div
              ref={ballRef}
              drag
              dragElastic={0.1}
              dragMomentum={true}
              initial={initialPos}
              animate={ballPosition}
              onDragEnd={handleThrow}
              className="cursor-grab active:cursor-grabbing"
            >
              <Pokeball size={110} />
            </motion.div>

            <p className="mt-10 text-sm text-muted-foreground">
              Lanza la Pokébola hacia el Pokémon 🔥
            </p>
          </motion.div>
        )}

        {/* ==============================
            CAPTURE
        =============================== */}
        {phase === "capture" && (
          <motion.div
            key="capture"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-pokemon-yellow/30 animate-ping" />
              <img
                src={pokemon.image_url}
                alt={pokemon.name}
                className="w-48 h-48 relative z-10"
              />
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <h2 className="text-3xl font-display text-pokemon-yellow mb-2">
                ¡CAPTURADO!
              </h2>
              <p className="text-xl font-body text-foreground">
                {pokemon.name}
              </p>
              <span
                className={`text-sm uppercase tracking-wider ${getRarityColor(
                  pokemon.rarity
                )}`}
              >
                {pokemon.rarity}
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* ==============================
            FAIL → VOLVER A INTENTAR
        =============================== */}
        {phase === "fail" && (
          <motion.div
            key="fail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              animate={{ rotate: [-15, 15, -15, 15, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Pokeball size={100} />
            </motion.div>

            <h2 className="text-xl font-display text-primary mt-6">
              ¡Fallaste!
            </h2>
            <p className="text-muted-foreground font-body">
              Inténtalo de nuevo ⚡
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaptureAnimation;
