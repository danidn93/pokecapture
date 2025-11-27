import { motion } from 'framer-motion';

interface PokeballProps {
  isAnimating?: boolean;
  isShaking?: boolean;
  size?: number;
}

const Pokeball = ({ isAnimating = false, isShaking = false, size = 120 }: PokeballProps) => {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={isShaking ? {
        rotate: [0, -15, 15, -10, 10, -5, 5, 0],
        transition: { duration: 0.6, repeat: 2 }
      } : {}}
      initial={isAnimating ? { y: 300, scale: 0.3, opacity: 0 } : {}}
      transition={isAnimating ? { 
        duration: 0.8, 
        ease: [0.25, 0.46, 0.45, 0.94]
      } : {}}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
        {/* Top red half */}
        <path
          d="M 50 5 A 45 45 0 0 1 95 50 L 5 50 A 45 45 0 0 1 50 5"
          fill="hsl(0, 85%, 55%)"
          stroke="hsl(220, 20%, 15%)"
          strokeWidth="3"
        />
        
        {/* Bottom white half */}
        <path
          d="M 50 95 A 45 45 0 0 1 5 50 L 95 50 A 45 45 0 0 1 50 95"
          fill="hsl(0, 0%, 95%)"
          stroke="hsl(220, 20%, 15%)"
          strokeWidth="3"
        />
        
        {/* Middle black band */}
        <rect
          x="5"
          y="46"
          width="90"
          height="8"
          fill="hsl(220, 20%, 15%)"
        />
        
        {/* Center button outer ring */}
        <circle
          cx="50"
          cy="50"
          r="14"
          fill="hsl(220, 20%, 15%)"
        />
        
        {/* Center button */}
        <circle
          cx="50"
          cy="50"
          r="10"
          fill="hsl(0, 0%, 95%)"
          className="transition-all duration-300"
        />
        
        {/* Center button inner */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill="hsl(0, 0%, 85%)"
        />
        
        {/* Highlight on red part */}
        <ellipse
          cx="35"
          cy="25"
          rx="12"
          ry="8"
          fill="hsl(0, 85%, 70%)"
          opacity="0.6"
        />
        
        {/* Small highlight */}
        <circle
          cx="28"
          cy="20"
          r="4"
          fill="white"
          opacity="0.7"
        />
      </svg>
    </motion.div>
  );
};

export default Pokeball;
