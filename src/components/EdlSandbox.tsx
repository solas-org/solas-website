import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Database, Cpu, Component, Settings } from 'lucide-react';
import { EdlComponent, EntityType } from '../types';
import { EDL_COMPONENTS_POOL } from '../data';
import GameCard from './GameCard';

function EdlSandboxComponent() {
  const [selectedComponents, setSelectedComponents] = useState<EdlComponent[]>([
    EDL_COMPONENTS_POOL[0], // TransformData
    EDL_COMPONENTS_POOL[2], // HealthData
  ]);

  // Determine entity type based on composition
  const entityType = useMemo((): EntityType | 'Empty' => {
    if (selectedComponents.length === 0) return 'Empty';
    const hasData = selectedComponents.some(c => c.type === 'data');
    const hasLogic = selectedComponents.some(c => c.type === 'logic');

    if (hasData && hasLogic) return 'Composition';
    if (hasData) return 'Config';
    return 'System';
  }, [selectedComponents]);

  // Generate binary bitmask based on selected item indices
  const bitmask = useMemo(() => {
    return EDL_COMPONENTS_POOL.map(poolComponent => {
      const isSelected = selectedComponents.some(sc => sc.id === poolComponent.id);
      return isSelected ? '1' : '0';
    }).join('');
  }, [selectedComponents]);

  // Handle adding components
  const addComponent = (comp: EdlComponent) => {
    if (selectedComponents.some(sc => sc.id === comp.id)) return;
    setSelectedComponents([...selectedComponents, comp]);
  };

  // Handle removing components
  const removeComponent = (id: string) => {
    setSelectedComponents(selectedComponents.filter(c => c.id !== id));
  };

  // Preset loading helpers to let developers play instantly!
  const loadPreset = (type: EntityType | 'Empty') => {
    if (type === 'Empty') {
      setSelectedComponents([]);
      return;
    }
    if (type === 'Config') {
      setSelectedComponents(EDL_COMPONENTS_POOL.filter(c => c.type === 'data').slice(0, 3));
    } else if (type === 'System') {
      setSelectedComponents(EDL_COMPONENTS_POOL.filter(c => c.type === 'logic').slice(0, 3));
    } else {
      setSelectedComponents([
        EDL_COMPONENTS_POOL[0], // TransformData
        EDL_COMPONENTS_POOL[1], // PhysicsData
        EDL_COMPONENTS_POOL[7], // MovementSystem
        EDL_COMPONENTS_POOL[11], // RenderSystem
      ]);
    }
  };

  // Check active presets for visual highlighting
  const isPresetEmptyActive = useMemo(() => selectedComponents.length === 0, [selectedComponents]);
  
  const isPresetConfigActive = useMemo(() => {
    return selectedComponents.length > 0 && selectedComponents.every(c => c.type === 'data');
  }, [selectedComponents]);
  
  const isPresetSystemActive = useMemo(() => {
    return selectedComponents.length > 0 && selectedComponents.every(c => c.type === 'logic');
  }, [selectedComponents]);
  
  const isPresetCompositionActive = useMemo(() => {
    return selectedComponents.length > 0 && 
           selectedComponents.some(c => c.type === 'data') && 
           selectedComponents.some(c => c.type === 'logic');
  }, [selectedComponents]);

  return (
    <section className="py-16 md:py-24 relative bg-transparent">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header Title with MD3 Feel */}
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-white mt-4 tracking-tight">
            Entity | Data | Logic
          </h2>
          <p className="mt-4 text-m text-[#cac4d0] max-w-xxl mx-auto">
            В Solas сущности могут хранить только 1 экземпляр компонента из-за особенности поиска. Поиск осуществляется при помощи битовых масок, где каждый бит отвечает за наличие компонента у сущности. тип сущности не объявляется вручную. В будущем редакторе тип сущности будет определяться автоматически, чтобы упростить навигацию и поиск сущностей по типу. Попробуйте кликать по компонентам!
          </p>
        </div>

        {/* Preset selections */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <span className="text-xs text-[#cac4d0] self-center mr-2 font-medium">Готовые пресеты:</span>
          <button 
            id="preset-empty"
            onClick={() => loadPreset('Empty')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border-2 outline-none focus:outline-none focus:ring-0 ${
              isPresetEmptyActive
                ? 'bg-white/20 text-white border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.15)] font-bold'
                : 'bg-white/5 text-[#ede8f5] hover:bg-white/10 border-white/5'
            }`}
          >
            Очистить Сущность
          </button>
          <button 
            id="preset-config"
            onClick={() => loadPreset('Config')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border-2 outline-none focus:outline-none focus:ring-0 ${
              isPresetConfigActive
                ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_12px_rgba(239,184,200,0.3)] font-bold'
                : 'bg-m3-tertiaryContainer/40 text-m3-onTertiaryContainer hover:bg-m3-tertiaryContainer/60 border-m3-tertiary/10'
            }`}
          >
            Config (Только Data)
          </button>
          <button 
            id="preset-system"
            onClick={() => loadPreset('System')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border-2 outline-none focus:outline-none focus:ring-0 ${
              isPresetSystemActive
                ? 'bg-m3-primary text-m3-onPrimary border-m3-primary shadow-[0_0_12px_rgba(208,188,255,0.3)] font-bold'
                : 'bg-m3-primaryContainer/40 text-m3-onPrimaryContainer hover:bg-m3-primaryContainer/60 border-m3-primary/10'
            }`}
          >
            System (Только Logic)
          </button>
          <button 
            id="preset-composition"
            onClick={() => loadPreset('Composition')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border-2 outline-none focus:outline-none focus:ring-0 ${
              isPresetCompositionActive
                ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.3)] font-bold'
                : 'bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/60 border-cyan-500/20'
            }`}
          >
            Composition (Data + Logic)
          </button>
        </div>

        {/* Sandbox Content Block - Expressive Material 3 Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* TOP LEFT HERO: Visualizer Entity Orb Stage - col-span-7 */}
          <GameCard id="edl-visualizer-card" accent="secondary" className="lg:col-span-7 min-h-[460px] flex flex-col justify-between items-center text-center relative overflow-hidden p-8">
            
            {/* Component type mode badge */}
            <div className="w-full flex items-center justify-between z-10 font-mono text-xs">
              <span className="text-[10px] tracking-wider bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-slate-300 uppercase font-semibold">
                РЕЖИМ АВТООПРЕДЕЛЕНИЯ (EDL)
              </span>
              <div>
                <span className="text-slate-400">GUID:</span>
                <span className="text-white font-bold tracking-tight bg-black/40 px-2.5 py-1 rounded-lg border-2 border-white/5">
                  da647b0a-3d23-45ab-bc10-ef1831c19010
                </span>
              </div>
            </div>

            {/* Glowing Orb Canvas with rich morphing physics - Centered */}
            <div className="relative w-52 h-52 flex items-center justify-center z-10 my-6 mx-auto" id="orb-visualizer-container">
              
              {/* Outer orbits revolving */}
              {entityType === 'Composition' && (
                <>
                  <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-[spin_6s_linear_infinite]" />
                  <div className="absolute inset-2 border-2 border-dashed border-cyan-400/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                  
                  {/* Satellites rotating */}
                  <div className="absolute w-3.5 h-3.5 bg-cyan-400 rounded-full top-0 left-1/2 -ml-1.5 shadow-[0_0_12px_cyan] animate-pulse" />
                  <div className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full bottom-0 left-1/2 -ml-1 shadow-[0_0_12px_emerald] animate-pulse" />
                </>
              )}
              {entityType === 'Config' && (
                <div className="absolute inset-2 border-2 border-dashed border-m3-tertiary/30 rounded-full animate-[spin_12s_linear_infinite]" />
              )}
              {entityType === 'System' && (
                <div className="absolute inset-2 border-2 border-m3-primary/20 rounded-full animate-[spin_8s_linear_infinite]" />
              )}

              {/* Central Morphing Core with bouncy physics */}
              <motion.div
                animate={
                  entityType === 'Empty'
                    ? { borderRadius: '50%', scale: 0.85, backgroundColor: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 15px rgba(255,255,255,0.05)' }
                    : entityType === 'Config'
                    ? { borderRadius: '40% 60% 50% 50% / 50% 50% 40% 60%', scale: 1.08, backgroundColor: 'rgba(239, 184, 200, 0.18)', boxShadow: '0 0 40px rgba(239, 184, 200, 0.45), inset 0 0 20px rgba(239, 184, 200, 0.2)' }
                    : entityType === 'System'
                    ? { borderRadius: '60% 40% 60% 40% / 40% 60% 40% 60%', scale: 1.08, backgroundColor: 'rgba(208, 188, 255, 0.18)', boxShadow: '0 0 40px rgba(208, 188, 255, 0.45), inset 0 0 20px rgba(208, 188, 255, 0.2)' }
                    : { borderRadius: '35% 65% 55% 45% / 45% 35% 65% 55%', scale: 1.15, backgroundColor: 'rgba(45, 212, 191, 0.18)', boxShadow: '0 0 50px rgba(45, 212, 191, 0.55), inset 0 0 25px rgba(45, 212, 191, 0.25)' }
                }
                transition={{
                  type: 'spring',
                  stiffness: 160,
                  damping: 8,
                  mass: 0.9
                }}
                className={`w-40 h-40 border-2 backdrop-filter flex flex-col items-center justify-center transition-colors duration-500 ${
                  entityType === 'Empty' 
                    ? 'border-white/15'
                    : entityType === 'Config'
                    ? 'border-m3-tertiary/60'
                    : entityType === 'System'
                    ? 'border-m3-primary/60'
                    : 'border-emerald-400/60'
                }`}
              >
                {/* Dynamic Icon */}
                {entityType === 'Empty' && <Settings className="w-10 h-10 text-neutral-600 animate-spin" />}
                {entityType === 'Config' && <Database className="w-12 h-12 text-m3-tertiary" />}
                {entityType === 'System' && <Cpu className="w-12 h-12 text-m3-primary" />}
                {entityType === 'Composition' && <Component className="w-12 h-12 text-teal-400" />}

                {/* Subtitle dynamic display */}
                <span className="text-xs font-mono font-bold text-white mt-3 uppercase tracking-wider block">
                  {entityType === 'Empty' ? 'Entity' : entityType}
                </span>
              </motion.div>
            </div>

            {/* Description matching core state */}
            <div className="z-10 w-full flex flex-col items-center justify-center text-center mt-auto pt-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={entityType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 className={`font-display font-bold text-xl ${
                    entityType === 'Config' ? 'text-m3-tertiary' :
                    entityType === 'System' ? 'text-m3-primary' :
                    entityType === 'Composition' ? 'text-teal-400' : 'text-[#cac4d0]'
                  }`}>
                    {entityType === 'Empty' && 'Пустой контейнер Entity'}
                    {entityType === 'Config' && 'Тип определен: CONFIG'}
                    {entityType === 'System' && 'Тип определен: SYSTEM'}
                    {entityType === 'Composition' && 'Тип определен: COMPOSITION'}
                  </h4>
                  <p className="text-xs text-[#cac4d0] mt-1.5 leading-relaxed max-w-md mx-auto">
                    {entityType === 'Empty' && 'Сущности Solas полностью пусты изначально. Добавьте данные или классы логики из интерактивной библиотеки ниже.'}
                    {entityType === 'Config' && 'Сущность содержит только данные (Config). Отлично подходит для хранения игровой информации, сохранений и балансов.'}
                    {entityType === 'System' && 'Сущность содержит только логику без данных. Выполняет роль чистой игровой системы.'}
                    {entityType === 'Composition' && 'Сущность содержит как данные, так и логику. Полноценная игровая Композиция.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

          </GameCard>

          {/* TOP RIGHT: Current Entity Attached Components - col-span-5 */}
          <GameCard id="edl-composition-card" accent="tertiary" className="lg:col-span-5 min-h-[460px] flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-m3-tertiary uppercase tracking-wider">
                  СОСТАВ СУЩНОСТИ
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-black/40 border-2 border-white/10 text-white font-bold">
                  {'Кол-во компонентов: '}{selectedComponents.length}
                </span>
              </div>

              {/* Added Components list */}
              <div className="h-[310px] overflow-y-auto pl-1 px-1.5 py-1.5 scrollbox border-2 border-white/5 bg-black/20 rounded-2xl">
                <AnimatePresence initial={false} mode="popLayout">
                  {selectedComponents.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 text-xs text-[#cac4d0]/50 border-2 border-dashed border-white/10 rounded-xl h-full flex flex-col items-center justify-center gap-2"
                    >
                      <Settings className="w-8 h-8 text-white/20 animate-pulse" />
                      <span>Сущность пока пуста</span>
                      <span className="text-[10px] text-white/30">Выберите компоненты из библиотеки ниже</span>
                    </motion.div>
                  ) : (
                    selectedComponents.map(comp => (
                      <motion.div
                        key={comp.id}
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                        className="mb-2"
                      >
                        <div
                          className={`p-3 rounded-xl border-2 flex items-center justify-between text-xs font-mono font-medium ${
                            comp.type === 'data'
                              ? 'bg-m3-tertiaryContainer/25 border-m3-tertiary/35 text-m3-onTertiaryContainer'
                              : 'bg-m3-primaryContainer/25 border-m3-primary/35 text-m3-onPrimaryContainer'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 truncate pr-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-2 h-2 rounded-full ${comp.type === 'data' ? 'bg-m3-tertiary' : 'bg-m3-primary'}`} />
                              <span className="truncate font-bold text-white">{comp.name}</span>
                            </div>
                            <span className="text-[10px] text-[#cac4d0]/70 pl-4 truncate">{comp.description}</span>
                          </div>
                          <button
                            id={`remove-comp-${comp.id}`}
                            onClick={() => removeComponent(comp.id)}
                            className="text-[#cac4d0] hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-all outline-none shrink-0 cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Technical Diagnostics Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center font-mono text-[11px] text-[#cac4d0]">
              <span className="text-[12px] text-m3-primary font-bold bg-m3-primaryContainer/30 border-2 border-m3-primary/20 px-3 py-1 rounded-lg">
                BITMASK INDEX: {bitmask.slice(0, 4)} {bitmask.slice(4, 8)} {bitmask.slice(8, 12)}
              </span>
            </div>

          </GameCard>

          {/* BOTTOM ROW: Expressive Component Library Drawer - col-span-12 */}
          <GameCard id="edl-library-card" accent="primary" className="lg:col-span-12 p-8 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-m3-primary" />
                  Интерактивная Библиотека Компонентов
                </h3>
                <p className="text-xs text-[#cac4d0] mt-1">
                  Кликайте по компонентам, чтобы динамически формировать состав и проверять реактивные изменения битовой маски.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Data Column */}
              <div className="space-y-3">
                <span className="text-xs font-mono tracking-wider uppercase text-m3-tertiary font-bold block mb-2">
                  Любые данные
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EDL_COMPONENTS_POOL.filter(c => c.type === 'data').map(comp => {
                    const isAdded = selectedComponents.some(sc => sc.id === comp.id);
                    return (
                      <button
                        key={comp.id}
                        id={`add-comp-${comp.id}`}
                        onClick={() => addComponent(comp)}
                        disabled={isAdded}
                        className={`text-left p-3 rounded-2xl border-2 text-xs flex flex-col justify-between transition-all ${
                          isAdded
                            ? 'bg-white/5 border-white/5 text-[#cac4d0]/40 cursor-not-allowed opacity-50'
                            : 'bg-m3-tertiaryContainer/10 hover:bg-m3-tertiaryContainer/20 border-m3-tertiary/25 hover:border-m3-tertiary/60 text-m3-onTertiaryContainer hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-mono font-bold text-white text-xs">{comp.name}</span>
                          <Plus className={`w-4 h-4 shrink-0 ${isAdded ? 'opacity-20' : 'text-m3-tertiary'}`} />
                        </div>
                        <span className="text-[10px] text-[#cac4d0] opacity-80 leading-snug line-clamp-2">{comp.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logic Column */}
              <div className="space-y-3">
                <span className="text-xs font-mono justify-center tracking-wider uppercase text-m3-primary font-bold block mb-2">
                  Игровая логика
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EDL_COMPONENTS_POOL.filter(c => c.type === 'logic').map(comp => {
                    const isAdded = selectedComponents.some(sc => sc.id === comp.id);
                    return (
                      <button
                        key={comp.id}
                        id={`add-comp-${comp.id}`}
                        onClick={() => addComponent(comp)}
                        disabled={isAdded}
                        className={`text-left p-3 rounded-2xl border-2 text-xs flex flex-col justify-between transition-all ${
                          isAdded
                            ? 'bg-white/5 border-white/5 text-[#cac4d0]/40 cursor-not-allowed opacity-50'
                            : 'bg-m3-primaryContainer/10 hover:bg-m3-primaryContainer/20 border-m3-primary/25 hover:border-m3-primary/60 text-m3-onPrimaryContainer hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-mono font-bold text-white text-xs">{comp.name}</span>
                          <Plus className={`w-4 h-4 shrink-0 ${isAdded ? 'opacity-20' : 'text-m3-primary'}`} />
                        </div>
                        <span className="text-[10px] text-[#cac4d0] opacity-80 leading-snug line-clamp-2">{comp.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </GameCard>

        </div>

      </div>
    </section>
  );
}

export default memo(EdlSandboxComponent);
