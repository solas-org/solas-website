/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, memo } from 'react';

type ShapeType = 'arch' | 'semicircle' | 'slanted' | 'triangle' | 'diamond' | 'flower' | 'cookie' | 'clover' | 'bun' | 'pill' | 'heart';
type ColorType = 'primary' | 'tertiary' | 'rose';
type DepthType = 'far' | 'mid' | 'front';

interface ShapeItem {
  id: number;
  type: ShapeType;
  size: number;
  x: number; // %
  y: number; // %
  vx: number;
  vy: number;
  maxSpeed: number;
  force: number;
  isAggressive: boolean;
  scale: number;
  isEaten: boolean;
  rotation: number;
  rotSpeed: number;
  flashActive: boolean;
  colorType: ColorType;
  depth: DepthType;
}

// ---------------------------------------------------------
// CONSTANTS & PATH2D CACHE
// ---------------------------------------------------------
const DEG_TO_RAD = Math.PI / 180;

const SVG_PATH_STRINGS: Record<ShapeType, string> = {
  arch: 'M 20 80 V 50 A 30 30 0 0 1 80 50 V 80 Z',
  semicircle: 'M 15 70 A 35 35 0 0 1 85 70 Z',
  slanted: 'M 35 22 C 40 22, 78 22, 81 22 C 85 22, 87 25, 85 29 L 71 73 C 69 77, 66 79, 61 79 H 22 C 16 79, 13 75, 15 70 L 27 29 C 29 25, 31 22, 35 22 Z',
  triangle: 'M 50 18 C 55 18, 59 21, 84 66 C 87 71, 84 78, 78 78 H 22 C 16 78, 13 71, 16 66 L 44 21 C 45 18, 47 18, 50 18 Z',
  diamond: 'M 50 15 Q 53 15 56 18 L 81 44 Q 84 47 81 50 L 56 75 Q 53 78 50 78 Q 47 78 44 75 L 19 50 Q 16 47 19 44 L 44 18 Q 47 15 50 15 Z',
  flower: 'M 50 15 C 57 15 62 25 65 28 C 72 25 80 30 77 37 C 84 40 84 49 77 52 C 80 59 72 64 65 61 C 62 64 57 74 50 74 C 43 74 38 64 35 61 C 28 64 20 59 23 52 C 16 49 16 40 23 37 C 20 30 28 25 35 28 C 38 25 43 15 50 15 Z',
  cookie: 'M 50 15 C 62 25, 75 25, 85 50 C 75 75, 62 75, 50 85 C 38 75, 25 75, 15 50 C 25 25, 38 25, 50 15 Z',
  clover: 'M 50 50 C 35 25, 65 25, 50 50 C 75 35, 75 65, 50 50 C 65 75, 35 75, 50 50 C 25 65, 25 35, 50 50 Z',
  bun: 'M 25 50 C 25 35, 45 30, 50 42 C 55 30, 75 35, 75 50 C 75 65, 55 70, 50 58 C 45 70, 25 65, 25 50 Z',
  pill: 'M 30 30 H 70 C 80 30, 80 70, 70 70 H 30 C 20 70, 20 30, 30 30 Z',
  heart: 'M 50 30 C 50 15, 20 12, 20 40 C 20 62, 45 78, 50 82 C 55 78, 80 62, 80 40 C 80 12, 50 15, 50 30 Z',
};

const SHAPE_TYPES: ShapeType[] = Object.keys(SVG_PATH_STRINGS) as ShapeType[];
const PATH2D_MAP: Record<ShapeType, Path2D> = (() => {
  const map = {} as Record<ShapeType, Path2D>;
  for (const type of SHAPE_TYPES) {
    if (typeof Path2D !== 'undefined') {
      map[type] = new Path2D(SVG_PATH_STRINGS[type]);
    }
  }
  return map;
})();

const SHAPE_COLORS = {
  primary: { fill: 'rgba(208, 188, 255, 0.16)', stroke: 'rgba(208, 188, 255, 0.42)' },
  tertiary: { fill: 'rgba(239, 184, 200, 0.16)', stroke: 'rgba(239, 184, 200, 0.42)' },
  rose: { fill: 'rgba(244, 63, 94, 0.32)', stroke: 'rgba(251, 113, 133, 0.45)' },
  white: { fill: 'rgba(255, 255, 255, 0.95)', stroke: '#ffffff' },
};

const PARTICLE_COLORS_ROSE = ['#f43f5e', '#fda4af', '#e11d48'];
const PARTICLE_COLORS_NEUTRAL = ['#d0bcff', '#efb8c8', '#86e3ce', '#c2aeff'];

// ---------------------------------------------------------
// MOBILE DETECTION HOOK (Zero-listener leaks)
// ---------------------------------------------------------
function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= breakpointPx ||
      window.matchMedia('(pointer: coarse)').matches
    );
  });

  useEffect(() => {
    const widthMql = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const pointerMql = window.matchMedia('(pointer: coarse)');

    const update = () => setIsMobile(widthMql.matches || pointerMql.matches);

    widthMql.addEventListener('change', update);
    pointerMql.addEventListener('change', update);
    return () => {
      widthMql.removeEventListener('change', update);
      pointerMql.removeEventListener('change', update);
    };
  }, [breakpointPx]);

  return isMobile;
}

// ---------------------------------------------------------
// 1. HARDWARE-OPTIMIZED ASCII WAVES COMPONENT
// Fixed to Viewport + Batched Row fillText (250x fewer draw calls) + 30 FPS Cap
// ---------------------------------------------------------
const AsciiWaveCanvas = memo(function AsciiWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.active = true;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let animationFrameId: number;
    let w = 0;
    let h = 0;
    let charWidth = 7.8;
    let isVisible = !document.hidden;

    const characters = [' ', '.', ':', '-', '+', '*', '=', '%', '@', '#'];
    const rampMax = characters.length - 1;
    const cell = 13;
    const interactionRadius = 140;
    const interactionRadiusSq = interactionRadius * interactionRadius;
    const invInteractionRadius = 1 / interactionRadius;
    const fontStr = `600 ${cell}px ui-monospace, SFMono-Regular, Consolas, monospace`;

    let rowChars: string[] = [];

    const updateDimensions = () => {
      const targetW = window.innerWidth;
      const targetH = window.innerHeight;

      if (targetW !== w || targetH !== h) {
        w = targetW;
        h = targetH;
        // Viewport canvas at DPR 1.0 for sharp, crisp monospace text with minimal GPU memory
        const dpr = Math.min(1.0, window.devicePixelRatio || 1);
        canvas.width = (w * dpr) | 0;
        canvas.height = (h * dpr) | 0;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = fontStr;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(208, 188, 255, 0.22)';
        charWidth = ctx.measureText('M').width || 7.8;

        const cols = ((w / charWidth) | 0) + 1;
        rowChars = new Array(cols);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions, { passive: true });

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible && !animationFrameId) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const startTime = performance.now();
    let lastDrawTime = 0;
    const frameInterval = 1000 / 30; // 30 FPS cap for background ASCII wave (cuts CPU load in half)

    const draw = (now: number) => {
      animationFrameId = requestAnimationFrame(draw);

      if (!isVisible || w <= 0 || h <= 0) return;

      const elapsed = now - lastDrawTime;
      if (elapsed < frameInterval) return;
      lastDrawTime = now - (elapsed % frameInterval);

      ctx.clearRect(0, 0, w, h);

      const totalRows = ((h / cell) | 0) + 1;
      const cols = ((w / charWidth) | 0) + 1;
      if (rowChars.length !== cols) {
        rowChars = new Array(cols);
      }

      const t = (now - startTime) * 0.0005;
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const scrollDrift = currentScrollY * 0.0006;
      const oy = -t * 0.5 + scrollDrift;
      const waveT = t * 0.1;
      const p = pointerRef.current;

      // Batched row rendering: 1 ctx.fillText per row instead of 20,000 individual calls
      for (let j = 0; j < totalRows; j++) {
        const py = j * cell;
        const jTwist = Math.sin((j + t) * 0.1) * 2;
        const jScaleOy = j * 0.08 + oy;

        for (let i = 0; i < cols; i++) {
          const px = i * charWidth;
          const iTwist = Math.cos((i + t) * 0.1) * 2;
          const nx = i * 0.08 + jTwist;
          const ny = jScaleOy + iTwist;

          let v = (
            Math.sin(nx * 1.3 + waveT) * Math.cos(ny * 1.1 - waveT * 0.7) +
            Math.sin((nx + ny) * 0.7 + waveT * 0.5) +
            Math.sin(nx * 0.4 - ny * 0.6 + waveT * 0.3)
          ) * 0.33333;

          if (p.active) {
            const dx = px - p.x;
            const dy = py - p.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < interactionRadiusSq) {
              const d = Math.sqrt(dSq);
              const falloff = 1 - d * invInteractionRadius;
              v += Math.sin(d * 0.08 - t * 4) * falloff;
            }
          }

          const norm = (v * 0.6 + 1) * 0.5;
          if (norm > 0.05) {
            const chIdx = (norm * rampMax + 0.5) | 0;
            rowChars[i] = characters[chIdx < rampMax ? (chIdx > 0 ? chIdx : 0) : rampMax];
          } else {
            rowChars[i] = ' ';
          }
        }

        ctx.fillText(rowChars.join(''), 0, py);
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-45 select-none contain-strict">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
});

// ---------------------------------------------------------
// 2. HARDWARE-OPTIMIZED INTERACTIVE SHAPES & PARTICLES
// Fixed to Viewport + Optimized Entities + Zero Multi-megabyte Texture Allocations
// ---------------------------------------------------------
const MAX_PARTICLES = 160;
const MAX_SHOCKWAVES = 25;

const InteractiveShapesCanvas = memo(function InteractiveShapesCanvas({ activeTab }: { activeTab: 'landing' | 'docs' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shapesRef = useRef<ShapeItem[]>([]);
  const nextShapeId = useRef(0);

  // Flat typed arrays: [x, y, vx, vy, size, opacity, colorIdx]
  const particlesData = useRef(new Float32Array(MAX_PARTICLES * 7));
  const particleColors = useRef<string[]>(new Array(MAX_PARTICLES).fill(''));
  const particleCount = useRef(0);

  // Shockwaves flat: [x, y, size, opacity, isAggressive]
  const shockwavesData = useRef(new Float32Array(MAX_SHOCKWAVES * 5));
  const shockwaveCount = useRef(0);

  const mousePosRef = useRef({ x: -9999, y: -9999 });
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const winWRef = useRef(1920);
  const winHRef = useRef(1080);

  const createRandomShape = (isAggressive = false, borderSpawn = false): ShapeItem => {
    const type = SHAPE_TYPES[(Math.random() * SHAPE_TYPES.length) | 0];
    const depthRoll = Math.random();
    const depth: DepthType = isAggressive ? 'front' : (depthRoll < 0.25 ? 'far' : depthRoll > 0.75 ? 'front' : 'mid');

    const baseSize = isAggressive ? 30 + Math.random() * 18 : 22 + Math.random() * 12;
    const size = depth === 'far' ? baseSize * 0.75 : depth === 'front' ? baseSize * 1.2 : baseSize;

    let x = Math.random() * 86 + 7;
    let y = Math.random() * 86 + 7;
    if (borderSpawn) {
      if (Math.random() > 0.5) {
        x = Math.random() > 0.5 ? -2 : 102;
        y = Math.random() * 100;
      } else {
        x = Math.random() * 100;
        y = Math.random() > 0.5 ? -2 : 102;
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const speedMult = depth === 'far' ? 0.4 : depth === 'front' ? 0.8 : 0.6;
    const maxSpeed = (isAggressive ? 0.038 + Math.random() * 0.04 : 0.024 + Math.random() * 0.04) * speedMult;
    const force = (isAggressive ? 0.0012 + Math.random() * 0.002 : 0.0006 + Math.random() * 0.0012) * speedMult;
    const initialSpeed = maxSpeed * (0.3 + Math.random() * 0.2);

    return {
      id: nextShapeId.current++,
      type,
      size,
      x,
      y,
      vx: Math.cos(angle) * initialSpeed,
      vy: Math.sin(angle) * initialSpeed,
      maxSpeed,
      force,
      isAggressive,
      scale: 1,
      isEaten: false,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
      flashActive: false,
      colorType: isAggressive ? 'rose' : (Math.random() > 0.5 ? 'primary' : 'tertiary'),
      depth,
    };
  };

  const triggerExplosion = (shape: ShapeItem, clientX: number, clientY: number) => {
    // Add Shockwave
    if (shockwaveCount.current < MAX_SHOCKWAVES) {
      const idx = shockwaveCount.current * 5;
      const data = shockwavesData.current;
      data[idx] = clientX;
      data[idx + 1] = clientY;
      data[idx + 2] = shape.size * 0.5;
      data[idx + 3] = 0.95; // opacity
      data[idx + 4] = shape.isAggressive ? 1 : 0;
      shockwaveCount.current++;
    }

    // Add Particles
    const count = 12 + ((Math.random() * 6) | 0);
    const colorPalette = shape.isAggressive ? PARTICLE_COLORS_ROSE : PARTICLE_COLORS_NEUTRAL;
    const pData = particlesData.current;
    const pColors = particleColors.current;

    for (let i = 0; i < count; i++) {
      if (particleCount.current >= MAX_PARTICLES) break;
      const pIdx = particleCount.current * 7;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;

      pData[pIdx] = clientX;
      pData[pIdx + 1] = clientY;
      pData[pIdx + 2] = Math.cos(angle) * speed;
      pData[pIdx + 3] = Math.sin(angle) * speed;
      pData[pIdx + 4] = 3 + Math.random() * 5; // size
      pData[pIdx + 5] = 1.0; // opacity
      pColors[particleCount.current] = colorPalette[(Math.random() * colorPalette.length) | 0];
      particleCount.current++;
    }
  };

  useEffect(() => {
    // 16 neutral and 4 aggressive shapes in viewport (optimal density without clutter or lag)
    const initial: ShapeItem[] = [];
    for (let i = 0; i < 16; i++) initial.push(createRandomShape(false));
    for (let i = 0; i < 4; i++) initial.push(createRandomShape(true));
    shapesRef.current = initial;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = e.clientX;
      mousePosRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [role="button"], code, pre, .clickable')) return;

      const clickX = e.clientX;
      const clickY = e.clientY;
      const winW = winWRef.current;
      const winH = winHRef.current;
      const shapes = shapesRef.current;

      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.isEaten) continue;

        const centerX = (s.x * 0.01) * winW + s.size * 0.5;
        const centerY = (s.y * 0.01) * winH + s.size * 0.5;
        const radius = (s.size * 0.5) * s.scale + 20;

        const dx = clickX - centerX;
        const dy = clickY - centerY;
        if (dx * dx + dy * dy <= radius * radius) {
          triggerExplosion(s, centerX, centerY);
          s.isEaten = true;
          break;
        }
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let isVisible = !document.hidden;

    const updateDimensions = () => {
      const targetW = window.innerWidth;
      const targetH = window.innerHeight;

      winWRef.current = targetW;
      winHRef.current = targetH;

      const dpr = Math.min(1.25, window.devicePixelRatio || 1);
      canvas.width = (targetW * dpr) | 0;
      canvas.height = (targetH * dpr) | 0;
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions, { passive: true });

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        if (!animationFrameId) animationFrameId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loop = (now: number) => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }

      const dtMs = Math.min(33.33, now - lastTime);
      lastTime = now;
      const dt = dtMs * 0.03;

      const winW = winWRef.current;
      const winH = winHRef.current;

      if (winW <= 0 || winH <= 0) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Clear viewport canvas directly
      ctx.clearRect(0, 0, winW, winH);

      const isDocs = activeTabRef.current === 'docs';
      const globalAlphaFactor = isDocs ? 0.2 : 1.0;

      const mouseClientX = mousePosRef.current.x;
      const mouseClientY = mousePosRef.current.y;
      const mouseVw = (mouseClientX / winW) * 100;
      const mouseVh = (mouseClientY / winH) * 100;

      const shapes = shapesRef.current;
      const shapeLen = shapes.length;
      let neutralCount = 0;
      let aggressiveCount = 0;

      // 1. PHYSICS & INTERACTIONS
      for (let i = 0; i < shapeLen; i++) {
        const shape = shapes[i];
        if (shape.isEaten) continue;

        if (shape.isAggressive) aggressiveCount++;
        else neutralCount++;

        // Mouse distance
        const dxMouse = shape.x - mouseVw;
        const dyMouse = shape.y - mouseVh;
        const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
        const mouseRadius = 10;

        if (distMouseSq > 0 && distMouseSq < mouseRadius * mouseRadius) {
          const distMouse = Math.sqrt(distMouseSq);
          const forceRatio = ((mouseRadius - distMouse) / mouseRadius) * 0.0018 * dt;
          const mult = shape.isAggressive ? -0.1 : 1.5;
          shape.vx += (dxMouse / distMouse) * forceRatio * mult;
          shape.vy += (dyMouse / distMouse) * forceRatio * mult;
        }

        // Aggressive physics
        if (shape.isAggressive) {
          let closest: ShapeItem | null = null;
          let minDistSq = 1225; // 35 * 35

          for (let j = 0; j < shapeLen; j++) {
            const other = shapes[j];
            if (other.isEaten || other.id === shape.id) continue;

            const dx = other.x - shape.x;
            const dy = other.y - shape.y;
            const distSq = dx * dx + dy * dy;

            if (other.isAggressive && distSq < 36 && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const repelForce = (6 - dist) * 0.003 * dt;
              shape.vx -= (dx / dist) * repelForce;
              shape.vy -= (dy / dist) * repelForce;
            } else if (!other.isAggressive && distSq < minDistSq) {
              minDistSq = distSq;
              closest = other;
            }
          }

          if (closest) {
            const dist = Math.sqrt(minDistSq);
            if (dist > 0) {
              const dx = closest.x - shape.x;
              const dy = closest.y - shape.y;
              shape.vx += (dx / dist) * shape.force * dt;
              shape.vy += (dy / dist) * shape.force * dt;

              const speedSq = shape.vx * shape.vx + shape.vy * shape.vy;
              if (speedSq > shape.maxSpeed * shape.maxSpeed) {
                const speed = Math.sqrt(speedSq);
                shape.vx = (shape.vx / speed) * shape.maxSpeed;
                shape.vy = (shape.vy / speed) * shape.maxSpeed;
              }

              if (dist < 2.5 && !closest.isEaten) {
                closest.isEaten = true;
                shape.scale = 1.35;
                shape.flashActive = true;
                triggerExplosion(closest, (closest.x * 0.01) * winW + closest.size * 0.5, (closest.y * 0.01) * winH + closest.size * 0.5);
              }
            }
          }
        }

        // Position integrate
        shape.x += shape.vx * dt;
        shape.y += shape.vy * dt;
        shape.rotation += shape.rotSpeed * dt;

        if (shape.scale > 1) {
          shape.scale -= 0.025 * dt;
          if (shape.scale <= 1.05) shape.flashActive = false;
        } else {
          shape.scale = 1;
        }

        // Viewport bounce
        if (shape.x < 2) { shape.x = 2; shape.vx = Math.abs(shape.vx); }
        else if (shape.x > 98) { shape.x = 98; shape.vx = -Math.abs(shape.vx); }
        if (shape.y < 2) { shape.y = 2; shape.vy = Math.abs(shape.vy); }
        else if (shape.y > 98) { shape.y = 98; shape.vy = -Math.abs(shape.vy); }
      }

      // Repopulate dead shapes
      if (neutralCount < 14 && Math.random() < 0.05 * dt) shapes.push(createRandomShape(false, true));
      if (aggressiveCount < 4 && Math.random() < 0.03 * dt) shapes.push(createRandomShape(true, true));

      // 2. RENDER SHOCKWAVES
      const sData = shockwavesData.current;
      let activeSw = 0;
      for (let i = 0; i < shockwaveCount.current; i++) {
        const idx = i * 5;
        sData[idx + 2] += 4 * dt; // size
        sData[idx + 3] -= 0.035 * dt; // opacity

        const opacity = sData[idx + 3];
        if (opacity > 0) {
          const swX = sData[idx];
          const swY = sData[idx + 1];
          const swSize = sData[idx + 2];

          ctx.globalAlpha = globalAlphaFactor * opacity;
          ctx.strokeStyle = sData[idx + 4] === 1 ? 'rgba(244, 63, 94, 0.75)' : 'rgba(208, 188, 255, 0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(swX, swY, swSize * 0.5, 0, Math.PI * 2);
          ctx.stroke();

          if (activeSw !== i) {
            for (let k = 0; k < 5; k++) sData[activeSw * 5 + k] = sData[idx + k];
          }
          activeSw++;
        }
      }
      shockwaveCount.current = activeSw;

      // 3. RENDER PARTICLES
      const pData = particlesData.current;
      const pColors = particleColors.current;
      let activeP = 0;
      for (let i = 0; i < particleCount.current; i++) {
        const idx = i * 7;
        pData[idx] += pData[idx + 2] * dt; // x += vx
        pData[idx + 1] += pData[idx + 3] * dt; // y += vy
        pData[idx + 5] -= 0.025 * dt; // opacity

        const opacity = pData[idx + 5];
        if (opacity > 0) {
          ctx.globalAlpha = globalAlphaFactor * opacity;
          ctx.fillStyle = pColors[i];
          ctx.beginPath();
          ctx.arc(pData[idx], pData[idx + 1], pData[idx + 4] * 0.5, 0, Math.PI * 2);
          ctx.fill();

          if (activeP !== i) {
            for (let k = 0; k < 7; k++) pData[activeP * 7 + k] = pData[idx + k];
            pColors[activeP] = pColors[i];
          }
          activeP++;
        }
      }
      particleCount.current = activeP;

      // 4. RENDER SHAPES
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const renderShape = (shape: ShapeItem) => {
        const screenX = (shape.x * 0.01) * winW;
        const screenY = (shape.y * 0.01) * winH;
        const renderSize = shape.size;

        const path = PATH2D_MAP[shape.type];
        if (!path) return;

        const colorSet = shape.flashActive ? SHAPE_COLORS.white : SHAPE_COLORS[shape.colorType];
        const depthAlpha = shape.depth === 'far' ? 0.45 : shape.depth === 'front' ? 0.95 : 0.8;
        const baseAlpha = isDocs ? 0.2 : depthAlpha;

        const centerX = screenX + renderSize * 0.5;
        const centerY = screenY + renderSize * 0.5;

        // Aggressive ping ring
        if (shape.isAggressive) {
          const pingPhase = (now * 0.0007) % 1;
          ctx.globalAlpha = (1 - pingPhase) * 0.4 * baseAlpha;
          ctx.beginPath();
          ctx.arc(centerX, centerY, (renderSize * 0.5) * (1 + pingPhase * 0.15) + 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.save();
        ctx.globalAlpha = baseAlpha;
        ctx.translate(centerX, centerY);
        ctx.rotate(shape.rotation * DEG_TO_RAD);
        const s = (renderSize * 0.01) * shape.scale;
        ctx.scale(s, s);
        ctx.translate(-50, -50);

        ctx.fillStyle = colorSet.fill;
        ctx.fill(path);
        ctx.strokeStyle = colorSet.stroke;
        ctx.lineWidth = shape.isAggressive ? 4 : 2.5;
        ctx.stroke(path);

        ctx.restore();
      };

      // 4 passes by depth without sort()
      for (let i = 0; i < shapeLen; i++) {
        const s = shapes[i];
        if (!s.isEaten && !s.isAggressive && s.depth === 'far') renderShape(s);
      }
      for (let i = 0; i < shapeLen; i++) {
        const s = shapes[i];
        if (!s.isEaten && !s.isAggressive && s.depth === 'mid') renderShape(s);
      }
      for (let i = 0; i < shapeLen; i++) {
        const s = shapes[i];
        if (!s.isEaten && !s.isAggressive && s.depth === 'front') renderShape(s);
      }
      for (let i = 0; i < shapeLen; i++) {
        const s = shapes[i];
        if (!s.isEaten && s.isAggressive) renderShape(s);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none contain-strict" id="material-expressive-canvas">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
});

// ---------------------------------------------------------
// MAIN EXPORTED BACKGROUND COMPONENT
// ---------------------------------------------------------
export default function MaterialBackground({ activeTab }: { activeTab: 'landing' | 'docs' }) {
  const isMobile = useIsMobile();
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isMobile) return;
    const el = cursorGlowRef.current;
    if (!el) return;

    let rafId = 0;
    let lastX = -1000;
    let lastY = -1000;

    const applyPosition = () => {
      rafId = 0;
      el.style.transform = `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%)`;
    };

    const handlePointerMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(applyPosition);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  return (
    <>
      {/* 1. Screen Gradient Glow (Zero-cost radial-gradients, no heavy multi-pass blur filters) */}
      <div className="fixed inset-0 z-0 select-none overflow-hidden opacity-35 pointer-events-none contain-strict">
        {!isMobile && (
          <div
            ref={cursorGlowRef}
            className="absolute left-0 top-0 w-[500px] aspect-square rounded-full pointer-events-none will-change-transform"
            style={{
              background: 'radial-gradient(circle, rgba(208, 188, 255, 0.22) 0%, rgba(208, 188, 255, 0.06) 40%, transparent 70%)',
              transform: 'translate3d(-1000px, -1000px, 0) translate(-50%, -50%)',
            }}
          />
        )}
        <div
          className="absolute top-[-10%] right-[-10%] w-[600px] aspect-square rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(208, 188, 255, 0.16) 0%, rgba(208, 188, 255, 0.05) 45%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[700px] aspect-square rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(239, 184, 200, 0.12) 0%, rgba(239, 184, 200, 0.04) 45%, transparent 70%)',
          }}
        />
      </div>

      {/* 2. Hardware-Accelerated Viewport Canvas Stage */}
      {!isMobile && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none contain-strict">
          <AsciiWaveCanvas />
          <InteractiveShapesCanvas activeTab={activeTab} />
        </div>
      )}
    </>
  );
}