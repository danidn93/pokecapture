import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePokemon } from '@/contexts/PokemonContext';
import NavBar from '@/components/NavBar';
import PokemonCard from '@/components/PokemonCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Settings, Users, Image } from 'lucide-react';
import QRCode from 'react-qr-code';

const Admin = () => {
  const { isAdmin } = useAuth();
  const { pokemons, captures, addPokemon, deletePokemon } = usePokemon();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPokemon, setNewPokemon] = useState({
    name: '',
    image_url: '',
    rarity: 'common' as 'common' | 'uncommon' | 'rare' | 'legendary',
    qr_code: '',
  });
  const [selectedPokemonQr, setSelectedPokemonQr] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateQrCode = () => {
    return `pokemon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setNewPokemon(prev => ({ ...prev, image_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddForm = () => {
    const qrCode = generateQrCode();
    setNewPokemon({
      name: '',
      image_url: '',
      rarity: 'common',
      qr_code: qrCode,
    });
    setImagePreview(null);
    setShowAddForm(true);
  };

  if (!isAdmin) {
    return null;
  }

  const handleAddPokemon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPokemon.name || !newPokemon.image_url) {
      toast.error('Por favor completa el nombre y sube una imagen');
      return;
    }

    setIsSubmitting(true);
    const success = await addPokemon(newPokemon);
    setIsSubmitting(false);

    if (success) {
      toast.success(`¡${newPokemon.name} ha sido añadido!`);
      setNewPokemon({
        name: '',
        image_url: '',
        rarity: 'common',
        qr_code: '',
      });
      setImagePreview(null);
      setShowAddForm(false);
    } else {
      toast.error('Error al añadir el Pokemon');
    }
  };

  const handleDeletePokemon = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar a ${name}?`)) {
      const success = await deletePokemon(id);
      if (success) {
        toast.success(`${name} ha sido eliminado`);
      } else {
        toast.error('Error al eliminar el Pokemon');
      }
    }
  };

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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary mb-4">
              <Settings className="w-5 h-5" />
              <span className="font-body text-sm">Panel de Control</span>
            </div>
            
            <h1 className="text-xl font-display text-foreground mb-2">
              ADMINISTRACIÓN
            </h1>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto"
          >
            <div className="bg-card/50 rounded-xl p-4 border border-border text-center">
              <Image className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-display text-foreground">{pokemons.length}</p>
              <p className="text-xs text-muted-foreground">Pokemon</p>
            </div>
            <div className="bg-card/50 rounded-xl p-4 border border-border text-center">
              <Users className="w-8 h-8 mx-auto text-pokemon-yellow mb-2" />
              <p className="text-2xl font-display text-foreground">{captures.length}</p>
              <p className="text-xs text-muted-foreground">Capturas</p>
            </div>
          </motion.div>

          {/* Add Pokemon Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto mb-6"
          >
            <Button
              onClick={handleOpenAddForm}
              className="w-full bg-pokemon-green hover:bg-pokemon-green/90 text-background font-display"
            >
              <Plus className="w-5 h-5 mr-2" />
              AÑADIR POKEMON
            </Button>
          </motion.div>

          {/* Add Form */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddPokemon}
              className="max-w-md mx-auto bg-card/50 rounded-xl p-6 border border-border mb-8 space-y-4"
            >
              <div>
                <label className="text-sm font-body text-muted-foreground">Nombre</label>
                <Input
                  value={newPokemon.name}
                  onChange={(e) => setNewPokemon(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Pikachu"
                  className="bg-muted border-border"
                />
              </div>

              <div>
                <label className="text-sm font-body text-muted-foreground">Imagen (PNG, JPG, GIF)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-muted border-border cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 5MB. Se recomienda usar GIFs animados.
                </p>
              </div>

              {imagePreview && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-24 h-24 object-contain mx-auto rounded-lg border border-border"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-body text-muted-foreground">Rareza</label>
                <Select
                  value={newPokemon.rarity}
                  onValueChange={(value: any) => setNewPokemon(prev => ({ ...prev, rarity: value }))}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Común</SelectItem>
                    <SelectItem value="uncommon">Poco común</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="legendary">Legendario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-body text-muted-foreground">Código QR (auto-generado)</label>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-xs text-muted-foreground break-all">
                    {newPokemon.qr_code}
                  </code>
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg inline-block">
                  <QRCode value={newPokemon.qr_code} size={120} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Imprime este QR para que los usuarios lo escaneen
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </motion.form>
          )}

          {/* Pokemon List */}
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-sm text-muted-foreground mb-4">
              POKEMON REGISTRADOS
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {pokemons.map((pokemon, index) => (
                <motion.div
                  key={pokemon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <PokemonCard
                    pokemon={pokemon}
                    onClick={() => setSelectedPokemonQr(
                      selectedPokemonQr === pokemon.qr_code ? null : pokemon.qr_code
                    )}
                  />
                  
                  <button
                    onClick={() => handleDeletePokemon(pokemon.id, pokemon.name)}
                    className="absolute top-2 left-2 p-2 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {selectedPokemonQr === pokemon.qr_code && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-white rounded-xl p-4 flex flex-col items-center justify-center z-10"
                    >
                      <QRCode value={pokemon.qr_code} size={100} />
                      <p className="text-xs text-gray-600 mt-2 text-center break-all">
                        {pokemon.qr_code}
                      </p>
                      <button
                        onClick={() => setSelectedPokemonQr(null)}
                        className="text-xs text-blue-500 mt-2"
                      >
                        Cerrar
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
