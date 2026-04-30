import React, { useMemo } from 'react';
import { motion } from 'motion/react';

const DigitalParticles: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-400/20"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -200, 0],
            x: [0, 50, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
      
      {/* Decorative vertical lines */}
      <div className="absolute inset-0 jarvis-grid opacity-10" />
      <div className="absolute inset-y-0 left-[20%] w-[1px] bg-cyan-400/5 shadow-[0_0_20px_rgba(0,242,255,0.1)]" />
      <div className="absolute inset-y-0 right-[20%] w-[1px] bg-cyan-400/5 shadow-[0_0_20px_rgba(0,242,255,0.1)]" />
    </div>
  );
};

export default DigitalParticles;
