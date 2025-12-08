import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const CreateAward = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [award, setAward] = useState({
    category: "",
    description: "",
    pokemon_gif: "" as string,
    total_winners: 1, // 👈 NUEVO — por defecto 1 ganador
  });

  // Cargar premios existentes
  const loadAwards = async () => {
    const { data } = await supabase
      .from("awards")
      .select("*")
      .order("created_at", { ascending: false });

    setAwards(data || []);
  };

  useEffect(() => {
    loadAwards();
  }, []);

  // Manejar GIF
  const handlePokemonGif = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setAward(prev => ({ ...prev, pokemon_gif: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Guardar o actualizar premio
  const saveAward = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!award.category || !award.description || !award.pokemon_gif)
      return toast.error("Completa todos los campos");

    let error = null;

    const payload = {
      category: award.category,
      description: award.description,
      pokemon_gif: award.pokemon_gif,
      total_winners: award.total_winners,
    };

    if (editingId) {
      const res = await supabase
        .from("awards")
        .update(payload)
        .eq("id", editingId);

      error = res.error;
    } else {
      const res = await supabase.from("awards").insert(payload);
      error = res.error;
    }

    if (error) return toast.error("Error guardando el premio");

    toast.success(editingId ? "Premio actualizado" : "Premio creado");

    // Reset
    setAward({
      category: "",
      description: "",
      pokemon_gif: "",
      total_winners: 1,
    });
    setPreview(null);
    setEditingId(null);

    loadAwards();
  };

  // Editar premio
  const editAward = (item: any) => {
    setEditingId(item.id);
    setAward({
      category: item.category,
      description: item.description,
      pokemon_gif: item.pokemon_gif,
      total_winners: item.total_winners || 1,
    });
    setPreview(item.pokemon_gif);
  };

  // Eliminar premio
  const deleteAward = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este premio?")) return;

    const { error } = await supabase.from("awards").delete().eq("id", id);

    if (error) return toast.error("Error eliminando premio");

    toast.success("Premio eliminado");
    loadAwards();
  };

  return (
    <>
      <NavBar />

      <div className="min-h-screen pt-24 p-6">
        <h1 className="text-xl font-display text-center mb-6">
          {editingId ? "Editar Premio Pokémon" : "Crear Premio Pokémon"}
        </h1>

        {/* FORM */}
        <form
          className="max-w-md mx-auto space-y-4 bg-card/50 p-6 rounded-xl border"
          onSubmit={saveAward}
        >
          {/* Categoría */}
          <label className="font-display text-sm">Categoría</label>
          <Input
            value={award.category}
            onChange={e =>
              setAward(prev => ({ ...prev, category: e.target.value }))
            }
          />

          {/* Descripción */}
          <label className="font-display text-sm">Descripción</label>
          <Input
            value={award.description}
            onChange={e =>
              setAward(prev => ({ ...prev, description: e.target.value }))
            }
          />

          {/* Cantidad de Ganadores */}
          <label className="font-display text-sm">Cantidad de ganadores</label>
          <Input
            type="number"
            min={1}
            value={award.total_winners}
            onChange={e =>
              setAward(prev => ({
                ...prev,
                total_winners: Math.max(1, Number(e.target.value)),
              }))
            }
          />

          {/* GIF */}
          <label className="font-display text-sm">GIF del Pokémon</label>
          <Input type="file" accept="image/*" onChange={handlePokemonGif} />

          {preview && (
            <img
              src={preview}
              className="w-32 h-32 mx-auto mt-3 rounded-lg border"
            />
          )}

          <Button className="w-full bg-yellow-500">
            {editingId ? "Actualizar Premio" : "Crear Premio"}
          </Button>

          {editingId && (
            <Button
              type="button"
              className="w-full bg-gray-600"
              onClick={() => {
                setEditingId(null);
                setAward({
                  category: "",
                  description: "",
                  pokemon_gif: "",
                  total_winners: 1,
                });
                setPreview(null);
              }}
            >
              Cancelar edición
            </Button>
          )}
        </form>

        {/* LISTA DE PREMIOS */}
        <h2 className="text-lg font-display mt-10 mb-4 text-center">
          Premios creados
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 max-w-4xl mx-auto">
          {awards.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card/60 backdrop-blur-md border border-yellow-400 rounded-xl p-4 flex flex-col items-center shadow-lg"
            >
              <img
                src={a.pokemon_gif}
                className="w-24 h-24 rounded-md border mb-3"
              />

              <p className="font-display text-yellow-300 text-center text-sm break-words">
                {a.category}
              </p>

              <p className="text-xs opacity-70 text-center mt-1 break-words">
                {a.description}
              </p>

              <p className="text-xs text-center mt-2 text-blue-300">
                Ganadores: {a.total_winners || 1}
              </p>

              <div className="flex gap-2 mt-4">
                <Button
                  className="bg-blue-600 px-4 py-1"
                  onClick={() => editAward(a)}
                >
                  Editar
                </Button>

                <Button
                  className="bg-red-600 px-4 py-1"
                  onClick={() => deleteAward(a.id)}
                >
                  Borrar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CreateAward;
