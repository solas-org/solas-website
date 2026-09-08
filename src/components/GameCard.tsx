/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

interface GameCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: 'primary' | 'secondary' | 'tertiary';
  id?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

function GameCardComponent({ children, className = '', accent = 'primary', id, onClick }: GameCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for spotlight and shadow offset
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Springs for snappy, elastic physical response
  const springConfig = { stiffness: 180, damping: 15, mass: 1 };

  // Light-cast shadow offset (opposite direction of light)
  const shadowX = useSpring(useTransform(x, [-0.5, 0.5], [12, -12]), springConfig);
  const shadowY = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);

  // Accent colors mapping
  const colors = {
    primary: {
      glow: 'rgba(208, 188, 255, 0.25)',
      spotlight: 'rgba(208, 188, 255, 0.12)',
      border: 'rgba(208, 188, 255, 0.35)',
      bracket: 'border-m3-primary',
      text: 'text-m3-primary',
    },
    secondary: {
      glow: 'rgba(204, 194, 220, 0.25)',
      spotlight: 'rgba(204, 194, 220, 0.12)',
      border: 'rgba(204, 194, 220, 0.35)',
      bracket: 'border-m3-secondary',
      text: 'text-m3-secondary',
    },
    tertiary: {
      glow: 'rgba(239, 184, 200, 0.25)',
      spotlight: 'rgba(239, 184, 200, 0.12)',
      border: 'rgba(239, 184, 200, 0.35)',
      bracket: 'border-m3-tertiary',
      text: 'text-m3-tertiary',
    },
  }[accent];

  // Direct DOM property binding for spring shadow coordinates (0 React re-renders during motion ticks)
  useEffect(() => {
    const unsubX = shadowX.on('change', (val) => {
      cardRef.current?.style.setProperty('--shadow-x', `${val}px`);
    });
    const unsubY = shadowY.on('change', (val) => {
      cardRef.current?.style.setProperty('--shadow-y', `${val}px`);
    });
    return () => {
      unsubX();
      unsubY();
    };
  }, [shadowX, shadowY]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = rectRef.current || cardRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    
    cardRef.current.style.setProperty('--spot-x', `${localX}px`);
    cardRef.current.style.setProperty('--spot-y', `${localY}px`);

    // Normalize values between -0.5 and 0.5
    const normX = (localX / rect.width) - 0.5;
    const normY = (localY / rect.height) - 0.5;

    x.set(normX);
    y.set(normY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  const isFlex = className.includes('flex');
  const isCol = className.includes('flex-col');
  const isItemsCenter = className.includes('items-center');
  const isJustifyBetween = className.includes('justify-between');
  const isTextCenter = className.includes('text-center');

  const innerClass = `relative z-10 h-full w-full pointer-events-auto ${
    isFlex ? 'flex' : ''
  } ${
    isCol ? 'flex-col' : ''
  } ${
    isItemsCenter ? 'items-center' : ''
  } ${
    isJustifyBetween ? 'justify-between' : ''
  } ${
    isTextCenter ? 'text-center' : ''
  }`;

  return (
    <motion.div
      ref={cardRef}
      id={id}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        boxShadow: isHovered 
          ? `var(--shadow-x, 0px) var(--shadow-y, 10px) 25px -5px ${colors.glow}, inset 0 0 15px rgba(255,255,255,0.02)` 
          : '0 10px 30px -10px rgba(0,0,0,0.5)',
      }}
      className={`relative rounded-2xl m3-glass p-6 overflow-hidden transition-[box-shadow,border-color] duration-300 group contain-paint ${className}`}
    >
      {/* Google Expressive Material Design Spinning Rainbow Border Glow on Hover */}
      <div 
        className="absolute -inset-[1px] rounded-2xl pointer-events-none transition-opacity duration-500 overflow-hidden z-0"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <div 
          className={`absolute -inset-[300%] ${isHovered ? 'animate-[spin_6s_linear_infinite]' : ''}`}
          style={{
            background: 'conic-gradient(from 0deg, var(--color-m3-primary) 0deg, var(--color-m3-tertiary) 72deg, var(--color-m3-secondary) 144deg, var(--color-m3-onTertiaryContainer) 216deg, var(--color-m3-onPrimaryContainer) 288deg, var(--color-m3-primary) 360deg)',
            filter: 'blur(3px)',
            opacity: 0.95,
          }}
        />
        {/* Solid inner mask that keeps the card interior clean glass while showing ONLY a crisp edge border glow */}
        <div className="absolute inset-[3px] rounded-[14px] bg-[#141218] z-0" />
      </div>

      {/* Compiler Rendering Coordinate Grid (transparency changes based on cursor location/hover) */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          WebkitMaskImage: `radial-gradient(circle 220px at var(--spot-x, 0px) var(--spot-y, 0px), rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.06) 80%)`,
          maskImage: `radial-gradient(circle 220px at var(--spot-x, 0px) var(--spot-y, 0px), rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.06) 80%)`,
        }}
      />

      {/* Assembly corner brackets matching panel curvature */}
      <div className="absolute inset-0 pointer-events-none z-1">
        {/* Top-Left Bracket */}
        <span
          className={`absolute w-4 h-4 border-t-3 border-l-3 rounded-tl-md ${colors.bracket} transition-all duration-300 ease-out`}
          style={{
            top: isHovered ? '8px' : '-4px',
            left: isHovered ? '8px' : '-4px',
            opacity: isHovered ? 1 : 0.2,
          }}
        />
        {/* Top-Right Bracket */}
        <span
          className={`absolute w-4 h-4 border-t-3 border-r-3 rounded-tr-md ${colors.bracket} transition-all duration-300 ease-out`}
          style={{
            top: isHovered ? '8px' : '-4px',
            right: isHovered ? '8px' : '-4px',
            opacity: isHovered ? 1 : 0.2,
          }}
        />
        {/* Bottom-Left Bracket */}
        <span
          className={`absolute w-4 h-4 border-b-3 border-l-3 rounded-bl-md ${colors.bracket} transition-all duration-300 ease-out`}
          style={{
            bottom: isHovered ? '8px' : '-4px',
            left: isHovered ? '8px' : '-4px',
            opacity: isHovered ? 1 : 0.2,
          }}
        />
        {/* Bottom-Right Bracket */}
        <span
          className={`absolute w-4 h-4 border-b-3 border-r-3 rounded-br-md ${colors.bracket} transition-all duration-300 ease-out`}
          style={{
            bottom: isHovered ? '8px' : '-4px',
            right: isHovered ? '8px' : '-4px',
            opacity: isHovered ? 1 : 0.2,
          }}
        />
      </div>

      {/* Main card children content */}
      <div className={innerClass}>
        {children}
      </div>
    </motion.div>
  );
}

export default memo(GameCardComponent);
