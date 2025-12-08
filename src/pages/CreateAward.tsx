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
    pokemon_gif: "" as string
  });

  // -----------------------------
  // Cargar premios existentes
  // -----------------------------
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

  // -----------------------------
  // Manejar GIF
  // -----------------------------
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

  // -----------------------------
  // Guardar o actualizar premio
  // -----------------------------
  const saveAward = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!award.category || !award.description || !award.pokemon_gif)
      return toast.error("Completa todos los campos");

    let error = null;

    if (editingId) {
      // actualizar
      const res = await supabase
        .from("awards")
        .update(award)
        .eq("id", editingId);

      error = res.error;
    } else {
      // crear nuevo
      const res = await supabase.from("awards").insert(award);
      error = res.error;
    }

    if (error) return toast.error("Error guardando el premio");

    toast.success(editingId ? "Premio actualizado" : "Premio creado");

    // reset form
    setAward({ category: "", description: "", pokemon_gif: "" });
    setPreview(null);
    setEditingId(null);

    loadAwards();
  };

  // -----------------------------
  // Editar premio
  // -----------------------------
  const editAward = (item: any) => {
    setEditingId(item.id);
    setAward({
      category: item.category,
      description: item.description,
      pokemon_gif: item.pokemon_gif
    });
    setPreview(item.pokemon_gif);
  };

  // -----------------------------
  // Eliminar premio
  // -----------------------------
  const deleteAward = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este premio?")) return;

    const { error } = await supabase
      .from("awards")
      .delete()
      .eq("id", id);

    if (error) return toast.error("Error eliminando premio");

    toast.success("Premio eliminado");
    loadAwards();
  };

  // -----------------------------
  // RENDER
  // -----------------------------
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
          <label className="font-display text-sm">Categoría</label>
          <Input
            value={award.category}
            onChange={e => setAward(prev => ({ ...prev, category: e.target.value }))}
          />

          <label className="font-display text-sm">Descripción</label>
          <Input
            value={award.description}
            onChange={e => setAward(prev => ({ ...prev, description: e.target.value }))}
          />

          <label className="font-display text-sm">GIF del Pokémon</label>
          <Input type="file" accept="image/*" onChange={handlePokemonGif} />

          {preview && (
            <img src={preview} className="w-32 h-32 mx-auto mt-3 rounded-lg" />
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
                setAward({ category: "", description: "", pokemon_gif: "" });
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

        <div className="max-w-md mx-auto space-y-4">
          {awards.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card/50 border rounded-xl p-4 flex items-center gap-4"
            >
              <img
                src={a.pokemon_gif}
                className="w-20 h-20 rounded-lg border"
              />

              <div className="flex-1">
                <p className="font-display text-yellow-400">{a.category}</p>
                <p className="text-xs opacity-70">{a.description}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="bg-blue-600 w-20"
                  onClick={() => editAward(a)}
                >
                  Editar
                </Button>

                <Button
                  className="bg-red-600 w-20"
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
