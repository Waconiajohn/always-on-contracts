import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIBrainAnimationProps {
  progress?: number;
}

export const AIBrainAnimation = ({ progress = 0 }: AIBrainAnimationProps) => {
  const glowIntensity = 0.3 + (progress / 100) * 0.4;
  
  return (
    <div className="relative mx-auto w-48 h-48">
      {/* Particle effects */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: '50%',
            left: '50%'
          }}
          animate={{
            x: [0, Math.cos((i * Math.PI * 2) / 12) * 80],
            y: [0, Math.sin((i * Math.PI * 2) / 12) * 80],
            opacity: [1, 0],
            scale: [1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Outer glow ring */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl"
        animate={{
          opacity: [glowIntensity, glowIntensity + 0.2, glowIntensity],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Middle pulse ring */}
      <motion.div 
        className="absolute inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-60"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Core brain with bounce */}
      <motion.div
        className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-48 h-48 flex items-center justify-center shadow-2xl"
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 3, -3, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="w-24 h-24 text-white drop-shadow-2xl" />
        </motion.div>
      </motion.div>
      
      {/* Progress indicator ring */}
      {progress > 0 && (
        <svg className="absolute inset-0 w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="90"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress / 100) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      )}
    </div>
  );
};
