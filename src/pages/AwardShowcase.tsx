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

// sonido simple
const playSound = (file: string, volume = 0.5) => {
  const audio = new Audio(file);
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

// máquina de escribir (multi seguro)
const typeText = (
  text: string,
  setter: (t: string) => void,
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  speed = 95
) => {
  let i = 0;

  if (intervalRef.current) clearInterval(intervalRef.current);

  intervalRef.current = setInterval(() => {
    setter(text.slice(0, i));
    playSound("/sounds/type.mp3", 0.3);
    i++;
    if (i > text.length) {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
    }
  }, speed);
};

const AwardShowcase = () => {
  const [awards, setAwards] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const [winners, setWinners] = useState<any[]>([]);
  const [typedText, setTypedText] = useState("");

  const [rouletteFrames, setRouletteFrames] = useState<string[]>([]);
  const [stopped, setStopped] = useState(false);

  // refs para intervalos
  const spinRef = useRef<NodeJS.Timeout | null>(null);
  const typeRef = useRef<NodeJS.Timeout | null>(null);

  // cargar premios
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("awards").select("*");
      setAwards(data || []);
    };
    load();
  }, []);

  // cleanup global
  useEffect(() => {
    return () => {
      if (spinRef.current) clearInterval(spinRef.current);
      if (typeRef.current) clearInterval(typeRef.current);
    };
  }, []);

  const startPresentation = async (award: any) => {
    // limpiar timers
    if (spinRef.current) clearInterval(spinRef.current);
    if (typeRef.current) clearInterval(typeRef.current);

    setSelected(award);
    setStopped(false);
    setTypedText("");
    setWinners([]);
    setRouletteFrames([]);

    // cargar ganadores reales
    const { data: rows } = await supabase
      .from("award_winners")
      .select("*, profiles:profiles(*)")
      .eq("award_id", award.id);

    const winList = rows || [];

    setWinners(winList);

    // inicializar ruleta: un frame por ganador
    setRouletteFrames(winList.map(() => avatars[0]));

    // escribir descripción
    typeText(award.description, setTypedText, typeRef);

    // iniciar ruleta -> simultánea para todos
    spinRef.current = setInterval(() => {
      setRouletteFrames((prev) =>
        prev.map(
          () => avatars[Math.floor(Math.random() * avatars.length)]
        )
      );
      playSound("/sounds/spin.wav", 0.15);
    }, 70);

    playSound("/sounds/spin.wav", 0.4);
  };

const stopRoulette = async () => {
  if (!winners.length) return;

  playSound("/sounds/stop.wav", 0.8);

  // detener ruleta rápida
  if (spinRef.current) clearInterval(spinRef.current);

  let delay = 70;
  const slowdown = 1.25;

  const smoothStop = () => {
    setRouletteFrames(prev =>
      prev.map(() => avatars[Math.floor(Math.random() * avatars.length)])
    );

    playSound("/sounds/spin.wav", 0.2);

    delay *= slowdown;

    if (delay < 450) {
      setTimeout(smoothStop, delay);
    } else {
      setTimeout(async () => {
        // mostrar los ganadores reales
        setRouletteFrames(winners.map(w => w.profiles.avatar_url));
        setStopped(true);
        playSound("/sounds/winner.wav", 1);

        // 1️⃣ marcar premio como entregado (general)
        await supabase
          .from("awards")
          .update({ delivered: true })
          .eq("id", selected.id);

        // 2️⃣ marcar TODOS LOS GANADORES como "delivered = true" en award_winners
        await supabase
          .from("award_winners")
          .update({ delivered: true })    // debes agregar esta columna
          .eq("award_id", selected.id);

      }, delay);
    }
  };

  smoothStop();
};

  // =============================
  // LISTA DE PREMIOS
  // =============================
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
              <img src={award.pokemon_gif} className="w-24 h-24 mx-auto mb-3" />
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

  // =============================
  // PRESENTACIÓN DEL PREMIO
  // =============================
  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center relative
                 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/backgrounds/stadium.jpg')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* 🔙 ATRÁS */}
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

      {/* CATEGORÍA */}
      <h1 className="font-display text-3xl mt-6 bg-white/70 text-black px-6 py-3 rounded-lg">
        {selected.category}
      </h1>

      {/* DESCRIPCIÓN */}
      <p className="font-['Press_Start_2P'] text-xs sm:text-sm max-w-lg 
                    text-center mt-6 bg-white/70 text-black p-4 rounded-lg leading-relaxed">
        {typedText}
      </p>

      {/* MULTIPLES RULETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
        {rouletteFrames.map((frame, i) => (
          <div key={i} className="flex flex-col items-center">
            <img
              src={frame}
              className="w-32 h-32 rounded-full border-4 border-yellow-400 mb-3"
            />
            {stopped && (
              <p className="font-display text-xl bg-white/70 text-black px-4 py-2 rounded-lg">
                {winners[i].display_name}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* BOTÓN DETENER */}
      {!stopped && (
        <button
          onClick={stopRoulette}
          className="mt-10 px-6 py-3 bg-red-600 rounded-xl font-display text-xl"
        >
          DETENER
        </button>
      )}
    </div>
  );
};

export default AwardShowcase;
