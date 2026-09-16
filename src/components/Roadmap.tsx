import React, { useState, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ROADMAP_MODULES } from '../data';
import { CheckCircle2, Circle } from 'lucide-react';
import { RoadmapModule } from '../types';

function RoadmapComponent() {
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [clickedModule, setClickedModule] = useState<RoadmapModule | null>(null);

  // Grab-to-scroll horizontal container logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Elastic overscroll offset
  const [overscrollX, setOverscrollX] = useState(0);

  // Edge hover scrolling properties
  const scrollSpeedRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Coordinates for popup portal
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number } | null>(null);

  // Calculate popup position on hover without continuous RAF loop
  const updatePopupPosition = useCallback((moduleId: string) => {
    const ballEl = document.getElementById(`roadmap-ball-${moduleId}`);
    if (!ballEl) return;
    const ballRect = ballEl.getBoundingClientRect();
    setPopupCoords({
      top: ballRect.top - 12,
      left: ballRect.left + ballRect.width / 2,
    });
  }, []);

  const handleModuleMouseEnter = (moduleId: string) => {
    if (isDragging) return;
    setHoveredModuleId(moduleId);
    updatePopupPosition(moduleId);
  };

  const handleModuleMouseLeave = () => {
    setHoveredModuleId(null);
  };

  const startEdgeScrollLoop = () => {
    if (rafIdRef.current) return;
    const tick = () => {
      if (scrollSpeedRef.current !== 0 && scrollRef.current && !isDragging) {
        scrollRef.current.scrollLeft += scrollSpeedRef.current;
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!scrollRef.current || !containerRef.current || isDragging) {
      scrollSpeedRef.current = 0;
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const width = rect.width;

    const threshold = 120;
    if (mouseX < threshold && mouseX > 0) {
      const intensity = (threshold - mouseX) / threshold;
      scrollSpeedRef.current = -intensity * 55;
    } else if (mouseX > width - threshold && mouseX < width) {
      const intensity = (mouseX - (width - threshold)) / threshold;
      scrollSpeedRef.current = intensity * 55;
    } else {
      scrollSpeedRef.current = 0;
    }

    if (scrollSpeedRef.current !== 0 && !rafIdRef.current) {
      startEdgeScrollLoop();
    }
  };

  const handleContainerMouseLeave = () => {
    scrollSpeedRef.current = 0;
    setIsDragging(false);
    setOverscrollX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHoveredModuleId(null); // Hide popup when dragging
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    scrollRef.current.style.scrollBehavior = 'auto';
    setScrollLeft(scrollRef.current.scrollLeft);
    setHasMoved(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setOverscrollX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      setHasMoved(true);
    }

    const targetScrollLeft = scrollLeft - walk;
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;

    if (targetScrollLeft < 0) {
      scrollRef.current.scrollLeft = 0;
      const excess = -targetScrollLeft;
      const overscroll = Math.min(150, Math.pow(excess, 0.75) * 1.5);
      setOverscrollX(overscroll);
    } else if (targetScrollLeft > maxScroll) {
      scrollRef.current.scrollLeft = maxScroll;
      const excess = targetScrollLeft - maxScroll;
      const overscroll = -Math.min(150, Math.pow(excess, 0.75) * 1.5);
      setOverscrollX(overscroll);
    } else {
      scrollRef.current.scrollLeft = targetScrollLeft;
      setOverscrollX(0);
    }
  };

  const lastCompletedIndex = ROADMAP_MODULES.reduce((lastIdx, module, idx) => {
    return module.status === 'completed' ? idx : lastIdx;
  }, -1);

  const progressPercent = lastCompletedIndex >= 0
    ? (lastCompletedIndex / (ROADMAP_MODULES.length - 1)) * 100
    : 0;

  const activeHoveredModule = ROADMAP_MODULES.find(m => m.id === hoveredModuleId);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-white mt-2 tracking-tight">
            Роадмап проекта
          </h2>
          <p className="mt-3 text-m text-[#cac4d0] max-w-xl mx-auto">
            Текущий статус разработки ключевых компонентов движка. Наведите курсор на модули, чтобы узнать подробности.
          </p>
        </div>

        {/* ROADMAP TIMELINE WRAPPER */}
        <div className="relative pt-0 pb-8 px-2" id="roadmap-timeline-wrapper">
          
          {/* Scroll Container with grab-to-scroll */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onScroll={() => setHoveredModuleId(null)}
            className={`overflow-x-auto overflow-y-visible -px-40 pt-5 scroll-smooth select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Inner stretchy container */}
            <motion.div 
              className="relative flex gap-x-3 py-4 min-w-max"
              animate={{ x: overscrollX }}
              transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 350, damping: 25 }}
            >
              {/* Horizontal Track */}
              <div className="absolute top-[20px] left-[85px] right-[85px] h-1 bg-white/10 -translate-y-1/2 rounded z-0 pointer-events-none">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-m3-primary to-m3-tertiary rounded shadow-[0_0_12px_rgba(208,188,255,0.7)] transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Points Container */}
              {ROADMAP_MODULES.map((module) => {
                const isHovered = hoveredModuleId === module.id;
                
                return (
                  <div
                    key={module.id}
                    id={`roadmap-point-${module.id}`}
                    className="w-44 flex-shrink-0 flex flex-col items-center relative z-10"
                    onMouseEnter={() => handleModuleMouseEnter(module.id)}
                    onMouseLeave={handleModuleMouseLeave}
                    onClick={() => {
                      if (hasMoved) return;
                      if (window.innerWidth < 640) setClickedModule(module);
                    }}
                  >
                    {/* Point Ball */}
                    <motion.div
                      id={`roadmap-ball-${module.id}`}
                      animate={isHovered ? { scale: 1.35 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer relative z-20 shadow-xl transition-colors duration-300 mt-10 ${
                        module.status === 'completed'
                          ? 'bg-m3-primary text-m3-onPrimary shadow-[0_0_15px_rgba(208,188,255,0.5)]'
                          : module.status === 'in-progress'
                          ? 'bg-m3-tertiary text-m3-onTertiary shadow-[0_0_10px_rgba(239,184,200,0.35)]'
                          : 'bg-[#1d1b20] text-slate-500 border-2 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {module.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : module.status === 'in-progress' ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-m3-tertiary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-m3-tertiary"></span>
                        </span>
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </motion.div>

                    {/* Caption underneath points */}
                    <div className={`mt-7 text-center select-none cursor-pointer ${isHovered ? 'scale-105' : ''} transition-transform`}>
                      <p className={`text-xs font-semibold font-display tracking-tight ${
                        module.status === 'completed' ? 'text-white' :
                        module.status === 'in-progress' ? 'text-m3-tertiary' : 'text-[#cac4d0]/70'
                      }`}>
                        {module.title}
                      </p>
                      <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded mt-2.5 inline-block ${
                        module.status === 'completed' ? 'bg-m3-primaryContainer/30 text-m3-onPrimaryContainer' :
                        module.status === 'in-progress' ? 'bg-[#381e72]/40 text-[#cac4d0]' : 'bg-white/5 text-neutral-400'
                      }`}>
                        {module.status === 'completed' ? 'Готово' :
                         module.status === 'in-progress' ? 'В разработке' : 'В планах'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

        </div>

        {/* Mobile Info dialogue explanation */}
        <div className="mt-8 text-center sm:hidden">
          <p className="text-xs text-[#cac4d0]/60 font-mono">
            Кликните по модулям, чтобы получить информацию о плане выпуска.
          </p>
        </div>

        {/* Desktop Hover Popup (Portal to Body) */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {activeHoveredModule && popupCoords && (
              <div
                key={activeHoveredModule.id}
                style={{
                  position: 'fixed',
                  top: `${popupCoords.top}px`,
                  left: `${popupCoords.left}px`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 9999,
                }}
                className="hidden md:block pointer-events-none"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-60 p-4 rounded-2xl m3-glass border border-m3-primary/20 shadow-2xl text-left relative"
                  id={`timeline-popup-${activeHoveredModule.id}`}
                >
                  {/* Bottom triangle pointer */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1d1b20] border-r border-b border-m3-primary/15 rotate-45" />

                  <h4 className="font-display font-bold text-sm text-white mb-1.5">
                    {activeHoveredModule.title}
                  </h4>

                  <p className="text-xs text-[#cac4d0] leading-relaxed mb-3">
                    {activeHoveredModule.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {activeHoveredModule.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded text-white font-medium border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Popup Mobile Dialog */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {clickedModule && (
              <div 
                onClick={() => setClickedModule(null)}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm sm:hidden"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm rounded-2xl p-6 bg-m3-surface border border-white/10 text-left"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-display font-bold text-lg text-white">
                      {clickedModule.title}
                    </h3>
                    <button
                      id="roadmap-close-details"
                      onClick={() => setClickedModule(null)}
                      className="text-white hover:text-m3-primary p-1 bg-[#1d1b20] rounded-full"
                    >
                      ×
                    </button>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    clickedModule.status === 'completed' ? 'bg-[#381e72] text-[#eaddff]' :
                    clickedModule.status === 'in-progress' ? 'bg-[#c084fc]/15 text-[#fb7185]' : 'bg-white/5 text-neutral-400'
                  }`}>
                    {clickedModule.status === 'completed' ? 'Готово' :
                     clickedModule.status === 'in-progress' ? 'В разработке' : 'В планах'}
                  </span>

                  <p className="text-xs text-[#cac4d0] mt-3.5 leading-relaxed">
                    {clickedModule.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {clickedModule.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-white font-medium border border-white/5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </section>
  );
}

export default memo(RoadmapComponent);