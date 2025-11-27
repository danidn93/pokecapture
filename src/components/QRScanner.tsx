import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion } from "framer-motion";
import { Camera, AlertCircle, ScanLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ============================================================
   COMPONENT: POPUP LEVEL UP 
   ============================================================ */
const LevelUpPopup = ({ level, onClose }: { level: number; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="bg-white p-8 rounded-3xl shadow-xl text-center relative overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <Sparkles className="w-14 h-14 text-yellow-400 mx-auto mb-4" />

      <h2 className="text-2xl font-display text-yellow-500 mb-2">
        ¡Subiste de nivel!
      </h2>

      <p className="text-lg font-body text-gray-700">
        Ahora eres <b>Nivel {level}</b>
      </p>

      <motion.button
        whileTap={{ scale: 0.9 }}
        className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display"
        onClick={onClose}
      >
        Continuar
      </motion.button>
    </motion.div>
  </motion.div>
);

/* ============================================================
   MAIN COMPONENT: QRScanner
   ============================================================ */
interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overlayFlash, setOverlayFlash] = useState(false);
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const { user } = useAuth();

  /* Keep updated refs */
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  /* STOP SCANNER */
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch {}
    }
  }, [isScanning]);

  /* START SCANNER */
  const startScanner = useCallback(async () => {
    setError(null);

    try {
      const devices = await Html5Qrcode.getCameras();

      if (devices.length > 0) {
        setHasPermission(true);

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }

        if (isScanning) await stopScanner();

        const backCamera =
          devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear")
          ) || devices[0];

        await scannerRef.current.start(
          backCamera.id,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          async (decodedText) => {
            /* success */
            navigator.vibrate?.(200);

            setOverlayFlash(true);
            setTimeout(() => setOverlayFlash(false), 300);

            setFloatingMessage("¡Pokémon detectado!");
            setTimeout(() => setFloatingMessage(null), 1500);

            stopScanner();
            onScanRef.current(decodedText);
          },
          (scanError) => {
            // ❗ Esto se ejecuta CONSTANTEMENTE mientras la cámara no detecta nada
            // por eso no debe mostrar errores.
            // Puedes dejarlo vacío:
            // console.log("QR no detectado:", scanError);
          }
        );

        setIsScanning(true);
      } else {
        setHasPermission(false);
        setError("No se encontraron cámaras disponibles");
      }
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar la cámara");
      onErrorRef.current?.(err.message || err.toString());
    }
  }, [isScanning, stopScanner]);

  /* Cleanup */
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  /* ============================================================
     UI RENDER
     ============================================================ */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">

      {/* FLASH OVERLAY */}
      {overlayFlash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-yellow-300/40 pointer-events-none z-40"
        />
      )}

      {/* FLOATING MESSAGE */}
      {floatingMessage && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/70 text-white font-display text-sm z-40"
        >
          {floatingMessage}
        </motion.div>
      )}

      {/* Camera Container */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-primary/50 shadow-glow-red bg-card">
        <div id="qr-reader" className="w-full min-h-[300px] flex items-center justify-center" />

        {/* Start button */}
        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/95 gap-4 p-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-center text-muted-foreground font-body text-sm">
              Toca para activar la cámara y escanear un código QR
            </p>
            <Button onClick={startScanner} className="bg-primary text-primary-foreground font-display">
              <Camera className="w-4 h-4 mr-2" /> ACTIVAR CÁMARA
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/95 gap-4 p-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive font-body text-sm">{error}</p>
            <Button onClick={startScanner} variant="outline" className="font-display">
              Reintentar
            </Button>
          </div>
        )}

        {/* Scanning animated overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-pokemon-yellow rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-pokemon-yellow rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-pokemon-yellow rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-pokemon-yellow rounded-br-xl" />

            {/* scanning line */}
            <motion.div
              initial={{ top: "10%" }}
              animate={{ top: "90%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-pokemon-yellow to-transparent"
            />
          </div>
        )}
      </div>

      {/* Cancel button */}
      {isScanning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex justify-center">
          <Button onClick={stopScanner} variant="ghost" size="sm" className="text-muted-foreground">
            Cancelar
          </Button>
        </motion.div>
      )}

      {/* LEVEL UP POPUP */}
      {levelUp && <LevelUpPopup level={levelUp} onClose={() => setLevelUp(null)} />}
    </motion.div>
  );
};

export default QRScanner;
