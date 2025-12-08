import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePokemon } from "@/contexts/PokemonContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { Trophy, Medal, Award, Crown, Gift } from "lucide-react";

const Leaderboard = () => {
  const { user } = useAuth();
  const { leaderboard, loading } = usePokemon();
  const navigate = useNavigate();

  const [myAwards, setMyAwards] = useState([]);

  // ============================
  // 🔥 Cargar premios ganados desde award_winners
  // ============================
  useEffect(() => {
    if (!user) return;

    const loadAwards = async () => {
      const { data, error } = await supabase
        .from("award_winners")
        .select(`
          *,
          award:awards(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading awards:", error);
        return;
      }

      // Guardar solo la parte del premio
      setMyAwards(data.map((row) => row.award));
    };

    loadAwards();
  }, [user]);

  // ============================
  // 🔄 Loading Leaderboard
  // ============================
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-hero-gradient pb-24 pt-20 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  const sorted = [...leaderboard].sort((a, b) => b.points - a.points);

  return (
    <>
      <NavBar />

      <div className="min-h-screen bg-hero-gradient pb-24 pt-20">
        <div className="container mx-auto px-4 py-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pokemon-yellow/20 text-pokemon-yellow mb-4">
              <Trophy className="w-5 h-5" />
              <span className="font-body text-sm">Clasificación</span>
            </div>

            <h1 className="text-xl font-display text-foreground mb-2">
              RANKING GLOBAL
            </h1>
            <p className="text-muted-foreground font-body">
              Tabla de puntuación de entrenadores Pokémon
            </p>
          </motion.div>

          {/* Leaderboard */}
          <div className="max-w-md mx-auto space-y-3">
            {sorted.length > 0 ? (
              sorted.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === user?.id;

                const medalIcon =
                  rank === 1 ? (
                    <Crown className="w-6 h-6 text-yellow-400" />
                  ) : rank === 2 ? (
                    <Medal className="w-6 h-6 text-gray-300" />
                  ) : rank === 3 ? (
                    <Award className="w-6 h-6 text-amber-600" />
                  ) : (
                    <span className="text-sm font-display text-muted-foreground">
                      #{rank}
                    </span>
                  );

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 bg-card/40 backdrop-blur-sm 
                      ${isCurrentUser ? "ring-2 ring-primary" : "border-border"}
                    `}
                  >
                    <div className="w-10 flex items-center justify-center">
                      {medalIcon}
                    </div>

                    <div className="w-12 h-12 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-semibold text-foreground truncate">
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(Tú)</span>
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-display text-lg text-pokemon-yellow">
                        {entry.points}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-body text-foreground mb-2">
                  Sin puntos aún
                </h3>
                <p className="text-muted-foreground font-body">
                  ¡Sé el primero en ganar puntos!
                </p>
              </motion.div>
            )}
          </div>

          {/* =======================
              🎁 PREMIOS GANADOS (3 columnas)
              ======================= */}
          {user && myAwards.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Gift className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-display text-yellow-400">
                  PREMIOS GANADOS
                </h2>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {myAwards.map((award, index) => (
                  <motion.div
                    key={award.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-white/20 backdrop-blur-md border border-yellow-400 text-center shadow-lg flex flex-col items-center"
                    style={{ minHeight: "260px" }}
                  >
                    {/* GIF */}
                    <img
                      src={award.pokemon_gif}
                      alt={award.category}
                      className="w-20 h-20 mx-auto rounded-md mb-3"
                    />

                    {/* Categoría */}
                    <h3 className="font-display text-yellow-300 text-base leading-tight px-2 break-words">
                      {award.category}
                    </h3>

                    {/* Fecha */}
                    <p className="text-xs text-yellow-200 mt-1 mb-3">
                      {new Date(award.updated_at).toLocaleDateString()}
                    </p>

                    {/* BOTÓN REVER PREMIO → con awardWinnerId */}
                    <button
                      onClick={async () => {
                        // 1️⃣ Buscamos el award_winner correcto
                        const { data, error } = await supabase
                          .from("award_winners")
                          .select("id")
                          .eq("award_id", award.id)
                          .eq("user_id", user.id)
                          .single();

                        if (error || !data) {
                          console.error("No se encontró award_winner", error);
                          return;
                        }

                        // 2️⃣ Navegar con award + awardWinnerId
                        navigate("/award-notification", {
                          state: {
                            award,
                            awardWinnerId: data.id,
                          },
                        });
                      }}
                      className="mt-auto w-full py-2 text-sm font-display bg-yellow-400 text-black rounded-lg hover:bg-yellow-300"
                    >
                      REVER PREMIO
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
