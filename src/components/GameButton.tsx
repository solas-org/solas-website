import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
}

interface GameButtonProps {
  children: React.ReactNode;
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  disabled?: boolean;
}

function GameButtonComponent({
  children,
  id,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
}: GameButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeoutRefs = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Choose colors based on the button theme
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-m3-primary text-m3-onPrimary border-[3px] border-m3-primary/30 hover:border-m3-primary/60',
          border: 'border-m3-primary/20',
          particleList: ['#EADDFF', '#D0BCFF', '#EFB8C8', '#86E3CE'],
        };
      case 'secondary':
        return {
          bg: 'bg-m3-secondary hover:bg-[#bebee0] text-m3-onSecondary border-[3px] border-m3-secondary/30 hover:border-m3-secondary/60',
          border: 'border-m3-secondary/20',
          particleList: ['#E8DEF8', '#CCC2DC', '#9ED5FF'],
        };
      case 'tertiary':
        return {
          bg: 'bg-m3-tertiary hover:bg-[#efa6ba] text-m3-onTertiary border-[3px] border-m3-tertiary/30 hover:border-m3-tertiary/60',
          border: 'border-m3-tertiary/20',
          particleList: ['#FFD8E4', '#EFB8C8', '#FFB1C8'],
        };
      case 'outline':
        return {
          bg: 'bg-transparent hover:bg-white/5 text-m3-primary border-[3px] border-m3-primary/30 hover:border-m3-primary/60',
          border: 'border-m3-primary/20',
          particleList: ['#D0BCFF', '#CCC2DC', '#EFB8C8'],
        };
    }
  };

  const colors = getColors();

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Get click location relative to button element
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Generate dynamic pixel/particle streams
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() * 0.4 - 0.2);
      const speed = 40 + Math.random() * 50; // distance they fly
      const size = 3 + Math.floor(Math.random() * 3); // pixel size (3px - 6px)
      const color = colors.particleList[Math.floor(Math.random() * colors.particleList.length)];
      
      return {
        id: Date.now() + i + Math.random(),
        x: clickX,
        y: clickY,
        tx: Math.cos(angle) * speed,
        ty: Math.sin(angle) * speed - (15 + Math.random() * 20),
        size,
        color,
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    // Cleanup particles after animation is completed
    const t = window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 850);
    timeoutRefs.current.push(t);

    // Call upstream click callback
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div className="relative inline-block overflow-visible select-none">
      <motion.button
        id={id}
        disabled={disabled}
        onClick={handleTriggerClick}
        whileHover={{ 
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        }}
        whileTap={{ 
          scale: 0.94,
          y: 1,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 450, 
          damping: 15,
          mass: 0.8,
        }}
        className={`relative px-6 py-3 font-mono font-bold text-xs tracking-wider uppercase m3-btn-expressive cursor-pointer flex items-center justify-center gap-2 select-none active:outline-none focus:outline-none outline-none overflow-hidden ${colors.bg} ${className}`}
      >
        {/* Subtle grid pattern background inside button on hover */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 bg-grid-pattern" />
        
        {children}
      </motion.button>

      {/* Render flying interactive particles absolutely over/outside the button boundaries */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ 
                x: p.x, 
                y: p.y, 
                opacity: 0.9, 
                scale: 1, 
                rotate: 0 
              }}
              animate={{ 
                x: p.x + p.tx, 
                y: p.y + p.ty, 
                opacity: 0, 
                scale: 0, 
                rotate: Math.random() * 360 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.7, 
                ease: [0.1, 0.8, 0.25, 1]
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '1px' : '0px',
                boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(GameButtonComponent);
