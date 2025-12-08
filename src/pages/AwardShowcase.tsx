import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const avatars = [
  "/avatars/agatha.png",
  "/avatars/ash.png",
  "/avatars/brock.png",
  "/avatars/bruno.png",
  "/avatars/dawn.png",
  "/avatars/erika.png",
  "/avatars/giovanni.png",
  "/avatars/may.png",
  "/avatars/misty.png",
  "/avatars/sabrina.png",
  "/avatars/serena.png",
  "/avatars/surge.png",
];

// 🔊 sonidos
const playSound = (file: string, volume = 0.5) => {
  const audio = new Audio(file);
  audio.volume = volume;
  audio.currentTime = 0;

  audio.play().catch(() => {});
};

// 📝 Máquina de escribir segura
const typeText = (
  text: string,
  set: (s: string) => void,
  speed = 110,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  let i = 0;

  if (intervalRef.current) clearInterval(intervalRef.current);

  intervalRef.current = setInterval(() => {
    set(text.slice(0, i));
    playSound("/sounds/type.mp3", 0.25);
    i++;

    if (i > text.length && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, speed);
};

const AwardShowcase = () => {
  const [awards, setAwards] = useState([]);
  const [selected, setSelected] = useState<any>(null);
  const [winner, setWinner] = useState<any>(null);
  const [typedText, setTypedText] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);

  // refs
  const spinRef = useRef<NodeJS.Timeout | null>(null);
  const typeRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar premios
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("awards").select("*");
      setAwards(data || []);
    };
    load();
  }, []);

  // Limpieza total al desmontar
  useEffect(() => {
    return () => {
      if (spinRef.current) clearInterval(spinRef.current);
      if (typeRef.current) clearInterval(typeRef.current);
    };
  }, []);

  const startPresentation = async (award: any) => {
    // reiniciar todo
    if (spinRef.current) clearInterval(spinRef.current);
    if (typeRef.current) clearInterval(typeRef.current);

    setSelected(award);
    setWinner(null);
    setTypedText("");
    setStopped(false);
    setCurrentAvatar(null);

    const { data: win } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", award.winner_user_id)
      .single();

    setWinner(win);

    typeText(award.description, setTypedText, 110, typeRef);

    // ruleta rápida
    spinRef.current = setInterval(() => {
      setCurrentAvatar(
        avatars[Math.floor(Math.random() * avatars.length)]
      );
    }, 70);

    playSound("/sounds/spin.wav", 0.4);
  };

  const stopRoulette = async () => {
    if (!winner) return;

    playSound("/sounds/stop.wav", 0.8);

    if (spinRef.current) clearInterval(spinRef.current);

    let delay = 70;
    const slowdown = 1.25;

    const smooth = () => {
      setCurrentAvatar(
        avatars[Math.floor(Math.random() * avatars.length)]
      );
      playSound("/sounds/spin.wav", 0.15);

      delay *= slowdown;

      if (delay < 450) {
        setTimeout(smooth, delay);
      } else {
        setTimeout(async () => {
          setCurrentAvatar(winner.avatar_url);
          setStopped(true);

          playSound("/sounds/winner.wav", 0.9);

          await supabase
            .from("awards")
            .update({ delivered: true })
            .eq("id", selected.id);

        }, delay);
      }
    };

    smooth();
  };

  // ================================
  // LISTA DE PREMIOS (GRID 3 COLUMNAS)
  // ================================
  if (!selected) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <h1 className="font-display text-3xl mb-6 text-center">
          Premios disponibles
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {awards.map((award) => (
            <div
              key={award.id}
              className="p-6 border border-white/20 rounded-xl cursor-pointer 
                         hover:border-yellow-400 bg-white/10 backdrop-blur-md text-center"
              onClick={() => startPresentation(award)}
            >
              <img
                src={award.pokemon_gif}
                className="w-24 h-24 mx-auto mb-3"
              />
              <h3 className="font-display text-xl text-yellow-400">
                {award.category}
              </h3>
              <p className="text-xs opacity-70 mt-2">
                {award.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================================
  // PRESENTACIÓN DEL PREMIO
  // ================================
  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center relative
                 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/backgrounds/stadium.jpg')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* 🔙 Botón atrás */}
      <button
        onClick={() => {
          if (spinRef.current) clearInterval(spinRef.current);
          if (typeRef.current) clearInterval(typeRef.current);
          setSelected(null);
        }}
        className="absolute top-6 left-6 bg-white/80 text-black px-4 py-2 rounded-lg font-display"
      >
        ← Atrás
      </button>

      {/* POKÉMON */}
      <motion.img
        src={selected.pokemon_gif}
        className="w-56 h-56"
        animate={{ y: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      <h1 className="font-display text-3xl mt-6 bg-white/70 text-black px-6 py-3 rounded-lg">
        {selected.category}
      </h1>

      <p className="font-['Press_Start_2P'] text-xs sm:text-sm max-w-lg text-center mt-6 
                  leading-relaxed bg-white/70 text-black p-4 rounded-lg">
        {typedText}
      </p>

      {/* RULETA */}
      <div className="mt-10 w-40 h-40 flex items-center justify-center">
        {currentAvatar && (
          <img
            src={currentAvatar}
            className="w-32 h-32 rounded-full border-4 border-yellow-400"
          />
        )}
      </div>

      {/* BOTÓN DETENER o GANADOR */}
      {!stopped ? (
        <button
          onClick={stopRoulette}
          className="mt-8 px-6 py-3 bg-red-600 rounded-xl font-display text-white text-xl"
        >
          DETENER
        </button>
      ) : (
        <h2 className="font-display text-3xl mt-6 bg-white/70 text-black px-6 py-3 rounded-lg">
          {selected.winner_display_name}
        </h2>
      )}
    </div>
  );
};

export default AwardShowcase;
