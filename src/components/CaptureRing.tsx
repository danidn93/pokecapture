import React from "react";
import { motion } from "framer-motion";

interface CaptureRingProps {
  /** Valor entre 0 y 1 que indica cuánto falta para cerrarse */
  progress: number;

  /** Rareza del Pokémon (common, uncommon, rare, legendary) */
  rarity: string;

  /** Tamaño en px (por defecto 140) */
  size?: number;
}

/** Colores por rareza (Pokémon GO style) */
const rarityColors: Record<string, string> = {
  common: "#4ade80",       // verde
  uncommon: "#facc15",     // amarillo
  rare: "#fb923c",         // naranja
  legendary: "#ef4444",    // rojo
};

const CaptureRing: React.FC<CaptureRingProps> = ({
  progress,
  rarity,
  size = 140,
}) => {
  const color = rarityColors[rarity] || "#4ade80";

  // Convertir progreso a tamaño del círculo
  const ringScale = 0.3 + progress * 0.7; // nunca desaparece totalmente

  // Glow dinámico según rareza
  const glowColor = `${color}80`;

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Glow exterior pulsante */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * ringScale * 1.4,
          height: size * ringScale * 1.4,
          boxShadow: `0 0 ${18}px ${6}px ${glowColor}`,
          borderRadius: "50%",
        }}
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: "easeInOut",
        }}
      />

      {/* Degradado animado alrededor del círculo */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          width: size * ringScale,
          height: size * ringScale,
          borderColor: color,
          borderWidth: 4,
          background: `conic-gradient(
            from 0deg,
            ${color} 0%,
            transparent 20%,
            ${color} 40%,
            transparent 60%,
            ${color} 80%,
            transparent 100%
          )`,
          mask: "radial-gradient(circle, transparent 55%, black 56%)",
          WebkitMask: "radial-gradient(circle, transparent 55%, black 56%)",
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear",
        }}
      />

      {/* Contorno principal */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * ringScale,
          height: size * ringScale,
          border: `4px solid ${color}`,
          borderRadius: "50%",
        }}
      />
    </div>
  );
};

export default CaptureRing;
