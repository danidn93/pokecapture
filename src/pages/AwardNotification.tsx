import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AwardNotification = () => {
  const location = useLocation();
  const awardFromState = location?.state?.award;

  const [award, setAward] = useState<any>(awardFromState || null);
  const [winner, setWinner] = useState<any>(null);
  const [typedMessage, setTypedMessage] = useState("");

  // Máquina de escribir
  const typeText = (text: string, setter: (t: string) => void, speed = 110) => {
    let i = 0;
    const interval = setInterval(() => {
      setter(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
  };

  // Si no llega por state, buscamos el último premio entregado
  useEffect(() => {
    const load = async () => {
      if (!award) {
        const { data: lastAward } = await supabase
          .from("awards")
          .select("*")
          .eq("delivered", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        setAward(lastAward || null);
      }
    };

    load();
  }, []);

  // Cargar el ganador
  useEffect(() => {
    if (!award) return;

    const loadWinner = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", award.winner_user_id)
        .single();

      setWinner(data);

      typeText(
        `¡Felicidades ${award.winner_display_name}! Has ganado el premio ${award.category}!`,
        setTypedMessage
      );
    };

    loadWinner();
  }, [award]);

  if (!award || !winner) return <p className="text-white mt-40 text-center">Cargando premio...</p>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <motion.img
        src={award.pokemon_gif}
        className="w-48"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      <h1 className="text-3xl font-display mt-6">¡Premio conseguido!</h1>

      <p className="text-center font-['Press_Start_2P'] text-sm max-w-md mt-6 px-4 leading-relaxed">
        {typedMessage}
      </p>

      <motion.img
        src={winner.avatar_url}
        className="w-28 h-28 rounded-full border-4 border-yellow-400 mt-10"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />

      <h2 className="font-display text-2xl mt-4 text-yellow-400">
        {award.winner_display_name}
      </h2>
    </div>
  );
};

export default AwardNotification;
