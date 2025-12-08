import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const AssignWinner = () => {
  const [awards, setAwards] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [winnerUser, setWinnerUser] = useState("");
  const [winnerDisplayName, setWinnerDisplayName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: awards } = await supabase
        .from("awards")
        .select("*")
        .order("created_at", { ascending: false });

      setAwards(awards || []);

      const { data: users } = await supabase.from("profiles").select("*");
      setProfiles(users || []);
    };

    load();
  }, []);

  const saveWinner = async () => {
    if (!selected || !winnerUser || !winnerDisplayName)
      return toast.error("Completa todos los campos");

    const { error } = await supabase
      .from("awards")
      .update({
        winner_user_id: winnerUser,
        winner_display_name: winnerDisplayName,
      })
      .eq("id", selected.id);

    if (error) return toast.error("Error asignando ganador");

    toast.success("Ganador asignado correctamente 🎉");
  };

  return (
    <>
      <NavBar />

      <div className="min-h-screen pt-24 p-6">

        <h1 className="text-3xl font-display text-center mb-10 text-yellow-400">
          Seleccionar Ganador
        </h1>

        {/* GRID DE PREMIOS */}
        <h2 className="text-lg font-display text-center mb-4">
          Premios disponibles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10 px-4">

          {awards.map((award, idx) => (
            <motion.div
              key={award.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                setSelected(award);
                setWinnerUser("");
                setWinnerDisplayName("");
              }}
              className={`
                cursor-pointer p-4 rounded-xl border shadow-lg bg-card/60 backdrop-blur-md 
                transition-all duration-200
                ${selected?.id === award.id ? "border-yellow-400 scale-105" : "border-gray-700 hover:scale-105"}
              `}
            >
              {/* Pokemon GIF */}
              <img
                src={award.pokemon_gif}
                className="w-24 h-24 mx-auto mb-3 rounded-md border bg-black/40"
              />

              {/* Categoria */}
              <p className="font-display text-yellow-300 text-center text-sm px-1 break-words">
                {award.category}
              </p>

              {/* Ganador actual (si ya existe) */}
              {award.winner_display_name && (
                <p className="text-xs text-center mt-1 text-green-400">
                  Ganador: {award.winner_display_name}
                </p>
              )}
            </motion.div>
          ))}

        </div>

        {/* PANEL PARA ASIGNAR GANADOR */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-card/50 border rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-xl mb-4 text-center text-yellow-400">
              Asignar ganador a: {selected.category}
            </h2>

            {/* Mostrar Pokemon GIF */}
            <div className="flex justify-center mb-4">
              <img
                src={selected.pokemon_gif}
                className="w-28 h-28 border rounded-lg bg-black/40"
              />
            </div>

            <label className="font-display text-sm">Usuario ganador</label>
            <select
              className="w-full border p-2 rounded text-yellow-400 bg-black"
              onChange={(e) => setWinnerUser(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {profiles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>

            <label className="font-display text-sm">Nombre a mostrar</label>
            <Input
              value={winnerDisplayName}
              onChange={(e) => setWinnerDisplayName(e.target.value)}
              placeholder="Ej: Steven López"
            />

            <Button className="w-full bg-blue-600" onClick={saveWinner}>
              Guardar ganador
            </Button>

            <Button
              className="w-full bg-gray-700 mt-2"
              onClick={() => setSelected(null)}
            >
              Cancelar
            </Button>

          </motion.div>
        )}
      </div>
    </>
  );
};

export default AssignWinner;
