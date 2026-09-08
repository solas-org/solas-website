/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, memo } from 'react';

interface WavyStripesProps {
  opacity?: number;
  color?: string;
  className?: string;
  speed?: number;
  strokeWidth?: number;
}

function WavyStripesComponent({ 
  opacity = 0.8, 
  color = 'rgba(208, 188, 255, 0.45)', 
  className = '',
  speed = 5,
  strokeWidth = 6
}: WavyStripesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Pause animation when scrolled offscreen to save GPU cycles
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '120px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-20 overflow-hidden select-none pointer-events-none contain-strict ${className}`}
      style={{ contentVisibility: 'auto' }}
    >
      <svg 
        className="w-full h-full min-w-[2160px] absolute left-0"
        viewBox="0 0 2160 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <g
          className="animate-wavy-slide"
          style={{
            animationDuration: `${speed}s`,
            animationPlayState: isInView ? 'running' : 'paused',
            opacity,
            willChange: 'transform',
          }}
        >
          <path
            d="M0 40 Q 45 10, 90 40 T 180 40 T 270 40 T 360 40 T 450 40 T 540 40 T 630 40 T 720 40 T 810 40 T 900 40 T 990 40 T 1080 40 T 1170 40 T 1260 40 T 1350 40 T 1440 40 T 1530 40 T 1620 40 T 1710 40 T 1800 40 T 1890 40 T 1980 40 T 2070 40 T 2160 40"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

export default memo(WavyStripesComponent);
