/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { Download, BookOpen, CodeXml, GitMerge, Gamepad2 } from 'lucide-react';
import { motion } from 'motion/react';
import GameCard from './GameCard';
import GameButton from './GameButton';

interface HeroProps {
  onDocsClick: () => void;
  onDownloadClick: () => void;
  engineVersion: string;
}

// Компонент иконки звёздочки из Originkit
function Sparkle() {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" />
    </svg>
  );
}

function HeroComponent({ onDocsClick, onDownloadClick, engineVersion }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-20 md:pt-50 md:pb-28 flex flex-col items-center text-center px-4">
      {/* Стили Crystal Glow с единственной базой и анимацией звёздочек */}
      <style>{`
        .crystal-glow-container {
          position: relative;
          display: inline-block;
          cursor: pointer;
          --glare: rgba(255, 255, 255, 0.95);
          --shadow: var(--color-m3-primaryContainer);
        }

        .crystal-glow-text-base {
          position: relative;
          z-index: 1;
          color: #ffffff;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 0.4s ease;
        }

        .crystal-glow-container:hover .crystal-glow-text-base {
          transform: translate(3px, -3px);
          text-shadow:
            -1px 1px 0px var(--shadow),
            -2px 2px 0px var(--shadow),
            -3px 3px 0px var(--shadow),
            -4px 4px 0px var(--shadow);
        }

        .crystal-glow-text-glare {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background-image: linear-gradient(
            110deg,
            transparent 0%,
            transparent 40%,
            var(--glare) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          background-position: 160% 0%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          transition: background-position 0.8s ease-in-out;
        }

        .crystal-glow-container:hover .crystal-glow-text-glare {
          background-position: -60% 0%;
        }

        .crystal-glow-container svg {
          position: absolute;
          z-index: 3;
          width: 32px;
          height: 32px;
          pointer-events: none;
          top: calc(var(--y, 50) * 1%);
          left: calc(var(--x, 0) * 1%);
          transform: translate(-50%, -50%) scale(0);
        }

        .crystal-glow-container svg path {
          fill: var(--color-m3-primary);
        }

        .crystal-glow-container:hover svg {
          animation: sparkle 0.75s calc((var(--delay-step, 0.12) * var(--d, 1)) * 1s) both;
        }

        @keyframes sparkle {
          0% {
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            transform: translate(-50%, -50%) scale(var(--s, 1));
          }
          100% {
            transform: translate(-50%, -50%) scale(0);
          }
        }

        .crystal-glow-container svg:nth-of-type(1) { --x: -2; --y: 15; --s: 1.1; --d: 1; }
        .crystal-glow-container svg:nth-of-type(2) { --x: 20; --y: 90; --s: 1.3; --d: 2; }
        .crystal-glow-container svg:nth-of-type(3) { --x: 50; --y: 5;  --s: 1.2; --d: 3; }
        .crystal-glow-container svg:nth-of-type(4) { --x: 80; --y: 85; --s: 1.0; --d: 2; }
        .crystal-glow-container svg:nth-of-type(5) { --x: 102; --y: 20; --s: 0.9; --d: 4; }
      `}</style>

      {/* Background radial ambient glow */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] md:w-[750px] h-[380px] md:h-[750px] rounded-full -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(208, 188, 255, 0.14) 0%, rgba(208, 188, 255, 0.03) 45%, transparent 70%)',
        }}
      />
      <div 
        className="absolute top-1/3 left-1/3 w-[220px] md:w-[450px] h-[220px] md:h-[450px] rounded-full -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(239, 184, 200, 0.12) 0%, rgba(239, 184, 200, 0.02) 45%, transparent 70%)',
        }}
      />

      {/* Main Display Title */}
      <motion.h1
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="font-display font-extrabold text-3xl sm:text-4xl md:text-6xl leading-tight md:leading-tight text-white tracking-tight max-w-4xl"
      >
        <div className="crystal-glow-container">
          {/* Звёздочки вокруг заголовка */}
          <Sparkle />
          <Sparkle />
          <Sparkle />
          <Sparkle />
          <Sparkle />

          {/* Единая основа без разнородных цветов подложки */}
          <div className="crystal-glow-text-base">
            Создавайте геймплей, а не боритесь с архитектурным кодом
          </div>

          {/* Накладной слой блика */}
          <div className="crystal-glow-text-glare" aria-hidden="true">
            Создавайте геймплей, а не боритесь с архитектурным кодом
          </div>
        </div>
      </motion.h1>

      {/* Subtitles */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 text-sm sm:text-base md:text-lg text-[#cac4d0] max-w-2xl leading-relaxed"
      >
        <span className="font-semibold text-white">Solas Engine</span> — легковесный C# движок для инди-разработчиков. Используя простую Data-Oriented архитектуру Entity-Data-Logic (EDL) и Source Generators, он разгружает процессор и избавляет от лишнего бойлерплейта.
      </motion.p>

      {/* Expressive Action Call buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-18 flex flex-col sm:flex-row items-center gap-4 justify-center"
      >
        <GameButton
          id="hero-download-btn-xl"
          onClick={onDownloadClick}
          variant="primary"
          className="w-full sm:w-auto px-8 py-4 text-sm sm:text-base"
        >
          <Download className="w-5 h-5" />
          Установить SDK v{engineVersion}
        </GameButton>

        <GameButton
          id="hero-docs-btn-xl"
          onClick={onDocsClick}
          variant="outline"
          className="w-full sm:w-auto px-8 py-4 text-sm sm:text-base"
        >
          <BookOpen className="w-5 h-5 text-m3-primary" />
          Документация
        </GameButton>
      </motion.div>

      {/* Solve core problems Section Cards - Material 3 Expressive Bento Layout */}
      <div className="mt-60 w-full max-w-6xl text-left grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Card 1: Featured DX Card */}
        <GameCard
          id="hero-core-card-1"
          accent="primary"
          className="md:col-span-3 flex flex-col justify-between p-6"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="w-14 h-14 bg-m3-primaryContainer/60 rounded-2xl flex items-center justify-center text-m3-primary shadow-xl shadow-m3-primary/10">
                  <CodeXml className="w-7 h-7" />
                </div>
              </div>

              <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
                Удобство разработки (DX)
              </h3>
              <p className="text-m text-[#cac4d0] leading-relaxed max-w-2xl">
                Реактивные структуры и классы данных, автоматическое внедрение зависимостей, встроенная многопоточность и эффективное получение объектов по компонентам – всё, чтобы разработчикам было максимально комфортно создавать геймплей.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-3 text-xs font-mono text-[#cac4d0]">
              <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 flex items-center gap-1.5 text-emerald-400">
                Source Generators
              </span>
              <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-m3-primary">
                Auto-DI Container
              </span>
              <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-m3-tertiary">
                Parallel Execution
              </span>
            </div>
          </div>
        </GameCard>

        {/* Card 2: Easy Git Merges */}
        <GameCard
          id="hero-core-card-2"
          accent="tertiary"
          className="md:col-span-2 flex flex-col justify-between p-6"
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="w-14 h-14 bg-m3-tertiaryContainer/60 rounded-2xl flex items-center justify-center text-m3-tertiary mb-5 shadow-xl shadow-m3-tertiary/10">
                <GitMerge className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-white mb-3">
                Простые слияния в Git
              </h3>
              <p className="text-m text-[#cac4d0] leading-relaxed">
                Вместо огромных и нечитаемых сцен в формате YAML, Solas хранит данные в максимально компактном виде, сохраняя то, что вам нужно. Вы можете выбрать заготовленные сериализаторы или даже написать свой!
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-3 text-xs font-mono text-[#cac4d0]">
              <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 flex items-center gap-1.5 text-emerald-400">
                EASY SCENE MERGING
              </span>
            </div>
          </div>
        </GameCard>

        {/* Card 3: Data-Oriented Architecture */}
        <GameCard
          id="hero-core-card-3"
          accent="secondary"
          className="md:col-span-5 flex flex-col md:flex-row items-center justify-between gap-6 p-8"
        >
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-m3-secondaryContainer/50 rounded-2xl flex items-center justify-center text-m3-secondary shrink-0 shadow-xl shadow-m3-secondary/10">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-display font-bold text-xl md:text-3xl text-white">
                  Разделение данных и логики
                </h3>
              </div>
              <p className="text-m md:text-m text-[#cac4d0] leading-relaxed max-w-3xl">
                Solas использует современный Data-Oriented подход, разделяя данные и логику. Данные могут быть представлены в виде лёгких структур или ссылаемых классов. Логика наследуется от абстрактного класса, а сущность является контейнером.
              </p>
            </div>
          </div>
        </GameCard>

      </div>
    </section>
  );
}

export default memo(HeroComponent);