import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import Pokeball from "./Pokeball";
import CaptureRing from "./CaptureRing";
import PokeballSparkles from "./PokeballSparkles";
import { Pokemon } from "@/types/pokemon";
import confetti from "canvas-confetti";
import { usePokemon } from "@/contexts/PokemonContext";

/* ============================================================
   CONSTANTES
============================================================ */
const GRAVITY = 0.55; // caída parabólica estilo Pokémon GO
const THROW_FORCE_MULTIPLIER = 0.28;
const MAX_SPIN = 10; // cuanto spin máximo acumulable
const SPIN_DECAY = 0.03; // pérdida gradual durante el vuelo

// Probabilidades de esquivar por rareza
const DODGE_CHANCE: Record<string, number> = {
  common: 0.05,
  uncommon: 0.1,
  rare: 0.15,
  legendary: 0.2,
};

/* ============================================================
   INTERFAZ
============================================================ */
interface CaptureAnimationProps {
  pokemon: Pokemon;
  onComplete: (success: boolean) => void;
  alreadyCaptured?: boolean;
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */
const CaptureAnimation = ({
  pokemon,
  onComplete,
  alreadyCaptured = false,
}: CaptureAnimationProps) => {

  /* ============================================================
     ESTADOS Y REFS
  ============================================================ */

  const [phase, setPhase] = useState<"aim" | "throw" | "capture" | "fail">("aim");

  const pokemonRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  const { capturePokemonWithPoints } = usePokemon();

  // Pokébola
  const initialBall = { x: 0, y: 260 };
  const [ballPos, setBallPos] = useState(initialBall);
  const velocity = useRef({ x: 0, y: 0 });

  // SPIN — curveball Pokémon GO
  const spinPower = useRef(0);  
  const spinDirection = useRef(1); // 1 clockwise, -1 counterclockwise
  const lastDrag = useRef<{ x: number; y: number } | null>(null);

  // Círculo de captura
  const [ringProgress, setRingProgress] = useState(1); // 1 → grande, 0 → cerrado

  // Control del ciclo animado
  const requestRef = useRef<number | null>(null);

  // Movimiento del Pokémon
  const [pokeOffset, setPokeOffset] = useState(0);
  const [pokeJump, setPokeJump] = useState(0);

  /* ============================================================
     UTILS
  ============================================================ */

  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const vibrate = (p: any) => navigator.vibrate?.(p);

  const triggerConfetti = () => {
    confetti({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#facc15", "#ef4444", "#3b82f6", "#22c55e"],
    });
  };

  const getThrowGrade = () => {
    if (ringProgress > 0.65) return "Nice";
    if (ringProgress > 0.35) return "Great";
    return "Excellent";
  };

  const chance = (p: number) => Math.random() < p;

  /* ============================================================
     DETECTAR COLISIÓN
  ============================================================ */

  const checkCollision = () => {
    const poke = pokemonRef.current?.getBoundingClientRect();
    const ball = ballRef.current?.getBoundingClientRect();

    if (!poke || !ball) return false;

    return !(
      ball.right < poke.left ||
      ball.left > poke.right ||
      ball.bottom < poke.top ||
      ball.top > poke.bottom
    );
  };

  /* ============================================================
     MOVIMIENTO DEL POKÉMON: lados + saltos + esquivas
  ============================================================ */

  useEffect(() => {
    let t = 0;

    const loop = () => {
      t += 0.03;

      // Movimiento lateral
      setPokeOffset(Math.sin(t) * 20);

      // Saltos
      setPokeJump(Math.abs(Math.sin(t * 2)) * 15);

      // Esquivas según rareza
      if (chance(DODGE_CHANCE[pokemon.rarity] || 0)) {
        setPokeOffset((Math.random() - 0.5) * 60);
      }

      requestAnimationFrame(loop);
    };

    loop();
  }, [pokemon.rarity]);

  /* ============================================================
     ANIMACIÓN DE FÍSICA (LANZAMIENTO)
  ============================================================ */

  const animateThrow = useCallback(() => {
    setBallPos((prev) => {
      let nextX = prev.x + velocity.current.x;
      let nextY = prev.y + velocity.current.y;

      // Aplicar gravedad
      velocity.current.y += GRAVITY;

      // Aplicar curvatura por spin
      if (spinPower.current > 0) {
        nextX += spinDirection.current * spinPower.current * 0.3;
        spinPower.current = Math.max(0, spinPower.current - SPIN_DECAY);
      }

      // Colisión con Pokémon
      if (checkCollision()) {
        cancelAnimationFrame(requestRef.current!);
        handleHit();
        return prev;
      }

      // Si cae al piso
      if (nextY > 300) {
        cancelAnimationFrame(requestRef.current!);
        handleMiss();
        return prev;
      }

      return { x: nextX, y: nextY };
    });

    requestRef.current = requestAnimationFrame(animateThrow);
  }, []);

  /* ============================================================
     MANEJO DEL DRAG (CARGA DE SPIN)
  ============================================================ */

  const handleDrag = (e: any, info: any) => {
    if (!lastDrag.current) {
      lastDrag.current = { x: info.point.x, y: info.point.y };
      return;
    }

    const dx = info.point.x - lastDrag.current.x;
    const dy = info.point.y - lastDrag.current.y;

    // Determinar giro
    const cross = dx * dy;
    spinDirection.current = cross > 0 ? 1 : -1;

    // Acumular spin
    spinPower.current = Math.min(MAX_SPIN, spinPower.current + Math.abs(dx + dy) * 0.01);

    lastDrag.current = { x: info.point.x, y: info.point.y };
  };

  /* ============================================================
     MANEJO DEL LANZAMIENTO (dragEnd)
  ============================================================ */

  const handleThrow = async (e: any, info: any) => {
    lastDrag.current = null;

    const forceX = info.velocity.x * THROW_FORCE_MULTIPLIER;
    const forceY = info.velocity.y * THROW_FORCE_MULTIPLIER;

    velocity.current = {
      x: forceX,
      y: Math.min(forceY, -10),
    };

    setPhase("throw");
    requestRef.current = requestAnimationFrame(animateThrow);
  };

  /* ============================================================
     HIT (CAPTURA)
  ============================================================ */

  const handleHit = async () => {
    vibrate([100, 50, 100]);

    const grade = getThrowGrade();

    setPhase("capture");
    triggerConfetti();

    await capturePokemonWithPoints(pokemon);

    await wait(1600);

    onComplete(true);
  };

  /* ============================================================
     MISS (FALLO)
  ============================================================ */

  const handleMiss = async () => {
    vibrate([200]);

    setPhase("fail");

    await wait(800);

    // Reset
    setBallPos(initialBall);
    velocity.current = { x: 0, y: 0 };
    spinPower.current = 0;
    setPhase("aim");
  };

  /* ============================================================
     ANIMACIÓN DE CIERRE DEL CÍRCULO
  ============================================================ */

  useEffect(() => {
    let t = 0;
    let active = true;

    const ringLoop = () => {
      if (!active) return;

      t += 0.016;

      // Tiempo total: 2 segundos
      let p = 1 - (t / 2);

      setRingProgress(Math.max(0, p));

      if (p <= 0) t = 0;

      requestAnimationFrame(ringLoop);
    };

    ringLoop();

    return () => {
      active = false;
    };
  }, []);

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <AnimatePresence mode="wait">

        {phase !== "capture" && (
          <motion.div
            className="absolute top-20 flex flex-col items-center"
            animate={{
              x: pokeOffset,
              y: -pokeJump,
            }}
            transition={{ type: "spring", stiffness: 50 }}
            ref={pokemonRef}
          >
            {/* Pokémon */}
            <img
              src={pokemon.image_url}
              alt={pokemon.name}
              className="w-40 h-40 select-none"
            />

            {/* Círculo de captura */}
            <CaptureRing
              rarity={pokemon.rarity}
              progress={ringProgress}
              size={150}
            />
          </motion.div>
        )}

        {/* AIM — Modo de puntería antes de soltar */}
        {phase === "aim" && (
          <motion.div
            className="absolute"
            ref={ballRef}
            drag
            dragElastic={0.12}
            dragMomentum={true}
            onDrag={handleDrag}
            onDragEnd={handleThrow}
            animate={ballPos}
          >
            <div className="relative">
              <Pokeball size={110} />
              <PokeballSparkles spinPower={spinPower.current} />
            </div>
          </motion.div>
        )}

        {/* FAIL */}
        {phase === "fail" && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Pokeball size={120} />
            <p className="text-center mt-4 text-white text-xl font-bold">
              ¡Fallaste!
            </p>
          </motion.div>
        )}

        {/* CAPTURE */}
        {phase === "capture" && (
          <motion.div
            className="absolute flex flex-col items-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <img
              src={pokemon.image_url}
              className="w-48 h-48 drop-shadow-xl"
              alt=""
            />

            <motion.p
              className="text-yellow-300 text-3xl font-bold mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ¡Capturado!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaptureAnimation;
