import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePokemon } from '@/contexts/PokemonContext';
import NavBar from '@/components/NavBar';
import PokemonCard from '@/components/PokemonCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Settings, Users, Image as IconImage } from 'lucide-react';
import QRCode from 'react-qr-code';
import { supabase } from '@/integrations/supabase/client';

const Admin = () => {
  const { isAdmin } = useAuth();
  const { pokemons, captures, addPokemon, deletePokemon } = usePokemon();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showGuessForm, setShowGuessForm] = useState(false);

  const generateQrCode = () =>
    `pokemon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const [newPokemon, setNewPokemon] = useState({
    name: '',
    image_url: '',
    rarity: 'common' as 'common' | 'uncommon' | 'rare' | 'legendary',
    qr_code: generateQrCode(),
  });

  const [guessPokemon, setGuessPokemon] = useState({
    name: '',
    real_image_url: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [realPreview, setRealPreview] = useState<string | null>(null);
  const [silhouettePreview, setSilhouettePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ===========================
  // 🔥 LISTA guess_pokemon
  // ===========================
  const [guessList, setGuessList] = useState<any[]>([]);
  const [loadingGuessList, setLoadingGuessList] = useState(true);

  const fetchGuessList = async () => {
    setLoadingGuessList(true);
    const { data, error } = await supabase
      .from("guess_pokemon")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setGuessList(data || []);
    setLoadingGuessList(false);
  };

  useEffect(() => {
    fetchGuessList();
  }, []);

  // ===========================
  // 🔥 IMÁGENES
  // ===========================

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setNewPokemon(prev => ({ ...prev, image_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const generateSilhouette = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = base64;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 40) continue;

          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
    });
  };

  const handleGuessRealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setRealPreview(base64);
      setGuessPokemon(prev => ({ ...prev, real_image_url: base64 }));

      const silhouette = await generateSilhouette(base64);
      setSilhouettePreview(silhouette);
    };
    reader.readAsDataURL(file);
  };

  // ===========================
  // 🔥 GUARDAR Pokémon
  // ===========================
  const handleAddPokemon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPokemon.name || !newPokemon.image_url) {
      toast.error('Completa nombre e imagen');
      return;
    }

    setIsSubmitting(true);
    const success = await addPokemon(newPokemon);
    setIsSubmitting(false);

    if (success) {
      toast.success(`¡${newPokemon.name} añadido!`);
      setShowAddForm(false);

      // Reset
      setNewPokemon({
        name: "",
        image_url: "",
        rarity: "common",
        qr_code: generateQrCode(),
      });
      setImagePreview(null);

    } else {
      toast.error("Error al añadir Pokémon");
    }
  };

  const handleAddGuessPokemon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guessPokemon.name || !guessPokemon.real_image_url) {
      toast.error("Completa todos los campos");
      return;
    }

    const { error } = await supabase
      .from("guess_pokemon")
      .insert({
        name: guessPokemon.name,
        image_url: guessPokemon.real_image_url,
      });

    if (error) {
      toast.error("Error al guardar Pokémon de adivinanza");
      return;
    }

    toast.success("¡Pokémon de adivinanza añadido!");

    // Cerrar formulario
    setShowGuessForm(false);
    setGuessPokemon({ name: "", real_image_url: "" });
    setRealPreview(null);
    setSilhouettePreview(null);

    // Recargar lista
    fetchGuessList();
  };

  // ===========================
  // 🔥 EXPORTAR QR
  // ===========================
  const generateSingleQR = async (pokemon: any) => {
    return new Promise<void>((resolve) => {
      const svgElement = document.querySelector(`#qr-export-${pokemon.id}`) as SVGElement;

      if (!svgElement) {
        console.error("No se encontró el QR exportable:", pokemon.id);
        resolve();
        return;
      }

      const svgString = new XMLSerializer().serializeToString(svgElement);

      const svgBase64 =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgString)));

      const img = new window.Image();
      img.src = svgBase64;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 600, 600);

        const link = document.createElement("a");
        link.download = `${pokemon.name}-qr.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        resolve();
      };
    });
  };

  const downloadAllQRCodes = async () => {
    if (!pokemons.length) {
      toast.error("No hay pokémon registrados");
      return;
    }

    toast.info("Generando QR...");

    for (const pkm of pokemons) {
      await generateSingleQR(pkm);
    }

    toast.success("Descarga completada");
  };

  // ===========================
  // 🔥 RENDER
  // ===========================
  if (!isAdmin) return null;

  return (
    <>
      <NavBar />

      <div className="min-h-screen bg-hero-gradient pb-24 pt-20">
        <div className="container mx-auto px-4 py-8">

          {/* ================= HEADER ================= */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary mb-4">
              <Settings className="w-5 h-5" />
              <span className="font-body text-sm">Panel de Control</span>
            </div>

            <h1 className="text-xl font-display text-pokemon-yellow">
              ADMINISTRACIÓN
            </h1>
          </motion.div>

          {/* ================= STATS ================= */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-card/50 border rounded-xl p-4 text-center">
              <IconImage className="w-8 h-8 mx-auto text-primary" />
              <p className="text-2xl font-display">{pokemons.length}</p>
              <p className="text-xs text-muted-foreground">Pokémon QR</p>
            </div>

            <div className="bg-card/50 border rounded-xl p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-pokemon-yellow" />
              <p className="text-2xl font-display">{captures.length}</p>
              <p className="text-xs text-muted-foreground">Capturas</p>
            </div>
          </div>

          {/* ================= BOTÓN CREAR QR ================= */}
          <Button
            onClick={() => { setShowAddForm(true); setShowGuessForm(false); }}
            className="w-full max-w-md mx-auto bg-pokemon-green hover:bg-pokemon-green/90 text-background font-display py-6 rounded-full mb-4"
          >
            <Plus className="mr-2" /> AÑADIR POKÉMON
          </Button>

          <Button
            onClick={() => { setShowGuessForm(true); setShowAddForm(false); }}
            className="w-full max-w-md mx-auto bg-blue-600 hover:bg-blue-700 text-white font-display py-6 rounded-full mb-6"
          >
            <Plus className="mr-2" /> POKÉMON DE ADIVINANZA
          </Button>

          <Button
            onClick={downloadAllQRCodes}
            className="w-full max-w-md mx-auto bg-red-600 hover:bg-red-700 text-white font-display py-6 rounded-full mb-6"
          >
            Descargar todos los QR
          </Button>

          {/* ================= FORMULARIO CREAR ================= */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleAddPokemon}
              className="max-w-md mx-auto bg-card/50 border rounded-xl p-6 space-y-4 mb-8"
            >
              <label className="font-display text-sm">Nombre</label>
              <Input
                value={newPokemon.name}
                onChange={(e) =>
                  setNewPokemon(prev => ({ ...prev, name: e.target.value }))
                }
                className="font-display"
              />

              <label className="font-display text-sm">Imagen</label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />

              {imagePreview && (
                <img src={imagePreview} className="w-24 h-24 mx-auto mt-4 rounded-lg" />
              )}

              <label className="font-display text-sm">Rareza</label>
              <Select
                value={newPokemon.rarity}
                onValueChange={(value: any) =>
                  setNewPokemon(prev => ({ ...prev, rarity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Común</SelectItem>
                  <SelectItem value="uncommon">Poco común</SelectItem>
                  <SelectItem value="rare">Raro</SelectItem>
                  <SelectItem value="legendary">Legendario</SelectItem>
                </SelectContent>
              </Select>

              <label className="font-display text-sm">QR generado</label>
              <div className="bg-white p-3 rounded-lg inline-block mx-auto">
                <QRCode value={newPokemon.qr_code} size={120} />
              </div>

              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-primary font-display" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>

                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </motion.form>
          )}

          {/* ================= FORMULARIO ADIVINANZA ================= */}
          {showGuessForm && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleAddGuessPokemon}
              className="max-w-md mx-auto bg-card/50 border rounded-xl p-6 space-y-4 mb-8"
            >
              <h2 className="text-center font-display text-lg mb-2">
                Registrar Pokémon de Adivinanza
              </h2>

              {/* Nombre */}
              <label className="font-display text-sm">Nombre del Pokémon</label>
              <Input
                value={guessPokemon.name}
                onChange={(e) =>
                  setGuessPokemon((prev) => ({ ...prev, name: e.target.value }))
                }
                className="font-display"
                placeholder="Ej: ¿Quién es este Pokémon?"
              />

              {/* Imagen real */}
              <label className="font-display text-sm">Imagen real</label>
              <Input type="file" accept="image/*" onChange={handleGuessRealUpload} />

              {realPreview && (
                <>
                  <p className="font-display text-xs text-muted-foreground mt-2">
                    Imagen original:
                  </p>
                  <img
                    src={realPreview}
                    className="w-32 h-32 mx-auto rounded-lg object-cover border"
                  />
                </>
              )}

              {silhouettePreview && (
                <>
                  <p className="font-display text-xs text-muted-foreground mt-2">
                    Silueta generada:
                  </p>
                  <img
                    src={silhouettePreview}
                    className="w-32 h-32 mx-auto rounded-lg object-cover border"
                  />
                </>
              )}

              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-blue-600 text-white font-display">
                  Guardar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGuessForm(false);
                    setGuessPokemon({ name: "", real_image_url: "" });
                    setRealPreview(null);
                    setSilhouettePreview(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </motion.form>
          )}

          {/* ================= LISTA POKEMON ================= */}
          <h2 className="font-display text-sm text-muted-foreground max-w-2xl mx-auto mb-3">
            POKÉMON REGISTRADOS (QR)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {pokemons.map((pokemon, index) => (
              <motion.div
                key={pokemon.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer [perspective:1000px]"
                onClick={() => toggleFlip(pokemon.id)}
              >
                <div
                  className={`
                    relative w-full h-[190px]
                    transition-transform duration-500
                    [transform-style:preserve-3d]
                    ${flipped[pokemon.id] ? "[transform:rotateY(180deg)]" : ""}
                  `}
                >

                  {/* ================= FRONT ================= */}
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    <PokemonCard pokemon={pokemon} />
                  </div>

                  {/* ================= BACK ================= */}
                  <div className="
                    absolute inset-0 
                    [transform:rotateY(180deg)]
                    [backface-visibility:hidden]
                    bg-card/50 border rounded-xl 
                    flex items-center justify-center p-0
                  ">
                    
                    {/* QR visible ocupando 100% del reverso */}
                    <div className="w-full h-full flex items-center justify-center">
                      <QRCode value={pokemon.qr_code} style={{ width: "100%", height: "100%" }} />
                    </div>
                  </div>

                </div>

                {/* QR oculto para exportación */}
                <div className="qr-hidden">
                  <QRCode id={`qr-export-${pokemon.id}`} value={pokemon.qr_code} size={600} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ================= ADIVINANZA ================= */}
          <div className="max-w-2xl mx-auto my-10 border-t border-muted-foreground/30" />

          <h2 className="font-display text-sm text-muted-foreground max-w-2xl mx-auto mb-3">
            POKÉMON DE ADIVINANZA
          </h2>

          {loadingGuessList ? (
            <p className="text-center text-muted-foreground text-sm">Cargando...</p>
          ) : guessList.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              Aún no hay Pokémon registrados.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {guessList.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card/50 border rounded-xl p-3 text-center shadow"
                >
                  <img
                    src={p.image_url}
                    className="w-24 h-24 mx-auto rounded-lg object-cover"
                  />

                  <p className="mt-2 font-display text-sm">{p.name}</p>

                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Admin;
