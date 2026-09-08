/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import EdlSandbox from './components/EdlSandbox';
import SpaceHierarchy from './components/SpaceHierarchy';
import SourceGenVisualizer from './components/SourceGenVisualizer';
import Roadmap from './components/Roadmap';
import Support from './components/Support';
import WavyStripes from './components/WavyStripes';
import MaterialBackground from './components/MaterialBackground';

const DocViewer = React.lazy(() => import('./components/DocViewer'));
import { initializeTheme, applyThemeProperties } from './lib/theme';
import { motion, AnimatePresence } from 'motion/react';
import { Download, CheckCircle2, X, Copy, Check, ArrowRight } from 'lucide-react';
import GameButton from './components/GameButton';
import { parseDocRoute, getCurrentDocPageId, buildDocUrl } from './lib/docsRouting';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'docs'>(() => {
    const route = parseDocRoute();
    return route.isDocs ? 'docs' : 'landing';
  });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedInstallCommand, setCopiedInstallCommand] = useState(false);
  const [engineVersion, setEngineVersion] = useState('0.1.0');

  // Sync tab with browser navigation (back/forward)
  useEffect(() => {
    const syncRoute = () => {
      const route = parseDocRoute();
      setActiveTab(route.isDocs ? 'docs' : 'landing');
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  // Fetch the latest version from NuGet package "Solas" dynamically
  useEffect(() => {
    let active = true;
    fetch('https://api.nuget.org/v3-flatcontainer/solas/index.json')
      .then((res) => {
        if (!res.ok) throw new Error('NuGet flat container API error');
        return res.json();
      })
      .then((data) => {
        if (active && data && Array.isArray(data.versions) && data.versions.length > 0) {
          const latest = data.versions[data.versions.length - 1];
          if (latest) {
            setEngineVersion(latest);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not retrieve latest version from NuGet. Fallback version used:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Initialize dynamic Accent Color theme palette on load
  useEffect(() => {
    const palette = initializeTheme();
    applyThemeProperties(palette);
    console.log(`[Material You Init] Theme successfully harmonized.`);
  }, []);

  // Auto scroll to top on tab transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleDownloadTrigger = useCallback(() => {
    setShowDownloadModal(true);
    setDownloadSuccess(false);
  }, []);

  const handleTabChange = useCallback((tab: 'landing' | 'docs') => {
    setActiveTab(tab);
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    if (tab === 'landing') {
      window.history.pushState(null, '', basePath || '/');
    } else {
      const pageId = getCurrentDocPageId();
      const url = buildDocUrl(pageId);
      try {
        const urlObj = new URL(url);
        window.history.pushState(null, '', `${urlObj.pathname}${urlObj.search}`);
      } catch {
        window.history.pushState(null, '', url);
      }
    }
  }, []);

  const handleDocsClick = useCallback(() => {
    handleTabChange('docs');
  }, [handleTabChange]);

  return (
    <div className="min-h-screen bg-[#0b090f] text-[#ede8f5] selection:bg-m3-primary selection:text-m3-onPrimary relative font-sans overflow-x-clip">
      
      {/* Expressive Material Design floating shapes + high-performance 2D Canvas background */}
      <MaterialBackground activeTab={activeTab} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onDownloadClick={handleDownloadTrigger} 
        />

        {/* Main viewport toggles with smooth non-jerking transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Progressive top-to-bottom entrance reveal for sections */}
              
              {/* 1. HERO GREETING BANNER */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <Hero 
                  onDocsClick={handleDocsClick} 
                  onDownloadClick={handleDownloadTrigger} 
                  engineVersion={engineVersion}
                />
              </motion.div>

              <WavyStripes opacity={0.45} color="rgba(208, 188, 255, 0.3)" speed={10} className="-my-10 z-0" />

              {/* 2. DYNAMIC EDL RE-EVALUATION SANDBOX */}
              <motion.div
                className="content-visibility-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <EdlSandbox />
              </motion.div>

              <WavyStripes opacity={0.4} color="rgba(239, 184, 200, 0.28)" speed={12} className="-my-10 z-0" />

              {/* 3. GRAPHS: INTUITIVE SPACE ISOLATION & DEPENDENCY INJECTS */}
              <motion.div
                className="content-visibility-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <SpaceHierarchy />
              </motion.div>

              <WavyStripes opacity={0.42} color="rgba(45, 212, 191, 0.26)" speed={11} className="-my-10 z-0" />

              {/* 3.5. IMMERSIVE C# SOURCE GENERATION PIPELINE */}
              <motion.div
                className="content-visibility-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <SourceGenVisualizer />
              </motion.div>

              <WavyStripes opacity={0.38} color="rgba(208, 188, 255, 0.24)" speed={13} className="-my-10 z-0" />

              {/* 4. SPRING ROADMAP MODULES PIPELINE */}
              <motion.div
                className="content-visibility-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <Roadmap />
              </motion.div>

              <WavyStripes opacity={0.35} color="rgba(208, 188, 255, 0.22)" speed={14} className="-my-10 z-0" />

              {/* 5. PROJECT SUPPORT WITH DONATIONS & SOCIALS BLOB */}
              <motion.div
                className="content-visibility-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <Support />
              </motion.div>

              {/* LANDING FOOTER DETAILS */}
              <footer className="py-12 px-4 border-t border-white/5 bg-black/40 text-center select-none">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 flex items-center justify-center rounded-xl group-hover:bg-m3-primary/20 transition-all duration-300">
                      <img 
                        src={`${import.meta.env.BASE_URL}logo_icon.svg`} 
                        className="w-full h-full object-contain select-none" 
                        referrerPolicy="no-referrer"
                        alt="Solas Logo"
                      />
                    </div>
                    <span className="font-display font-semibold text-sm text-white">Solas Game Engine</span>
                  </div>
                  <p className="text-xs justify-end text-[#cac4d0]/60 max-w-sm text-right">
                    Разработано профессиональной инди-командой со страстью к идеальному DX. Распространяется под свободной лицензией MPL-2.0.
                  </p>
                </div>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* DOCUMENTATION MULTI-PAGE MARKDOWN VIEWER */}
              <React.Suspense fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-m3-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <DocViewer />
              </React.Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* EXPRESSIVE MATERIAL 3 DIALOG MODAL (SDK DOWNLOADS) */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setShowDownloadModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer"
          >
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 bg-m3-surface border border-white/10 m3-shape-container shadow-2xl relative cursor-default"
              id="download-sdk-dialog-modal"
            >
              {/* Close Button */}
              <button
                id="close-download-sdk-btn"
                onClick={() => setShowDownloadModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-white/5 rounded-full transition-all outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                
                {/* Visual Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                  downloadSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-m3-primaryContainer/40 text-m3-primary'
                }`}>
                  {downloadSuccess ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <Download className="w-8 h-8" />
                  )}
                </div>

                {/* Header */}
                <h3 className="font-display font-bold text-xl text-white mb-2">
                  Установка Solas
                </h3>

                {/* Subtitle description */}
                <p className="text-xs text-[#cac4d0] leading-relaxed mb-6 max-w-xs">
                  Последняя версия Solas – {engineVersion}! Она включает в себя 3 пакета: SourceGenerators, Core, Transform
                </p>

                {/* Bullet attributes */}
                {!downloadSuccess && (
                  <div className="w-full space-y-2 mb-6 text-left bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Версия:</span>
                      <span className="text-m3-primary font-bold">{engineVersion} Alpha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Требование:</span>
                      <span className="text-white">.NET 10</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="w-full flex flex-col gap-2">
                   {downloadSuccess ? (
                    <GameButton
                      id="close-after-success-btn"
                      onClick={() => setShowDownloadModal(false)}
                      variant="secondary"
                      className="w-full py-3.5"
                    >
                      Закрыть Окно
                    </GameButton>
                  ) : (
                    <>
                        <div className="w-full bg-black/80 rounded-xl border border-white/10 flex items-center justify-between p-3.5 font-mono text-sm text-m3-primary mb-2">
                          <span className="truncate">dotnet package add Solas</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('dotnet package add Solas');
                              setCopiedInstallCommand(true);
                              setTimeout(() => setCopiedInstallCommand(false), 2000);
                            }}
                            title={copiedInstallCommand ? "Скопировано!" : "Копировать команду"}
                            aria-label="Копировать команду установки"
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
                          >
                            {copiedInstallCommand ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-m3-primary hover:text-white transition-colors" />
                            )}
                          </button>
                        </div>

                        <GameButton
                          id="modal-to-docs-btn"
                          onClick={() => {
                            setShowDownloadModal(false);
                            handleTabChange('docs');
                          }}
                          variant="primary"
                          className="w-full py-3.5 mt-2 flex items-center justify-center gap-2"
                        >
                          <span>К документации</span>
                          <ArrowRight className="w-4 h-4" />
                        </GameButton>
                    </>
                  )}
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
