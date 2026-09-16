/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { Network, Lock, Unlock, ArrowRight, HelpCircle, AlertCircle, Play, CheckCircle2, Layers } from 'lucide-react';
import { SPACE_NODES, DEPENDENCY_NODES } from '../data';
import GameCard from './GameCard';
import GameButton from './GameButton';

function SpaceHierarchyComponent() {
  const [activeTab, setActiveTab] = useState<'spaces' | 'injects'>('spaces');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('child-tavern'); // Tavern
  const [isInjectRunning, setIsInjectRunning] = useState(false);
  const [injectStatus, setInjectStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

  // Determine accessibility rules for space selection
  // "Пространство имеет доступ к своим корневым и дочерним пространствам в текущей ветке иерархии + к Global Space"
  // "Из одного локального пространства нельзя получить доступ к сущностям другого локального пространства, если они не находятся в одной иерархии."
  const accessibilityMap = useMemo(() => {
    const selectedNode = SPACE_NODES.find(n => n.id === selectedSpaceId);
    if (!selectedNode) return {};

    const accessibleIds: Record<string, boolean> = {};
    
    // Always can access Global Space
    accessibleIds['global-space'] = true;
    
    // Can access itself
    accessibleIds[selectedSpaceId] = true;

    // Helper to traverse UP to absolute parent
    const traverseUp = (id: string) => {
      const node = SPACE_NODES.find(n => n.id === id);
      if (node && node.parentId) {
        accessibleIds[node.parentId] = true;
        traverseUp(node.parentId);
      }
    };
    traverseUp(selectedSpaceId);

    // Helper to traverse DOWN to children and grandchildren
    const traverseDown = (id: string) => {
      const children = SPACE_NODES.filter(n => n.parentId === id);
      children.forEach(child => {
        accessibleIds[child.id] = true;
        traverseDown(child.id);
      });
    };
    traverseDown(selectedSpaceId);

    return accessibleIds;
  }, [selectedSpaceId]);

  // Run Dependency Inject Simulation
  const handleRunInject = () => {
    setIsInjectRunning(true);
    setInjectStatus('running');
    setTimeout(() => {
      // Find out if we succeeded (we have 'missing-ui-system' which means error in build!)
      setInjectStatus('failed');
      setIsInjectRunning(false);
    }, 2000);
  };

  return (
    <section className="py-16 md:py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-white mt-4 tracking-tight">
            Изоляция локаций и зависимости
          </h2>
          <p className="mt-4 text-m text-[#cac4d0] max-w-xl mx-auto">
            На этом демо видно, как движок изолирует игровые пространства в памяти и разрешает зависимости компонентов без лишнего бойлерплейта.
          </p>
        </div>

        {/* Tab Selection (Concept 2.2 - Spring-sliding Highlighting Tabs) */}
        <div className="flex justify-center mb-10">
          <div className="p-1 bg-[#1c1a22] rounded-2xl border-2 border-white/5 flex gap-1 relative overflow-hidden">
            <button
              id="subtab-spaces"
              onClick={() => setActiveTab('spaces')}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase flex items-center gap-2 cursor-pointer outline-none transition-colors duration-300 ${
                activeTab === 'spaces' ? 'text-m3-onTertiary' : 'text-[#cac4d0] hover:text-white'
              }`}
            >
              {activeTab === 'spaces' && (
                <motion.div
                  layoutId="activeSpaceTab"
                  transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                  className="absolute inset-0 bg-m3-tertiary rounded-xl shadow-[0_4px_12px_rgba(239,184,200,0.25)]"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Иерархия Пространств
              </span>
            </button>
            <button
              id="subtab-injects"
              onClick={() => setActiveTab('injects')}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase flex items-center gap-2 cursor-pointer outline-none transition-colors duration-300 ${
                activeTab === 'injects' ? 'text-m3-onPrimary' : 'text-[#cac4d0] hover:text-white'
              }`}
            >
              {activeTab === 'injects' && (
                <motion.div
                  layoutId="activeSpaceTab"
                  transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                  className="absolute inset-0 bg-m3-primary rounded-xl shadow-[0_4px_12px_rgba(208,188,255,0.25)]"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Network className="w-4 h-4" />
                Граф Зависимостей
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* TAB 1: SPACES ISOLATION VISUALIZER */}
          {activeTab === 'spaces' ? (
            <>
              {/* Space Map Panel (Interactive Card) - col-span-7 */}
              <GameCard id="space-isolation-card" accent="tertiary" className="lg:col-span-7 min-h-[720px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-mono font-bold text-m3-tertiary">
                      INTERACTIVE SPACE MAP
                    </span>
                    <span className="text-[10px] font-mono text-[#cac4d0]">
                      Кликните на пространство для проверки видимости
                    </span>
                  </div>

                  {/* Rendering the hierarchical structure strictly resembling nesting */}
                  <div className="space-y-6">
                    
                    {/* Global node */}
                    <div className="flex justify-center">
                      <button
                        id="space-node-global"
                        onClick={() => setSelectedSpaceId('global-space')}
                        className={`px-6 py-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer relative min-w-[200px] outline-none focus:outline-none focus:ring-0 select-none ${
                          selectedSpaceId === 'global-space'
                            ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_24px_rgba(239,184,200,0.4)]'
                            : accessibilityMap['global-space']
                            ? 'bg-m3-tertiaryContainer/20 border-m3-tertiary/30 text-m3-onTertiaryContainer'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-500'
                        }`}
                      >
                        <div className="font-mono text-[9px] uppercase tracking-widest opacity-80">
                          Always Available
                        </div>
                        <div className="font-display font-semibold text-sm flex items-center justify-center gap-1.5 mt-0.5">
                          <Unlock className="w-3.5 h-3.5" />
                          Global Space
                        </div>
                      </button>
                    </div>

                    {/* Connecting virtual line */}
                    <div className="h-4 w-0.5 bg-white/10 mx-auto -my-4" />

                    {/* Two Parallel Roots: Town vs Dungeon */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 relative">
                      
                      {/* ROOT 1: TOWN BRANCH */}
                      <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] font-mono text-m3-primary uppercase tracking-widest mb-3">Town Ветка</span>
                        
                        {/* Town Node */}
                        <button
                          id="space-node-town"
                          onClick={() => setSelectedSpaceId('root-town')}
                          className={`px-5 py-3 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[170px] outline-none focus:outline-none focus:ring-0 select-none ${
                            selectedSpaceId === 'root-town'
                              ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_16px_rgba(239,184,200,0.35)] font-bold'
                              : accessibilityMap['root-town']
                              ? 'bg-m3-tertiaryContainer/20 border-m3-tertiary/30 text-m3-onTertiaryContainer font-medium'
                              : 'bg-neutral-950/60 border-neutral-900 text-neutral-500'
                          }`}
                        >
                          <div className="text-xs">Town (Root Local)</div>
                        </button>

                        <div className="h-6 w-0.5 bg-white/5 my-2" />

                        {/* Tavern Node */}
                        <button
                          id="space-node-tavern"
                          onClick={() => setSelectedSpaceId('child-tavern')}
                          className={`px-5 py-3 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[170px] outline-none focus:outline-none focus:ring-0 select-none ${
                            selectedSpaceId === 'child-tavern'
                              ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_16px_rgba(239,184,200,0.35)] font-bold'
                              : accessibilityMap['child-tavern']
                              ? 'bg-m3-tertiaryContainer/20 border-m3-tertiary/30 text-m3-onTertiaryContainer font-medium'
                              : 'bg-neutral-950/60 border-neutral-900 text-neutral-500'
                          }`}
                        >
                          <div className="text-xs">Tavern (Child)</div>
                        </button>

                        <div className="h-6 w-0.5 bg-white/5 my-2" />

                        {/* Cellar Node */}
                        <button
                          id="space-node-cellar"
                          onClick={() => setSelectedSpaceId('subchild-cellar')}
                          className={`px-5 py-3 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[170px] outline-none focus:outline-none focus:ring-0 select-none ${
                            selectedSpaceId === 'subchild-cellar'
                              ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_16px_rgba(239,184,200,0.35)] font-bold'
                              : accessibilityMap['subchild-cellar']
                              ? 'bg-m3-tertiaryContainer/20 border-m3-tertiary/30 text-m3-onTertiaryContainer font-medium'
                              : 'bg-neutral-950/60 border-neutral-900 text-neutral-500'
                          }`}
                        >
                          <div className="text-xs">Cellar (Sub-Child)</div>
                        </button>
                      </div>

                      {/* ROOT 2: DUNGEON BRANCH - isolated */}
                      <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] font-mono text-m3-tertiary uppercase tracking-widest mb-3">Dungeon Ветка</span>

                        {/* Dungeon Node */}
                        <button
                          id="space-node-dungeon"
                          onClick={() => setSelectedSpaceId('root-dungeon')}
                          className={`px-5 py-3 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[170px] outline-none focus:outline-none focus:ring-0 select-none ${
                            selectedSpaceId === 'root-dungeon'
                              ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_16px_rgba(239,184,200,0.35)] font-bold'
                              : accessibilityMap['root-dungeon']
                              ? 'bg-m3-tertiaryContainer/20 border-m3-tertiary/30 text-m3-onTertiaryContainer font-medium'
                              : 'bg-neutral-950/60 border-neutral-900 text-neutral-500'
                          }`}
                        >
                          <div className="text-xs">Dungeon (Root Local)</div>
                        </button>

                        <div className="h-6 w-0.5 bg-white/5 my-2" />

                        {/* Boss Arena Node */}
                        <button
                          id="space-node-boss"
                          onClick={() => setSelectedSpaceId('child-boss')}
                          className={`px-5 py-3 rounded-xl border-2 text-center transition-all cursor-pointer min-w-[170px] outline-none focus:outline-none focus:ring-0 select-none ${
                            selectedSpaceId === 'child-boss'
                              ? 'bg-m3-tertiary text-m3-onTertiary border-m3-tertiary shadow-[0_0_16px_rgba(239,184,200,0.35)] font-bold'
                              : accessibilityMap['child-boss']
                              ? 'bg-m3-tertiaryContainer/20 border-m3-tertiary/30 text-m3-onTertiaryContainer font-medium'
                              : 'bg-neutral-950/60 border-neutral-900 text-neutral-500'
                          }`}
                        >
                          <div className="text-xs">Boss Arena (Child)</div>
                        </button>

                        <div className="flex flex-col items-center py-7 mt-2">
                          <span className="text-[10px] font-mono text-neutral-500 tracking-wide text-center">
                            Конец ветки
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#cac4d0]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-m3-tertiary" />
                    <span>Активен</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-m3-tertiaryContainer/20 border-2 border-m3-tertiary/40" />
                    <span>Доступен</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded bg-neutral-950/80 border-2 border-neutral-900" />
                    <span>Изолирован</span>
                  </div>
                </div>
              </GameCard>

              {/* Space Explanation Panel - col-span-5 */}
              <GameCard id="space-inspector-card" accent="tertiary" className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-m3-tertiary" />
                    <h3 className="font-display font-semibold text-lg text-white">
                      Правила Инкапсуляции
                    </h3>
                  </div>

                  {/* Dynamic diagnosis based on active space selection */}
                  <div className="p-4 bg-white/3 rounded-2xl border-2 border-white/5 mb-5 space-y-3.5">
                    <div>
                      <span className="text-[10px] font-mono text-[#918d96] block uppercase">Выбранная локация:</span>
                      <span className="text-sm font-semibold text-white">
                        {SPACE_NODES.find(n => n.id === selectedSpaceId)?.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#918d96] block uppercase">Доступные Пространства:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {SPACE_NODES.map(node => (
                          accessibilityMap[node.id] && (
                            <span key={node.id} className="text-[11px] font-mono px-2 py-0.5 bg-[#4f378b]/20 text-m3-primary border-2 border-m3-primary/10 rounded-full flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5 text-[#a855f7]" />
                              {node.id === 'global-space' ? 'Global' : node.name.split(' ')[0]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#918d96] block uppercase">Заблокированные ветки:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {SPACE_NODES.map(node => (
                          !accessibilityMap[node.id] && (
                            <span key={node.id} className="text-[11px] font-mono px-2 py-0.5 bg-red-950/20 text-red-400 border-2 border-red-500/15 rounded-full flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              {node.name.split(' ')[0]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#918d96] block uppercase">Сущности внутри лога:</span>
                      <div className="grid grid-cols-1 gap-1.5 mt-1.5">
                        {SPACE_NODES.find(n => n.id === selectedSpaceId)?.entities.map(ent => (
                          <div key={ent} className="text-xs font-mono p-1.5 bg-black/30 rounded-lg text-white border-2 border-white/5 flex items-center justify-between">
                            <span>{ent}</span>
                            <span className="text-[9px] text-m3-tertiary uppercase font-bold tracking-wider">Registered</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary info texts */}
                  <div className="space-y-4 text-xs text-[#cac4d0]">
                    <p className="leading-relaxed">
                      1. Пространства в рантайме ведут себя как <strong>модификаторы доступа в C#</strong>.
                    </p>
                    <p className="leading-relaxed">
                      2. <span className="text-white font-semibold">Tavern (Локальное)</span> видит своего родителя <span className="text-white">Town</span> и <span className="text-white">Global Space</span>, но полностью изолировано от <span className="text-white">Dungeon (Boss Arena)</span>.
                    </p>
                    <p className="leading-relaxed">
                      3. Это гарантирует, что сущности в таверне не нагружают ОЗУ при симуляции босса во втором подземелье. Никаких утечек зависимостей!
                    </p>
                  </div>
                </div>

                <div className="bg-m3-tertiaryContainer/20 p-4 rounded-2xl border-2 border-m3-tertiary/25 text-xs text-m3-onTertiaryContainer flex gap-3 mt-6">
                  <p>
                    <strong>Аналогия доступа:</strong> Global Space функционирует как <code>public</code>, в то время как Local Space действует как <code>protected</code> в вертикали вашей иерархии!
                  </p>
                </div>
              </GameCard>
            </>
          ) : (
            
            /* TAB 2: DEPENDENCY INJECTIONS SIMULATION */
            <>
              {/* Dependency Flow panel - col-span-7 */}
              <GameCard id="dependency-injection-card" accent="primary" className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-mono font-bold text-m3-primary">
                      DEPENDENCY INJECTION FLOW
                    </span>
                  </div>

                  {/* Visual flowchart graph of dependencies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DEPENDENCY_NODES.map(node => (
                      <div
                        key={node.id}
                        className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between transition-all relative overflow-hidden ${
                          node.status === 'missing'
                            ? 'bg-red-950/20 border-red-500/30'
                            : injectStatus === 'completed'
                            ? 'bg-[#d0bcff]/15 border-m3-primary/30 shadow-[0_0_12px_rgba(208,188,255,0.1)]'
                            : 'bg-white/3 border-white/5'
                        }`}
                      >
                        {/* Interactive dynamic background beam when simulating */}
                        {isInjectRunning && node.status === 'valid' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-m3-primary/10 via-transparent to-transparent animate-pulse" />
                        )}

                        <div className="flex items-center justify-between z-10">
                          <span className="font-mono text-xs font-bold text-white">
                            {node.name}
                          </span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                            node.category === 'Logic' ? 'bg-m3-primaryContainer text-m3-onPrimaryContainer' : 'bg-m3-tertiaryContainer text-m3-onTertiaryContainer'
                          }`}>
                            {node.category}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#cac4d0]/80 z-10 pt-1.5 border-t border-white/5">
                          <span className="flex items-center gap-1">
                            {node.injectType === 'AutoInject' ? 'AutoInject' : 'Manual Inject'}
                          </span>
                          <span>
                            {node.status === 'missing' ? (
                              <span className="text-red-400 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Не найден!
                              </span>
                            ) : injectStatus === 'completed' ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Успех
                              </span>
                            ) : (
                              <span className="text-slate-400">Готов</span>
                            )}
                          </span>
                        </div>

                        {/* Shows trace source if active */}
                        {node.injectedFrom && (
                          <div className="mt-2 text-[9px] text-[#ccc2dc] font-mono z-10 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-m3-primary" />
                            <span>Зависит от: {node.injectedFrom}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Control Action Trigger */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-white/5 pt-5 z-10">
                  <div className="text-xs text-[#cac4d0] font-mono">
                    {injectStatus === 'idle' && 'Нажмите кнопку для симуляции связывания...'}
                    {injectStatus === 'running' && 'Идёт линковка C# Source-генератором...'}
                    {injectStatus === 'failed' && (
                      <span className="text-red-400 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Сбой: FeedbackUiSystem не найден!
                      </span>
                    )}
                  </div>

                  <GameButton
                    id="run-injection-simulation"
                    onClick={handleRunInject}
                    disabled={isInjectRunning}
                    variant="primary"
                    className="px-5 py-3 h-[46px] min-h-[46px]"
                  >
                    <Play className="w-4 h-4" />
                    {isInjectRunning ? 'Связывание...' : 'Запустить Инжект-Тест'}
                  </GameButton>
                </div>
              </GameCard>

              {/* Explains Injections sidebar - col-span-5 */}
              <GameCard id="dependency-inspector-card" accent="primary" className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-m3-primary" />
                    <h3 className="font-display font-semibold text-lg text-white">
                      Как работает [AutoInject]
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs text-[#cac4d0] leading-relaxed">
                    <p>
                      Вместо медленного рантайм-контейнера на рефлексии (Zenject, Extenject), Solas компилирует биндинг до запуска игры.
                    </p>
                    <p>
                      Когда логика использует <code className="text-m3-primary">[AutoInject]</code>, движок производит ступенчатый поиск по иерархическому куполу:
                    </p>
                    <ul className="list-decimal pl-4 space-y-1 mt-1 text-[#ccc2dc]">
                      <li>Ищет совпадение по типу в текущем Пространстве.</li>
                      <li>Если не найдено, запрашивает вверх по родительской цепи.</li>
                      <li>Спускается в Глобальное Пространство (Global).</li>
                    </ul>
                    <p className="mt-3">
                      Если объект нигде не найден, компиляция проекта блокируется сразу (как произошло в тесте с <code className="text-red-400">FeedbackUiSystem</code>!). Это предотвращает краш игры на конечном устройстве пользователя.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-950/20 border-2 border-blue-500/20 p-4 rounded-2xl text-xs text-[#93c5fd] flex gap-3 mt-6">
                  <p>
                    <strong>Безопасность сборки:</strong> движок запретит билд и тестирование игры, если зависимости не найдены
                  </p>
                </div>
              </GameCard>
            </>
          )}

        </div>

      </div>
    </section>
  );
}

export default memo(SpaceHierarchyComponent);
