import { motion } from 'framer-motion';
import { Pokemon } from '@/types/pokemon';

interface PokemonCardProps {
  pokemon: Pokemon;
  capturedAt?: string;
  onClick?: () => void;
}

const PokemonCard = ({ pokemon, capturedAt, onClick }: PokemonCardProps) => {
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-pokemon-yellow/50 shadow-glow-yellow';
      case 'rare':
        return 'border-pokemon-purple/50';
      case 'uncommon':
        return 'border-pokemon-blue/50 shadow-glow-blue';
      default:
        return 'border-pokemon-green/50';
    }
  };

  const getRarityBadgeStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-pokemon-yellow text-background';
      case 'rare':
        return 'bg-pokemon-purple text-foreground';
      case 'uncommon':
        return 'bg-pokemon-blue text-foreground';
      default:
        return 'bg-pokemon-green text-background';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`pokemon-card cursor-pointer border-2 ${getRarityStyles(pokemon.rarity)}`}
    >
      <div className="relative">
        <motion.img
          src={pokemon.image_url}
          alt={pokemon.name}
          className="w-full h-32 object-contain"
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
        
        <span className={`absolute top-0 right-0 px-2 py-1 text-xs font-display uppercase rounded-bl-lg ${getRarityBadgeStyles(pokemon.rarity)}`}>
          {pokemon.rarity}
        </span>
      </div>
      
      <div className="mt-3 text-center">
        <h3 className="font-body text-lg font-semibold text-foreground">
          {pokemon.name}
        </h3>
        
        {capturedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Capturado: {new Date(capturedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PokemonCard;
