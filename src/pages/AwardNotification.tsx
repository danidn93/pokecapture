import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AwardNotification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const awardFromState = location?.state?.award || null;
  const awardWinnerId = location?.state?.awardWinnerId || null;

  const [award, setAward] = useState<any>(awardFromState);
  const [winner, setWinner] = useState<any>(null);
  const [typedMessage, setTypedMessage] = useState("");

  // Máquina de escribir
  const typeText = (text: string, setter: (t: string) => void, speed = 70) => {
    let i = 0;
    const interval = setInterval(() => {
      setter(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
  };

  // 1️⃣ Si no vino el award → no hacemos nada (NavBar siempre envía award)
  useEffect(() => {
    if (!award) {
      console.warn("⚠ No se recibió award en AwardNotification");
    }
  }, []);

  // 2️⃣ Cargar SOLO EL GANADOR CORRECTO desde award_winners
  useEffect(() => {
    if (!award || !awardWinnerId) return;

    const loadWinner = async () => {
      const { data, error } = await supabase
        .from("award_winners")
        .select(`
          id,
          display_name,
          profiles:profiles(avatar_url)
        `)
        .eq("id", awardWinnerId)
        .single();

      if (error) {
        console.error("Error loading winner:", error);
        return;
      }

      setWinner(data);

      const message = `¡Felicidades ${data.display_name}! Has ganado el premio ${award.category}!`;
      typeText(message, setTypedMessage);

      // marcar como visto SOLO ESTE REGISTRO
      await supabase
        .from("award_winners")
        .update({ viewed: true })
        .eq("id", awardWinnerId);
    };

    loadWinner();
  }, [award, awardWinnerId]);

  // 3️⃣ Auto-cerrar en 1 min
  const closeNotification = () => navigate(-1);

  useEffect(() => {
    const t = setTimeout(closeNotification, 60000);
    return () => clearTimeout(t);
  }, [award]);

  if (!award || !winner)
    return (
      <p className="text-white mt-40 text-center text-xl">
        Cargando premio...
      </p>
    );

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('/backgrounds/stadium.jpg')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={closeNotification}
        className="absolute top-6 right-6 bg-white/60 backdrop-blur-xl px-4 py-2 rounded-lg 
                   text-black font-display shadow-lg hover:bg-white/80"
      >
        Cerrar ✕
      </button>

      {/* Pokémon */}
      <motion.img
        src={award.pokemon_gif}
        className="w-48"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      <h1 className="text-3xl font-display mt-6 bg-white/40 text-black px-6 py-3 rounded-xl">
        ¡Premio conseguido!
      </h1>

      {/* Mensaje */}
      <p
        className="text-center font-['Press_Start_2P'] text-xs sm:text-sm max-w-md mt-6 
                   px-6 py-4 bg-white/40 text-black rounded-xl"
      >
        {typedMessage}
      </p>

      {/* SOLO TU AVATAR */}
      <motion.img
        src={winner.profiles.avatar_url}
        className="w-28 h-28 rounded-full border-4 border-yellow-400 mt-10"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />

      <h2 className="font-display text-2xl mt-4 bg-white/40 text-black px-6 py-3 rounded-xl">
        {winner.display_name}
      </h2>
    </div>
  );
};

export default AwardNotification;
