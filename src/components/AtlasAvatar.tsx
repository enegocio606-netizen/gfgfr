import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AtlasAvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  isSleeping?: boolean;
  theme?: 'cyan' | 'orange' | 'purple' | 'green';
  assistantName?: string;
  isJarvis?: boolean;
}

const themeColors = {
  cyan: {
    accentColor: 'rgba(34, 211, 238, 1)',
    accentGlow: 'rgba(34, 211, 238, 0.4)',
    accentMouthShadow: 'rgba(34, 211, 238, 0.8)',
    accentBgColor: 'bg-cyan-500',
    accentTextColor: 'text-cyan-400',
    accentMouthBg: 'bg-cyan-400',
  },
  orange: {
    accentColor: 'rgba(249, 115, 22, 1)',
    accentGlow: 'rgba(249, 115, 22, 0.4)',
    accentMouthShadow: 'rgba(249, 115, 22, 0.8)',
    accentBgColor: 'bg-orange-500',
    accentTextColor: 'text-orange-500',
    accentMouthBg: 'bg-orange-500',
  },
  purple: {
    accentColor: 'rgba(168, 85, 247, 1)',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    accentMouthShadow: 'rgba(168, 85, 247, 0.8)',
    accentBgColor: 'bg-purple-500',
    accentTextColor: 'text-purple-400',
    accentMouthBg: 'bg-purple-500',
  },
  green: {
    accentColor: 'rgba(34, 197, 94, 1)',
    accentGlow: 'rgba(34, 197, 94, 0.4)',
    accentMouthShadow: 'rgba(34, 197, 94, 0.8)',
    accentBgColor: 'bg-green-500',
    accentTextColor: 'text-green-400',
    accentMouthBg: 'bg-green-500',
  },
};

const AtlasAvatar: React.FC<AtlasAvatarProps> = ({ 
  isSpeaking, 
  isThinking, 
  isSleeping = false,
  theme = 'cyan',
  assistantName = "ATLAS",
  isJarvis = false
}) => {
  const [mouthHeight, setMouthHeight] = React.useState(6);
  const [isBlinking, setIsBlinking] = React.useState(false);

  const colors = themeColors[isJarvis ? 'orange' : theme];

  React.useEffect(() => {
    if (isSleeping) return;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200 + Math.random() * 100);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  React.useEffect(() => {
    if (!isSpeaking) {
      setMouthHeight(6);
      return;
    }

    const interval = setInterval(() => {
      setMouthHeight(Math.random() * 30 + 10);
    }, 100);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="relative flex items-center justify-center w-80 h-80">
      {/* 1. Global Environmental Glow */}
      <motion.div
        className={`absolute inset-0 rounded-full ${colors.accentBgColor}/10 blur-3xl`}
        animate={{
          scale: isSpeaking ? [1, 1.3, 1] : isSleeping ? [1, 1.05, 1] : [1, 1.1, 1],
          opacity: isSpeaking ? [0.2, 0.5, 0.2] : isSleeping ? [0.05, 0.15, 0.05] : [0.1, 0.25, 0.1],
        }}
        transition={{ duration: isSleeping ? 4 : 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 3. Central Visual Core (With subtle breathing movement) */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center gap-12"
        animate={{ y: isSleeping ? 0 : [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        
        {/* EYES SECTION */}
        <div className="flex gap-20">
          {[0, 1].map((i) => (
            <div key={i} className="relative w-14 h-8 flex items-center justify-center">
              {/* Eye Glow Layer */}
              <motion.div
                className={`absolute inset-0 blur-xl rounded-full`}
                style={{ backgroundColor: colors.accentGlow }}
                animate={{
                  opacity: isSleeping ? 0.1 : 0.6,
                  scale: isSpeaking ? 1.3 : 1,
                }}
              />
              
              {/* SVG Eye */}
              <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                <motion.path
                  d={isSleeping || isBlinking ? "M 10 20 Q 50 20 90 20" : "M 10 20 Q 50 -10 90 20 Q 50 50 10 20"}
                  fill={isSleeping || isBlinking ? "transparent" : colors.accentGlow}
                  stroke={colors.accentColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{
                    d: isSleeping || isBlinking 
                      ? "M 10 20 Q 50 20 90 20" 
                      : isSpeaking
                        ? "M 10 20 Q 50 -20 90 20 Q 50 60 10 20"
                        : "M 10 20 Q 50 -10 90 20 Q 50 50 10 20",
                    filter: isSpeaking ? `drop-shadow(0 0 8px ${colors.accentMouthShadow})` : `drop-shadow(0 0 4px ${colors.accentGlow})`
                  }}
                  transition={{ 
                    duration: 0.2,
                    ease: "easeInOut"
                  }}
                />
              </svg>

              {/* Processing Indicator (Thinking) */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    className="absolute -inset-4 border-2 border-transparent border-t-cyan-300 rounded-full"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* MOUTH SECTION */}
        <div className="w-32 h-10 flex items-center justify-center">
          <motion.div 
            id="atlas-mouth"
            className={`w-24 ${colors.accentMouthBg} rounded-full`}
            animate={{
              height: mouthHeight,
              opacity: isSleeping ? 0.2 : 0.8,
              boxShadow: `0 0 15px ${colors.accentMouthShadow}`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </div>
        
        {/* Intelligence Status Text */}
        <motion.div 
          className="flex flex-col items-center gap-2 mt-4"
          animate={{ opacity: isSleeping ? 0.3 : 1 }}
        >
          <div className="flex items-center gap-3">
             <div className={`h-[1px] w-8 bg-gradient-to-r from-transparent to-${theme}-500/40`} />
             <span className={`${colors.accentTextColor} font-mono text-[10px] tracking-[0.4em] uppercase`}>
                {isSleeping ? 'SISTEMA_DORMINDO' : isSpeaking ? 'EMITINDO_VOZ' : isThinking ? 'PROCESSANDO_DADOS' : 'NÚCLEO_ATIVO'}
             </span>
             <div className={`h-[1px] w-8 bg-gradient-to-l from-transparent to-${theme}-500/40`} />
          </div>
        </motion.div>
      </motion.div>

      {/* Sleeping Particles (Zzz effect simulation) */}
      <AnimatePresence>
        {isSleeping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                className={`${colors.accentTextColor}/40 font-black absolute`}
                initial={{ x: 20, y: 0, opacity: 0, scale: 0.5 }}
                animate={{ 
                  x: [20, 60, 40], 
                  y: [-20, -70, -120], 
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.2, 1.5]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: i * 1.5,
                  ease: "easeOut"
                }}
                style={{ right: '20%', top: '35%' }}
              >
                Z
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative ID Label */}
      <div className="absolute -bottom-12 flex flex-col items-center opacity-30">
        <span className={`text-[7px] font-mono ${colors.accentTextColor} tracking-[0.5em] uppercase`}>
          {assistantName} Intelligence OS
        </span>
      </div>
    </div>
  );
};

export default AtlasAvatar;
