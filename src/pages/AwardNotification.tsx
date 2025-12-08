import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AwardNotification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const awardFromState = location?.state?.award;

  const [award, setAward] = useState<any>(awardFromState || null);
  const [winner, setWinner] = useState<any>(null);
  const [typedMessage, setTypedMessage] = useState("");

  // Máquina de escribir
  const typeText = (text: string, setter: (t: string) => void, speed = 90) => {
    let i = 0;
    const interval = setInterval(() => {
      setter(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
  };

  // Cargar premio más reciente si no viene por state
  useEffect(() => {
    const loadAward = async () => {
      if (!award) {
        const { data } = await supabase
          .from("awards")
          .select("*")
          .eq("delivered", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        setAward(data);
      }
    };

    loadAward();
  }, []);

  // Cargar ganador & mensaje
  useEffect(() => {
    if (!award) return;

    const loadWinner = async () => {
      const { data: winnerData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", award.winner_user_id)
        .single();

      setWinner(winnerData);

      typeText(
        `¡Felicidades ${award.winner_display_name}! Has ganado el premio ${award.category}!`,
        setTypedMessage
      );
    };

    loadWinner();
  }, [award]);

  // ⏳ AUTO-CERRAR A LOS 60 SEGUNDOS
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 60_000); // 1 minuto

    return () => clearTimeout(timer);
  }, []);

  if (!award || !winner)
    return (
      <p className="text-white mt-40 text-center text-xl">Cargando premio...</p>
    );

  const pokemonGIF = award.pokemon_gif || "/fallback/pokemon.gif";

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/backgrounds/stadium.jpg')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* POKÉMON ANIMADO */}
      <motion.img
        src={pokemonGIF}
        onError={(e) => (e.currentTarget.src = "/fallback/pokemon.gif")}
        className="w-48 drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      {/* Título */}
      <h1 className="text-3xl font-display mt-6 bg-white/40 backdrop-blur-md 
                     text-black px-6 py-3 rounded-xl shadow-lg">
        ¡Premio conseguido!
      </h1>

      {/* Mensaje máquina de escribir */}
      <p className="text-center font-['Press_Start_2P'] text-xs sm:text-sm 
                    max-w-md mt-6 px-6 py-4 leading-relaxed bg-white/40 
                    backdrop-blur-md text-black rounded-xl shadow-lg">
        {typedMessage}
      </p>

      {/* Avatar del ganador */}
      <motion.img
        src={winner.avatar_url}
        className="w-28 h-28 rounded-full border-4 border-yellow-400 mt-10 
                   shadow-[0_0_25px_rgba(255,255,0,0.8)]"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />

      {/* Nombre del ganador */}
      <h2 className="font-display text-2xl mt-4 text-black bg-white/40 backdrop-blur-md 
                     px-6 py-3 rounded-xl shadow-lg">
        {award.winner_display_name}
      </h2>
    </div>
  );
};

export default AwardNotification;
