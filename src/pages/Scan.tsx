import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePokemon } from '@/contexts/PokemonContext';
import QRScanner from '@/components/QRScanner';
import CaptureAnimation from '@/components/CaptureAnimation';
import NavBar from '@/components/NavBar';
import { toast } from 'sonner';
import { Camera, QrCode } from 'lucide-react';

interface ScannedPokemon {
  id: string;
  name: string;
  image_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  qr_code: string;
  created_at: string;
}

const Scan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPokemonByQr, capturePokemon, hasUserCaptured } = usePokemon();
  const [scannedPokemon, setScannedPokemon] = useState<ScannedPokemon | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [alreadyCaptured, setAlreadyCaptured] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleScan = (qrCode: string) => {
    const pokemon = getPokemonByQr(qrCode);
    
    if (!pokemon) {
      toast.error('Código QR no válido');
      return;
    }

    const captured = hasUserCaptured(pokemon.id);
    setAlreadyCaptured(captured);
    setScannedPokemon(pokemon);
    setShowCapture(true);
  };

  const handleCaptureComplete = async (success: boolean) => {
    if (success && scannedPokemon && !alreadyCaptured) {
      const captured = await capturePokemon(scannedPokemon.id);
      if (captured) {
        toast.success(`¡${scannedPokemon.name} ha sido añadido a tu Pokédex!`);
      }
    }
    
    setShowCapture(false);
    setScannedPokemon(null);
    setAlreadyCaptured(false);
  };

  return (
    <>
      <NavBar />
      
      <div className="min-h-screen bg-hero-gradient pb-24 pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-4">
              <Camera className="w-5 h-5" />
              <span className="font-body text-sm">Modo Captura</span>
            </div>
            
            <h1 className="text-xl font-display text-foreground mb-2">
              ESCANEAR POKEMON
            </h1>
            <p className="text-muted-foreground font-body">
              Apunta tu cámara al código QR
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto"
          >
            <QRScanner
              onScan={handleScan}
              onError={(error) => console.log('Scanner error:', error)}
            />
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 max-w-md mx-auto"
          >
            <div className="bg-card/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <QrCode className="w-6 h-6 text-pokemon-yellow" />
                <h3 className="font-body font-semibold text-foreground">
                  ¿Cómo capturar?
                </h3>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground font-body">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    1
                  </span>
                  Busca los códigos QR de Pokemon
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    2
                  </span>
                  Escanea el código con tu cámara
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    3
                  </span>
                  ¡Lanza la Pokebola y captura!
                </li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Capture Animation */}
      {showCapture && scannedPokemon && (
        <CaptureAnimation
          pokemon={scannedPokemon}
          onComplete={handleCaptureComplete}
          alreadyCaptured={alreadyCaptured}
        />
      )}
    </>
  );
};

export default Scan;
