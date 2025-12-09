//src/components/QRScanner.tsx
import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion } from "framer-motion";
import { Camera, AlertCircle, Sparkles, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/* ============================================================
   POPUP LEVEL UP
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
   QRScanner
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
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overlayFlash, setOverlayFlash] = useState(false);
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  /* ============================================================
     LOAD CAMERAS + SELECT BACK CAMERA
     ============================================================ */
  const loadCameras = async () => {
    const devices = await Html5Qrcode.getCameras();
    setCameras(devices);

    let backCamera = devices.find((d) =>
      /back|rear|environment/i.test(d.label)
    );

    if (!backCamera) backCamera = devices[0];

    setSelectedCamera(backCamera);
  };

  useEffect(() => {
    loadCameras();
  }, []);

  /* ============================================================
     STOP SCAN
     ============================================================ */
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      setIsScanning(false);
    }
  }, [isScanning]);

  /* ============================================================
     START SCAN
     ============================================================ */
  const startScanner = useCallback(async () => {
    if (!selectedCamera) return;

    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      if (isScanning) await stopScanner();

      await scannerRef.current.start(
        selectedCamera.id,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },

        /* SUCCESS */
        async (decodedText) => {
          navigator.vibrate?.(200);

          setOverlayFlash(true);
          setTimeout(() => setOverlayFlash(false), 300);

          setFloatingMessage("¡Pokémon detectado!");
          setTimeout(() => setFloatingMessage(null), 1500);

          stopScanner();
          onScanRef.current(decodedText);
        },

        /* IGNORE ERRORS */
        () => {}
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error(err);
      setError("Error al iniciar la cámara");
    }
  }, [selectedCamera, isScanning, stopScanner]);

  /* ============================================================
     SWITCH CAMERA
     ============================================================ */
  const switchCamera = async () => {
    if (cameras.length < 2) return;

    const index = cameras.findIndex((c) => c.id === selectedCamera.id);
    const next = cameras[(index + 1) % cameras.length];

    await stopScanner();
    setSelectedCamera(next);
    startScanner();
  };

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
     UI
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

      {/* FLOATING MESSAGE: AL DETECTAR */}
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

      {/* FLOATING POKÉMON MESSAGE: SI ESTÁ ESCANEANDO */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 
                     bg-primary text-primary-foreground px-4 py-1 rounded-full 
                     font-display text-xs shadow-lg"
        >
          Escaneando… ¡Atrapemos un Pokémon!
        </motion.div>
      )}

      {/* CAMERA VIEWPORT */}
      <div className="relative rounded-2xl overflow-hidden border-4 border-primary/50 shadow-glow-red bg-card">

        <div id="qr-reader" className="w-full min-h-[300px] flex items-center justify-center" />

        {/* START BUTTON */}
        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center
                          bg-card/95 gap-4 p-6">
            <Camera className="w-10 h-10 text-primary" />
            <Button onClick={startScanner} className="bg-primary text-primary-foreground">
              <Camera className="w-4 h-4 mr-2" /> Activar cámara
            </Button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 gap-4 p-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive font-body">{error}</p>
            <Button onClick={startScanner} variant="outline">Reintentar</Button>
          </div>
        )}

        {/* SCANNING FRAME */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-pokemon-yellow rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-pokemon-yellow rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-pokemon-yellow rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-pokemon-yellow rounded-br-xl" />

            <motion.div
              initial={{ top: "10%" }}
              animate={{ top: "90%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="absolute left-4 right-4 h-1 bg-gradient-to-r 
                         from-transparent via-pokemon-yellow to-transparent"
            />
          </div>
        )}

      </div>

      {/* SWITCH CAMERA */}
      {isScanning && cameras.length > 1 && (
        <div className="flex justify-center mt-3">
          <Button variant="secondary" size="sm" onClick={switchCamera} className="flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Cambiar cámara
          </Button>
        </div>
      )}

      {/* CANCEL */}
      {isScanning && (
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="sm" onClick={stopScanner} className="text-muted-foreground">
            Cancelar
          </Button>
        </div>
      )}

      {/* POPUP LEVEL UP */}
      {levelUp && <LevelUpPopup level={levelUp} onClose={() => setLevelUp(null)} />}

    </motion.div>
  );
};

export default QRScanner;
