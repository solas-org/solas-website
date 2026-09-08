/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, Children, isValidElement, memo } from 'react';
import { motion } from 'motion/react';

const STORAGE_KEY = 'solas_doc_code_tab';
const SYNC_EVENT = 'solas-code-tab-change';

export interface CodeGroupProps {
  tabs?: string[] | string;
  'data-tabs'?: string;
  defaultTab?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Normalizes tab labels for cross-language matching (e.g. 'csharp' <-> 'c#', 'slang' <-> 'slang')
 */
function normalizeTab(name: string): string {
  const n = String(name || '').trim().toLowerCase();
  if (n === 'c#' || n === 'cs' || n === 'csharp') return 'c#';
  if (n === 'slang' || n === 'hlsl') return 'slang';
  if (n === 'ts' || n === 'typescript') return 'typescript';
  if (n === 'js' || n === 'javascript') return 'javascript';
  if (n === 'bash' || n === 'sh' || n === 'shell') return 'bash';
  return n;
}

/**
 * Interactive CodeGroup Component
 * Provides:
 * - Segmented Button tab switcher matching site's Material 3 theme
 * - Cross-page and cross-block tab synchronization via localStorage and CustomEvent
 * - Smooth motion transitions between code blocks
 */
function CodeGroupComponent(props: CodeGroupProps) {
  const {
    tabs,
    defaultTab,
    children,
    id,
    className = '',
  } = props;

  // Convert children to clean array, unwrapping fragments or container divs
  const childArray = useMemo(() => {
    const raw = Children.toArray(children);
    const result: React.ReactElement[] = [];

    function collect(nodes: React.ReactNode[]) {
      for (const c of nodes) {
        if (!isValidElement(c)) continue;
        if (c.type === React.Fragment) {
          const fragProps = c.props as { children?: React.ReactNode };
          collect(Children.toArray(fragProps.children));
        } else {
          result.push(c);
        }
      }
    }

    collect(raw);
    return result;
  }, [children]);

  // Normalize passed tabs prop (array or comma-separated string)
  const normalizedPassedTabs = useMemo(() => {
    const rawTabs = tabs || props['data-tabs'];
    if (Array.isArray(rawTabs)) return rawTabs.map(String).filter(Boolean);
    if (typeof rawTabs === 'string' && rawTabs.trim().length > 0) {
      return rawTabs.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    }
    return [];
  }, [tabs, props]);

  // Determine tab names: from explicit tabs prop or derived from child props
  const tabNames: string[] = useMemo(() => {
    if (normalizedPassedTabs.length > 0) return normalizedPassedTabs;

    return childArray.map((child: any, idx) => {
      const p = child?.props || {};
      const innerProps = child?.props?.children?.props || {};

      const rawTitle = p['data-title'] || p.title || innerProps['data-title'] || innerProps.title || '';
      if (rawTitle) return rawTitle;

      const rawLang = p['data-language'] || p.language || innerProps['data-language'] || innerProps.language || '';
      if (rawLang) {
        if (rawLang.toLowerCase() === 'csharp' || rawLang.toLowerCase() === 'cs') return 'C#';
        if (rawLang.toLowerCase() === 'slang') return 'Slang';
        return rawLang.toUpperCase();
      }

      const cls = String(p.className || innerProps.className || '');
      const match = cls.match(/language-(\w+)/);
      if (match) {
        const l = match[1].toLowerCase();
        if (l === 'csharp' || l === 'cs') return 'C#';
        if (l === 'slang') return 'Slang';
        return l.toUpperCase();
      }

      return `Tab ${idx + 1}`;
    });
  }, [normalizedPassedTabs, childArray]);

  // Initialize active tab from localStorage if available and matching
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const found = tabNames.find(t => normalizeTab(t) === normalizeTab(saved));
          if (found) return found;
        }
      } catch (e) {
        // LocalStorage fallback
      }
    }
    return defaultTab || tabNames[0] || '';
  });

  // Keep active tab valid if tabNames change
  useEffect(() => {
    if (tabNames.length > 0 && !tabNames.some(t => normalizeTab(t) === normalizeTab(activeTab))) {
      setActiveTab(tabNames[0]);
    }
  }, [tabNames, activeTab]);

  // Listen for synchronization events across the document
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const selected = customEvent.detail;
      if (!selected) return;

      const match = tabNames.find(t => normalizeTab(t) === normalizeTab(selected));
      if (match) {
        setActiveTab(match);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const match = tabNames.find(t => normalizeTab(t) === normalizeTab(e.newValue));
        if (match) {
          setActiveTab(match);
        }
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [tabNames]);

  // Tab switch handler with localStorage & global event broadcast
  const handleSelectTab = (tabName: string) => {
    setActiveTab(tabName);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, tabName);
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: tabName }));
      } catch (e) {
        // LocalStorage fallback
      }
    }
  };

  // Determine active child index
  const activeIndex = useMemo(() => {
    const idx = tabNames.findIndex(t => normalizeTab(t) === normalizeTab(activeTab));
    return idx >= 0 ? idx : 0;
  }, [tabNames, activeTab]);

  const activeChild = childArray[activeIndex] || childArray[0];

  return (
    <div id={id} className={`my-4 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0c14] shadow-2xl ${className}`}>
      {/* Top Bar: Segmented Buttons */}
      <div className="bg-[#141219] px-3 py-2 border-b border-white/5 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-1.5 p-1 bg-[#1a1722] rounded-xl border border-white/5">
          {tabNames.map((tab) => {
            const isActive = normalizeTab(tab) === normalizeTab(activeTab);

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectTab(tab)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-colors duration-200 cursor-pointer outline-none select-none ${
                  isActive ? 'text-white' : 'text-[#cac4d0] hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={`codeGroupActiveIndicator-${id || 'global'}`}
                    className="absolute inset-0 bg-m3-primaryContainer border border-m3-primary/30 rounded-lg shadow-md"
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Child Content with seamless border integration and keyed switch */}
      <div key={activeIndex} className="[&>div]:my-0 [&>div]:border-none [&>div]:rounded-none [&>div]:shadow-none [&>pre]:my-0 [&>pre]:rounded-none [&>pre]:border-none">
        {activeChild}
      </div>
    </div>
  );
}

export default memo(CodeGroupComponent);
