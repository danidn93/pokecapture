import React from "react";
import { motion } from "framer-motion";

interface SparklesProps {
  spinPower: number; // 0 → 5 (aprox)
  size?: number;
}

const PokeballSparkles: React.FC<SparklesProps> = ({ spinPower, size = 110 }) => {
  const intensity = Math.min(spinPower / 5, 1);               // Normalizado
  const rotationSpeed = 2 - intensity * 1.5;                 // Entre 2s y 0.5s
  const glowStrength = 8 + intensity * 18;                   // Glow fuerte con spin
  const particleSize = 6 + intensity * 4;                    // Tamaño dinámico

  const particles = Array.from({ length: 6 });

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* Glow circular animado */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          boxShadow: `0 0 ${glowStrength}px ${glowStrength / 3}px rgba(255,255,150,0.7)`,
          filter: "blur(2px)",
          transition: "0.15s linear",
        }}
      />

      {/* Partículas girando alrededor */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: rotationSpeed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {particles.map((_, i) => {
          const angle = (i / particles.length) * 360;

          return (
            <div
              key={i}
              className="absolute rounded-full bg-yellow-300"
              style={{
                width: particleSize,
                height: particleSize,
                left: "50%",
                top: "50%",
                transform: `rotate(${angle}deg) translate(${size / 2}px)`,
                filter: "blur(0.5px)",
              }}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

export default PokeballSparkles;
