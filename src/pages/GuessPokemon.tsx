import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import confetti from "canvas-confetti";

export default function GuessPokemon() {
  const { user, profile, refreshProfile } = useAuth();

  const [pokemon, setPokemon] = useState<any>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(3);

  // === COORDENADAS EDITABLES ===
  // Usa porcentajes (0.0 a 1.0)
  const POKEMON_X = 0.20;  // 38% del ancho
  const POKEMON_Y = 0.39;  // 46% del alto

  const TITLE_X = 0.75;    // derecha
  const TITLE_Y = 0.24;

  const INPUT_X = 0.50;    // centrado
  const INPUT_Y = 0.67;    // más abajo

  // === BLOQUEO CAPTURAS ===
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") e.preventDefault();
      if (e.ctrlKey && e.key === "p") e.preventDefault();
    };
    const prevent = (e: any) => e.preventDefault();

    document.addEventListener("keydown", blockKeys);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);

    return () => {
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
    };
  }, []);

  const loadPokemon = async () => {
    setLoading(true);

    const { data } = await supabase.from("guess_pokemon").select("*");
    const guessed = profile?.guessed_pokemon ?? [];
    const remaining = data?.filter((p) => !guessed.includes(p.id)) ?? [];

    if (remaining.length === 0) {
      setPokemon(null);
      setLoading(false);
      return;
    }

    const random = remaining[Math.floor(Math.random() * remaining.length)];

    setPokemon(random);
    setGuess("");
    setFeedback(null);
    setAttempts(3);
    setLoading(false);
  };

  useEffect(() => {
    loadPokemon();
  }, []);

  const checkAnswer = async () => {
    if (!pokemon || !guess.trim()) return;

    const correct =
      pokemon.name.toLowerCase().trim() === guess.toLowerCase().trim();

    if (correct) {
      setFeedback("correct");

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      await supabase
        .from("profiles")
        .update({
          points: (profile?.points ?? 0) + 2,
          guessed_pokemon: [...(profile?.guessed_pokemon ?? []), pokemon.id],
        })
        .eq("id", user?.id);

      await refreshProfile();
      setTimeout(() => loadPokemon(), 1600);
    } else {
      setFeedback("wrong");
      setAttempts((prev) => prev - 1);

      if (attempts - 1 <= 0) {
        setTimeout(() => loadPokemon(), 1200);
      } else {
        setTimeout(() => setFeedback(null), 800);
      }
    }
  };

  return (
    <>
      <NavBar />

      <div
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          backgroundImage: "url('/img/bg-guess.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >

        {/* === POKÉMON CON COORDENADAS EDITABLES === */}
        <motion.img
          src={pokemon?.image_url}
          className="
            absolute
            brightness-0
            drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]
            w-[43vw] max-w-[250px]
          "
          style={{
            left: `${POKEMON_X * 100}%`,
            top: `${POKEMON_Y * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 20,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35 }}
        />

        {/* === TEXTO PNG CON COORDENADAS EDITABLES === */}
        <img
          src="/img/quien-es-ese.png"
          className="absolute w-[50vw] max-w-[270px]"
          style={{
            left: `${TITLE_X * 100}%`,
            top: `${TITLE_Y * 100}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 18,
          }}
        />

        {/* === INPUT + BOTONES CON COORDENADAS EDITABLES === */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${INPUT_X * 100}%`,
            top: `${INPUT_Y * 100}%`,
            transform: "translate(-50%, -50%)",
            width: "100%",
            zIndex: 30,
          }}
        >
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Escribe el nombre…"
            className="
              w-[80%] max-w-[340px]
              p-4 rounded-xl text-center text-lg
              bg-white/90 border border-black/20
            "
            style={{ fontFamily: "Pokemon, sans-serif" }}
          />

          {feedback === "correct" && (
            <p className="mt-3 text-green-400 font-bold">¡Correcto! +2 puntos 🎉</p>
          )}
          {feedback === "wrong" && (
            <p className="mt-3 text-red-500 font-bold">
              Incorrecto — Intentos restantes: {attempts}
            </p>
          )}

          <div className="mt-7 flex gap-4">
            <button
              onClick={checkAnswer}
              className="
                px-8 py-3 rounded-xl font-bold text-white
                bg-[#e63946] text-lg
              "
            >
              Adivinar
            </button>

            <button
              onClick={loadPokemon}
              className="
                px-8 py-3 rounded-xl font-bold text-white
                bg-black/80 text-lg
              "
            >
              Pasar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
