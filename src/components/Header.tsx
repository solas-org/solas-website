/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { BookOpen, Sparkles, Github } from 'lucide-react';
import { motion } from 'motion/react';
import GameButton from './GameButton';

interface HeaderProps {
  activeTab: 'landing' | 'docs';
  setActiveTab: (tab: 'landing' | 'docs') => void;
  onDownloadClick: () => void;
}

function HeaderComponent({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 24 }}
      className="sticky top-2 sm:top-4 z-50 w-full max-w-7xl mx-auto px-2 sm:px-4"
    >
      <div className="w-full px-3 py-2 sm:px-6 sm:py-3 md:px-8 m3-glass rounded-2xl shadow-2xl flex items-center justify-between gap-2">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          onClick={() => setActiveTab('landing')}
          id="orbitality-logo-container"
        >
          <div className="relative w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl group-hover:bg-m3-primary/20 transition-all duration-300">
            <img 
              src={`${import.meta.env.BASE_URL}logo_icon.svg`}
              className="w-full h-full object-contain select-none" 
              referrerPolicy="no-referrer"
              alt="Solas Logo"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base sm:text-xl tracking-tight text-white group-hover:text-m3-primary transition-colors">
              Solas
            </span>
            <span className="text-[10px] font-mono text-m3-tertiary tracking-wider uppercase -mt-1 hidden sm:block">
              Game Engine
            </span>
          </div>
        </div>

        {/* Dynamic Material Navigation */}
        <nav className="flex items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-1 bg-[#1c1a22]/80 backdrop-blur-md rounded-full border border-white/5">
          <button
            id="nav-tab-landing"
            onClick={() => setActiveTab('landing')}
            className={`relative px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 ${
              activeTab === 'landing' 
                ? 'text-m3-onPrimaryContainer font-semibold' 
                : 'text-[#cac4d0] hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === 'landing' && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute inset-0 bg-m3-primaryContainer border border-m3-primary/20 rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="flex items-center gap-1 sm:gap-1.5">
              О движке
            </span>
          </button>

          <button
            id="nav-tab-docs"
            onClick={() => setActiveTab('docs')}
            className={`relative px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 ${
              activeTab === 'docs' 
                ? 'text-m3-onPrimaryContainer font-semibold' 
                : 'text-[#cac4d0] hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === 'docs' && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute inset-0 bg-m3-primaryContainer border border-m3-primary/20 rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="flex items-center gap-1 sm:gap-1.5">
              Документация
            </span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <GameButton
            id="header-github-source-btn"
            onClick={() => window.open('https://github.com/NevskyV/Solas', '_blank')}
            variant="primary"
            className="hidden sm:flex px-4.5 py-2 text-xs"
          >
            <Github className="w-4 h-4" />
            Source
          </GameButton>
        </div>

      </div>
    </motion.header>
  );
}

export default memo(HeaderComponent);
