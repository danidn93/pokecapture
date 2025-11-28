import { useState, useEffect } from "react";
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
  const [phase, setPhase] = useState<
    "throw" | "shake" | "capture" | "fail"
  >("throw");

  const { capturePokemonWithPoints } = usePokemon();

  // ------------------------------------
  // 🔥 EFECTO PRINCIPAL
  // ------------------------------------
  useEffect(() => {
    const sequence = async () => {
      // 1️⃣ Fase de Lanzamiento (Throw)
      await wait(600);

      if (alreadyCaptured) {
        // Caso de falla inmediata
        setPhase("fail");
        vibrate(200);

        await wait(1500);
        onComplete(false);
        return;
      }

      // 2️⃣ Fase de Sacudidas (Shake x3)
      setPhase("shake");

      for (let i = 0; i < 3; i++) {
        vibrate(300);
        await wait(700);
      }

      // 3️⃣ Fase de captura
      setPhase("capture");
      vibrate([200, 100, 200]);

      triggerConfetti();

      // ⭐ Nuevo: sumar puntos automáticamente
      await capturePokemonWithPoints(pokemon);

      await wait(2200);
      onComplete(true);
    };

    sequence();
  }, [alreadyCaptured, onComplete, pokemon, capturePokemonWithPoints]);

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
      particleCount: 120,
      spread: 70,
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
  // UI PRINCIPAL
  // ------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {/* 1️⃣ Throw */}
        {phase === "throw" && (
          <motion.div
            key="throw"
            initial={{ y: "100vh", scale: 0.5 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <motion.img
              src={pokemon.image_url}
              alt={pokemon.name}
              className="w-40 h-40 mb-8"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 1.3 }}
            />
            <Pokeball size={110} />
          </motion.div>
        )}

        {/* 2️⃣ Shake x3 */}
        {phase === "shake" && (
          <motion.div key="shake" className="flex flex-col items-center">
            <motion.div
              animate={{
                rotate: [-15, 15, -15, 15, 0],
              }}
              transition={{
                duration: 0.7,
                repeat: 3,
                ease: "easeInOut",
              }}
            >
              <Pokeball size={110} isShaking />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: 3, duration: 0.7 }}
              className="mt-6 text-lg text-muted-foreground font-body"
            >
              Sacudiéndose...
            </motion.p>
          </motion.div>
        )}

        {/* 3️⃣ CAPTURE */}
        {phase === "capture" && (
          <motion.div
            key="capture"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            {/* Explosión de luz */}
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

        {/* 4️⃣ FAIL */}
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
              ¡YA FUE CAPTURADO!
            </h2>
            <p className="text-muted-foreground font-body">
              {pokemon.name} ya tiene dueño
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaptureAnimation;
