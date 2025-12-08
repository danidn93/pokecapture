import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AssignWinner = () => {
  const [awards, setAwards] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [winnerUser, setWinnerUser] = useState("");
  const [winnerDisplayName, setWinnerDisplayName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: awards } = await supabase.from("awards").select("*");
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

    toast.success("Ganador asignado");
  };

  return (
    <>
      <NavBar />

      <div className="min-h-screen pt-24 p-6">
        <h1 className="text-xl font-display text-center mb-6">
          Seleccionar ganador
        </h1>

        {/* Lista de premios */}
        <div className="space-y-3 max-w-md mx-auto mb-10">
          {awards.map((a) => (
            <div
              key={a.id}
              className={`p-4 border rounded-xl cursor-pointer ${
                selected?.id === a.id ? "border-yellow-400" : "border-gray-600"
              }`}
              onClick={() => setSelected(a)}
            >
              <h3 className="font-display text-lg">{a.category}</h3>
            </div>
          ))}
        </div>

        {selected && (
          <div className="max-w-md mx-auto bg-card/50 border rounded-xl p-6 space-y-4">
            <h2 className="font-display text-xl mb-4">
              Ganador de: {selected.category}
            </h2>

            <label>Usuario ganador</label>
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

            <label>Nombre a mostrar</label>
            <Input
              value={winnerDisplayName}
              onChange={(e) => setWinnerDisplayName(e.target.value)}
              placeholder="Ej: Steven López"
            />

            <Button className="w-full bg-blue-600" onClick={saveWinner}>
              Guardar ganador
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignWinner;
