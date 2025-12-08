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

  audio.play().catch((err) => {
    console.warn("El navegador bloqueó el sonido:", err);
  });
};


// máquina de escribir
const typeText = (text: string, set: (s: string) => void, speed = 110) => {
  let i = 0;
  const timer = setInterval(() => {
    set(text.slice(0, i));
    playSound("/sounds/type.mp3", 0.3); // sonido tipo gameboy
    i++;
    if (i > text.length) clearInterval(timer);
  }, speed);
};

const AwardShowcase = () => {
  const [awards, setAwards] = useState([]);
  const [selected, setSelected] = useState<any>(null);
  const [winner, setWinner] = useState<any>(null);

  const [typedText, setTypedText] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  const [stopped, setStopped] = useState(false);

  // refs → solución REAL a intervalos que no se limpian
  const spinRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("awards").select("*");
      setAwards(data || []);
    };
    load();
  }, []);

  const startPresentation = async (award: any) => {
    setSelected(award);
    setWinner(null);
    setTypedText("");
    setStopped(false);

    const { data: win } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", award.winner_user_id)
      .single();

    setWinner(win);

    typeText(award.description, setTypedText, 100);

    // ruleta inicial rápida
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

    // detener intervalo rápido inicial
    if (spinRef.current) clearInterval(spinRef.current);

    let delay = 70;
    const slowdown = 1.25;

    const smoothStop = () => {
      setCurrentAvatar(
        avatars[Math.floor(Math.random() * avatars.length)]
      );

      playSound("/sounds/spin.wav", 0.15);

      delay *= slowdown;

      if (delay < 450) {
        setTimeout(smoothStop, delay);
      } else {
        // FIN DE VERDAD
        setTimeout(async () => {
          setCurrentAvatar(winner.avatar_url);
          setStopped(true);

          playSound("/sounds/winner.wav", 0.9);

          // marcar premio entregado
          await supabase
            .from("awards")
            .update({ delivered: true })
            .eq("id", selected.id);

        }, delay);
      }
    };

    smoothStop();
  };

  // ================================
  // LISTA DE PREMIOS
  // ================================
  if (!selected) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <h1 className="font-display text-3xl mb-6">Premios disponibles</h1>

        <div className="space-y-4 max-w-md">
          {awards.map((award) => (
            <div
              key={award.id}
              className="p-4 border rounded-xl cursor-pointer hover:border-yellow-400"
              onClick={() => startPresentation(award)}
            >
              <h3 className="font-display text-xl">{award.category}</h3>
              <p className="text-sm opacity-60">{award.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================================
  // ANIMACIÓN POKÉMON
  // ================================
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      
      <motion.img
        src={selected.pokemon_gif}
        className="w-56 h-56"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      <h1 className="font-display text-4xl mt-6">{selected.category}</h1>

      <p className="font-['Press_Start_2P'] text-sm max-w-lg text-center mt-6 leading-relaxed">
        {typedText}
      </p>

      <motion.div
        className="mt-10 w-40 h-40 flex items-center justify-center"
        animate={stopped ? { scale: [1, 1.4, 1.2] } : {}}
        transition={{ duration: 0.6 }}
      >
        {currentAvatar && (
          <img
            src={currentAvatar}
            className="w-32 h-32 rounded-full border-4 border-yellow-400"
          />
        )}
      </motion.div>

      {!stopped ? (
        <button
          onClick={stopRoulette}
          className="mt-8 px-6 py-3 bg-red-600 rounded-xl font-display"
        >
          DETENER
        </button>
      ) : (
        <h2 className="font-display text-3xl mt-6 text-yellow-400">
          {selected.winner_display_name}
        </h2>
      )}
    </div>
  );
};

export default AwardShowcase;
