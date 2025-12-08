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
  const [totalWinners, setTotalWinners] = useState(1);
  const [winnerNames, setWinnerNames] = useState<string[]>([]);
  const [winnerUsers, setWinnerUsers] = useState<string[]>([]);

  // Load awards & users
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

  // When number of winners changes → rebuild arrays
  useEffect(() => {
    setWinnerNames(Array(totalWinners).fill(""));
    setWinnerUsers(Array(totalWinners).fill(""));
  }, [totalWinners]);

  // Save MULTIPLE winners
  const saveWinners = async () => {
    if (!selected) return toast.error("Selecciona un premio");

    for (let i = 0; i < totalWinners; i++) {
      if (!winnerUsers[i] || !winnerNames[i]) {
        return toast.error(`Completa el ganador #${i + 1}`);
      }
    }

    // Save total_winners in awards
    await supabase
      .from("awards")
      .update({ total_winners: totalWinners })
      .eq("id", selected.id);

    // Remove previous winners
    await supabase.from("award_winners").delete().eq("award_id", selected.id);

    // Insert all winners
    const rows = winnerUsers.map((user, i) => ({
      award_id: selected.id,
      user_id: user,
      display_name: winnerNames[i],
    }));

    const { error } = await supabase.from("award_winners").insert(rows);

    if (error) return toast.error("Error guardando ganadores");

    toast.success("Ganadores asignados correctamente 🎉");

    setSelected(null);
  };

  return (
    <>
      <NavBar />

      <div className="min-h-screen pt-24 p-6">
        <h1 className="text-3xl font-display text-center mb-10 text-yellow-400">
          Seleccionar Ganadores
        </h1>

        {/* LISTA DE PREMIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10 px-4">
          {awards.map((award, idx) => (
            <motion.div
              key={award.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                setSelected(award);
                setTotalWinners(award.total_winners || 1);
              }}
              className={`
                cursor-pointer p-4 rounded-xl border bg-card/60 
                ${selected?.id === award.id ? "border-yellow-400" : "border-gray-700"}
              `}
            >
              <img src={award.pokemon_gif} className="w-24 h-24 mx-auto rounded-md" />
              <p className="text-center mt-3 font-display text-yellow-300">
                {award.category}
              </p>
            </motion.div>
          ))}
        </div>

        {/* PANEL ASIGNAR GANADORES */}
        {selected && (
          <div className="max-w-md mx-auto bg-card/50 border rounded-xl p-6 space-y-4">

            <h2 className="font-display text-xl mb-4 text-center text-yellow-400">
              Ganadores de: {selected.category}
            </h2>

            {/* Cantidad de ganadores */}
            <label className="font-display text-sm">Total de ganadores</label>
            <Input
              type="number"
              min={1}
              value={totalWinners}
              onChange={(e) => setTotalWinners(Number(e.target.value))}
            />

            <hr className="my-4 opacity-40" />

            {/* Inputs dinámicos */}
            {Array.from({ length: totalWinners }).map((_, i) => (
              <div key={i} className="space-y-2 border p-3 rounded-lg bg-black/30">
                <p className="font-display text-yellow-300">Ganador {i + 1}</p>

                <select
                  className="w-full border p-2 rounded bg-black text-yellow-400"
                  onChange={(e) => {
                    const copy = [...winnerUsers];
                    copy[i] = e.target.value;
                    setWinnerUsers(copy);
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {profiles.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>

                <Input
                  placeholder="Nombre a mostrar"
                  onChange={(e) => {
                    const copy = [...winnerNames];
                    copy[i] = e.target.value;
                    setWinnerNames(copy);
                  }}
                />
              </div>
            ))}

            <Button className="w-full bg-blue-600" onClick={saveWinners}>
              Guardar ganadores
            </Button>

            <Button className="w-full bg-gray-600" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignWinner;
