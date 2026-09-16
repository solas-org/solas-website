/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Binary, CheckCircle2, RefreshCw, FileText, ArrowRight, Copy, Check } from 'lucide-react';
import GameCard from './GameCard';
import GameButton from './GameButton';
import { SOURCE_GEN_HIGHLIGHTED } from './sourceGenHighlighted';

interface GeneratorFeature {
  id: string;
  title: string;
  shortDesc: string;
  details: string[];
  icon: React.ReactNode;
  colorClass: string;
  badgeClass: string;
  sourceCode: string;
  generatedCode: string;
}

const features: GeneratorFeature[] = [
  {
    id: 'serialization',
    title: 'Сериализация',
    shortDesc: 'Авто генерация сериалайзеров для данных и референсов',
    icon: <Binary className="w-5 h-5 text-m3-tertiary" />,
    colorClass: 'border-m3-tertiary/20 bg-m3-tertiaryContainer/5 hover:border-m3-tertiary/40 text-m3-tertiary',
    badgeClass: 'bg-m3-tertiaryContainer text-m3-onTertiaryContainer',
    details: [
      'Позволяет делать быстрые локации (Space) с мгновенным сохранением состояния.',
      'Избавляет от boilerplate кода ввиде отдельного сериалайзера для каждой даты (но при желании можно такой написать, тогда генерация для данного скрипта не будет произведена).',
      'Не зависит от выбраного сериализатора.',
    ],
    sourceCode: `public class TextData : IData
{
    public DataProperty<OtherLogic> OtherLogic = new();
    public DataProperty<OtherData> OtherTextData = new();
    public DataProperty<string> Text = new();
    public DataProperty<TextAsset> TextAsset = new();
}
`,
    generatedCode: `public sealed class TextDataSerializer : ICustomSerializer<ExampleGame.Assets.Scripts.TextData>
{
    public void Write(ExampleGame.Assets.Scripts.TextData value, FileStream stream, Serializer serializer, string name = null)
    {
        serializer.BeginObject(stream);
        serializer.Write(value.Text != null, stream, "IsDataPropertyNull");
        if (value.Text != null)
        {
            serializer.Write(value.Text.Value != null, stream, "IsInnerPropertyNull");
            if (value.Text.Value != null)
            {
                serializer.Write(value.Text.Value, stream, "Text");
            }
        }
        serializer.EndObject(stream);
    }

    public ExampleGame.Assets.Scripts.TextData Read(FileStream stream)
    {
        ExampleGame.Assets.Scripts.TextData result = new ExampleGame.Assets.Scripts.TextData();
        if (Query.Serializer.ReadBool(stream))
        {
            result.Text ??= new Solas.ComponentUtils.DataProperty<string>();
            if (Query.Serializer.ReadBool(stream))
            {
                result.Text.Value = Query.Serializer.ReadString(stream);
            }
        }
        return result;
    }
}`
  },
  {
    id: 'autoinject',
    title: 'Сверхбыстрый Автоинжект',
    shortDesc: 'Компиляционное внедрение зависимостей без рантайм-контейнеров',
    icon: <Zap className="w-5 h-5 text-m3-primary" />,
    colorClass: 'border-m3-primary/20 bg-m3-primaryContainer/5 hover:border-m3-primary/40 text-m3-primary',
    badgeClass: 'bg-m3-primaryContainer text-m3-onPrimaryContainer',
    details: [
      'Инициализация классов происходит со скоростью прямого вызова.',
      'Никакого оверхеда на поиск типов в рантайме.',
      'Ошибки несовпадения зависимостей отлавливаются прямо на этапе сборки C#.',
      'Интегрировано в древовидные иерархии пространств по умолчанию.'
    ],
    sourceCode: `public partial class TextLogic : Logic, IInitializable
{
    [AutoInject] private OtherLogic _otherLogic;
    [Inject] public OtherLogic OtherOtherLogic;
}`,
    generatedCode: `public partial class TextLogic
{
    public override void WriteInject(FileStream stream, Entity entity = null)
    {
            var injectables = Query.LastInjectables;
        if (this.OtherOtherLogic == null)
        {
            Query.Serializer.Write(injectables[0].Item1, stream, "OtherOtherLogic_Id");
            Query.Serializer.Write(injectables[0].Item2, stream, "OtherOtherLogic_SpaceId");
        }
        else
        {
            Query.Serializer.Write(this.OtherOtherLogic.Entity.Id, stream, "OtherOtherLogic_Id");
            Query.Serializer.Write(this.OtherOtherLogic.Entity.GetSpaceId(), stream, "OtherOtherLogic_SpaceId");
        }
    }

    public override (Guid, Guid)[] ReadInject(FileStream stream)
    {
        var guids = new (Guid, Guid)[1];
        for (int i = 0; i < 1; i++)
        {
            guids[i] = (Query.Serializer.ReadGuid(stream), Query.Serializer.ReadGuid(stream));
        }
        return guids;
    }

    public override void Inject((Guid, Guid)[] guids)
    {
        this._otherLogic ??= Command.AutoInject<ExampleGame.Assets.Scripts.OtherLogic?>(Entity.CurrentSpace);
        this.OtherOtherLogic = Command.Inject<Entity>(guids[0].Item1, guids[0].Item2).GetLogic<ExampleGame.Assets.Scripts.OtherLogic?>();
    }
}
`
  },
  {
    id: 'update',
    title: 'Эффективные Апдейты',
    shortDesc: 'Однопоточные и многопоточные обновления без виртуального оверхеда',
    icon: <Cpu className="w-5 h-5 text-emerald-400" />,
    colorClass: 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-400/40 text-emerald-400',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-2 border-emerald-500/20',
    details: [
      'Преобразует разрозненные абстрактные вызовы Update() в линейный плоский цикл.',
      'Исключает виртуальный оверхед и путем генерации Update Runners под конкретные типы.',
      'Умный генератор распараллеливает независимые сущности в Parallel на все ядра CPU.',
      'Безумные 1,000,000+ активных сущностей со стабильными 500+ FPS.'
    ],
    sourceCode: `[Update(Parallel = true)]
public partial class TextLogic : Logic, IInitializable
{
    public TextData Data;

    public void Update()
    {
        //Console.WriteLine(Data.Text.Value);
    }
}`,
    generatedCode: `namespace Solas.Generated
{
    internal class TextLogic_UpdateRunner : Solas.Interfaces.IUpdateRunner
    {
        private readonly List<ExampleGame.Assets.Scripts.TextLogic> _updatables = new();

        public void InjectPools(ReadOnlySpan<IComponentPool> pools)
        {
            _updatables.Clear();
            foreach (var pool in pools)
            {
                if (pool is ComponentPool<ExampleGame.Assets.Scripts.TextLogic> castedPool)
                {
                    _updatables.AddRange(castedPool.Components);
                }
            }
        }

        public void Run()
        {
            System.Threading.Tasks.Parallel.ForEach(
                System.Collections.Concurrent.Partitioner.Create(0, _updatables.Count, 64),
                range =>
                {
                    for (int i = range.Item1; i < range.Item2; i++)
                        _updatables[i].Update();
                });
        }
    }
}`
  }
];

function SourceGenVisualizerComponent() {
  const [activeFeatureId, setActiveFeatureId] = useState<string>('serialization');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCopy = (code: string, isGen: boolean) => {
    navigator.clipboard.writeText(code);
    if (isGen) {
      setCopiedGenerated(true);
      setTimeout(() => setCopiedGenerated(false), 2000);
    } else {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    }
  };

  const handleSimulateCompile = () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setCompileProgress(0);
    
    timerRef.current = window.setInterval(() => {
      setCompileProgress(prev => {
        if (prev >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setTimeout(() => {
            setIsCompiling(false);
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const activeFeature = features.find(f => f.id === activeFeatureId) || features[0];
  const highlighted = SOURCE_GEN_HIGHLIGHTED[activeFeature.id] || {
    sourceHtml: `<pre><code>${activeFeature.sourceCode}</code></pre>`,
    generatedHtml: `<pre><code>${activeFeature.generatedCode}</code></pre>`,
  };

  return (
    <section className="py-20 md:py-24 relative overflow-hidden" id="sourcegen-visualizer-section">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-2xl md:text-4xl text-white mt-4 tracking-tight">
            Генерация кода при компиляции
          </h2>
          <p className="mt-4 text-m text-[#cac4d0] max-w-2xl mx-auto">
            Solas использует <strong>C# Source Generators</strong> для исключения рефлексии в рантайме. Вспомогательный код, циклы обновления и сериализаторы генерируются в момент сборки, не расходуя ресурсы процессора во время игры.
          </p>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT PANEL: Interactive Controls & Theory (col-span-5) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[15px] text-center font-mono font-bold tracking-widest text-m3-primary block uppercase">
                Сферы применения автогенерации
              </span>

              <div className="grid grid-cols-1 gap-3">
                {features.map(f => {
                  const isActive = f.id === activeFeatureId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFeatureId(f.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        isActive
                          ? 'border-m3-primary bg-m3-primaryContainer/70 shadow-[0_4px_20px_rgba(208,188,255,0.15)] text-white'
                          : 'border-white/5 bg-[var(--color-m3-surface,#141218)]/60 text-[#cac4d0] hover:bg-[var(--color-m3-surface,#141218)] hover:border-m3-secondary/60'
                      } cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/5 ${isActive ? 'text-m3-primary' : 'text-slate-400'}`}>
                          {f.icon}
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-sm">{f.title}</h4>
                          <p className="text-[11px] opacity-80 line-clamp-1 mt-0.5">{f.shortDesc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Feature Details card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeatureId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 rounded-2xl m3-glass border-2 border-white/5 space-y-3.5"
                >

                  <ul className="space-y-2.5">
                    {activeFeature.details.map((detail, idx) => (
                      <li key={idx} className="text-xs text-[#cac4d0] flex items-start gap-2.5 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Simulated compilation triggers */}
            <div className="p-4 bg-[var(--color-m3-surface,#141218)]/40 backdrop-blur-md rounded-2xl border-2 border-white/10 flex items-center justify-between gap-4 mt-4">
              <div className="flex-1">
                <div className="flex justify-between items-center text-[12px] font-mono text-slate-400 mb-1.5">
                  <span className={isCompiling ? "text-m3-primary animate-pulse" : "text-emerald-400"}>
                    {isCompiling ? `Сборка (${compileProgress}%)` : "Готов к генерации"}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: isCompiling ? `${compileProgress}%` : '0%' }}
                    className="h-full bg-m3-primary rounded-full shadow-[0_0_8px_rgba(208,188,255,0.8)]"
                  />
                </div>
              </div>
              <GameButton
                onClick={handleSimulateCompile}
                disabled={isCompiling}
                variant="primary"
                className="px-5 py-3"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                Генерировать
              </GameButton>
            </div>
          </div>

          {/* RIGHT PANEL: Code Generator Flow (col-span-7) */}
          <GameCard id="generator-code-panel" accent="primary" className="lg:col-span-7 flex flex-col justify-between">
            <div className="h-full flex flex-col">
              
              {/* Header inside Panel */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-bold text-m3-primary uppercase">
                  РАБОТА SOURCE GENERATORS В C#
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Мгновенный кодосинтез до компиляции сборки
                </span>
              </div>

              {/* Simplified visual pipeline of generation */}
              <div className="grid grid-cols-1 md:grid-cols-11 gap-2.5 items-center mb-6 py-4 bg-[var(--color-m3-surface,#141218)]/50 rounded-2xl border-2 border-white/5 px-4 text-center">
                
                {/* Node 1: Clear C# code input */}
                <div className="md:col-span-3 p-2.5 rounded-xl bg-white/3 border-2 border-white/5 flex flex-col items-center">
                  <FileText className="w-6 h-6 text-slate-300 mb-1" />
                  <span className="text-[10px] font-mono font-bold block text-white">Чистый C# класс</span>
                  <span className="text-[8.5px] font-mono text-slate-500 mt-0.5">Разработчик пишет</span>
                </div>

                {/* Arrow 1 */}
                <div className="md:col-span-1 flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                </div>

                {/* Node 2: Generator Parser */}
                <div className="md:col-span-3 p-2.5 rounded-xl bg-m3-primaryContainer/20 border-2 border-m3-primary/30 flex flex-col items-center relative overflow-hidden">
                  {isCompiling && (
                    <div className="absolute inset-0 bg-m3-primary/10 animate-pulse" />
                  )}
                  <Cpu className="w-6 h-6 text-m3-primary mb-1 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold block text-m3-primary">Solas Generator</span>
                  <span className="text-[8.5px] font-mono text-[#ccc2dc] mt-0.5">Парсит AST-дерево</span>
                </div>

                {/* Arrow 2 */}
                <div className="md:col-span-1 flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                </div>

                {/* Node 3: Optimised Code Output */}
                <div className="md:col-span-3 p-2.5 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/20 flex flex-col items-center">
                  <Binary className="w-6 h-6 text-emerald-400 mb-1" />
                  <span className="text-[10px] font-mono font-bold block text-emerald-300">Финальный Код</span>
                  <span className="text-[8.5px] font-mono text-emerald-500/70 mt-0.5">Оптимизация 100%</span>
                </div>

              </div>

              {/* Dual Code Panel comparison layout - Stacked horizontal 2-row format */}
              <div className="flex flex-col gap-4 flex-1">
                
                {/* Visualizer C# Source Code tab (Row 1) */}
                <div className="flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[var(--color-m3-surface,#141218)]/85 backdrop-blur-md relative group/code shadow-xl">
                  {/* Copy Button at Top-Right (visible on hover) */}
                  <button
                    onClick={() => handleCopy(activeFeature.sourceCode, false)}
                    type="button"
                    aria-label="Скопировать код"
                    title={copiedSource ? "Скопировано!" : "Копировать код"}
                    className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-[var(--color-m3-surface,#1c1a22)]/90 hover:bg-white/15 text-[#cac4d0] hover:text-white border border-white/10 opacity-0 group-hover/code:opacity-100 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md active:scale-95 focus:outline-none"
                  >
                    {copiedSource ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-m3-primary hover:text-white transition-colors" />
                    )}
                  </button>

                  <div className="bg-[var(--color-m3-surface,#1c1a22)] px-3.5 py-2 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none pr-10">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-m3-primary" />
                      CleanCode.cs
                    </span>
                    <span className="text-m3-primary font-bold">исходный код разработчика</span>
                  </div>
                  <div
                    className="p-4 overflow-x-auto text-[11.5px] font-mono leading-relaxed max-h-[190px] overflow-y-auto scrollbox min-h-[180px] [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!border-0 [&_code]:!bg-transparent selection:bg-m3-primary/30 selection:text-white"
                    dangerouslySetInnerHTML={{ __html: highlighted.sourceHtml }}
                  />
                </div>

                {/* Visualizer C# Generated Code output (Row 2) */}
                <div className="flex flex-col rounded-2xl overflow-hidden border border-emerald-500/20 bg-[var(--color-m3-surface,#141218)]/90 backdrop-blur-md relative group/code shadow-xl">
                  {/* Copy Button at Top-Right (visible on hover) */}
                  <button
                    onClick={() => handleCopy(activeFeature.generatedCode, true)}
                    type="button"
                    aria-label="Скопировать код"
                    title={copiedGenerated ? "Скопировано!" : "Копировать код"}
                    className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-[var(--color-m3-surface,#1c1a22)]/90 hover:bg-white/15 text-[#cac4d0] hover:text-white border border-white/10 opacity-0 group-hover/code:opacity-100 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md active:scale-95 focus:outline-none"
                  >
                    {copiedGenerated ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-400 hover:text-white transition-colors" />
                    )}
                  </button>

                  <div className="bg-[var(--color-m3-surface,#1c1a22)] px-3.5 py-2 border-b border-emerald-500/15 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none pr-10">
                    <span className="flex items-center gap-2">
                      <Binary className="w-3.5 h-3.5 text-emerald-400" />
                      GeneratedCode.g.cs
                    </span>
                    <span className="text-emerald-400 font-bold">сгенерированный код (0ms)</span>
                  </div>
                  <div
                    className="p-4 overflow-x-auto text-[11.5px] font-mono leading-relaxed max-h-[350px] overflow-y-auto scrollbox min-h-[260px] [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!border-0 [&_code]:!bg-transparent selection:bg-emerald-500/30 selection:text-white"
                    dangerouslySetInnerHTML={{ __html: highlighted.generatedHtml }}
                  />
                </div>

              </div>

            </div>
          </GameCard>

        </div>

      </div>
    </section>
  );
}

export default memo(SourceGenVisualizerComponent);
