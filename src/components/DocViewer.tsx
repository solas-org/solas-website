/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { MDXProvider } from '@mdx-js/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkCodeGroup from '../lib/remarkCodeGroup';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Cpu, 
  Network, 
  Search, 
  Check, 
  BookOpen, 
  FolderOpen, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { DocCategory, DocPage } from '../types';
import mdxComponents from './mdxComponents';
import {
  loadDocCategories,
  loadDocPage,
  findPageInCategories,
  LoadedDocResult
} from '../lib/docsLoader';
import {
  parseDocRoute,
  buildDocUrl,
  setCurrentDocPageId,
  scrollToHeading
} from '../lib/docsRouting';

function DocViewerComponent() {
  const initialRoute = useMemo(() => parseDocRoute(), []);
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>(initialRoute.pageId || 'Introduction');
  const [loadedDoc, setLoadedDoc] = useState<LoadedDocResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Введение': true,
    'Ядро (Core)': true,
    'Архитектура и Сборка': true,
  });

  // Reference and state to prevent height collapse/jerking when switching to a smaller document
  const contentContainerRef = React.useRef<HTMLDivElement>(null);
  const [containerMinHeight, setContainerMinHeight] = useState<number | undefined>(undefined);
  const heightTimerRef = React.useRef<any>(null);

  // Keep global current doc page ID synchronized for anchor links
  useEffect(() => {
    setCurrentDocPageId(selectedPageId);
  }, [selectedPageId]);

  // Toast listener for heading link copies
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setToastMessage(customEvent.detail || 'Ссылка скопирована!');
      setTimeout(() => {
        setToastMessage(null);
      }, 2200);
    };

    window.addEventListener('solas-toast', handleToast);
    return () => {
      window.removeEventListener('solas-toast', handleToast);
    };
  }, []);

  // Load documentation categories from root & subfolders (or fallback)
  useEffect(() => {
    let isMounted = true;
    loadDocCategories().then((cats) => {
      if (!isMounted) return;
      setCategories(cats);

      // Expand all loaded categories by default
      setExpandedCategories(prev => {
        const next = { ...prev };
        cats.forEach(c => {
          if (next[c.category] === undefined) next[c.category] = true;
        });
        return next;
      });

      // If URL had a pageId that matches case-insensitively, normalize to exact casing
      if (initialRoute.pageId) {
        const found = findPageInCategories(cats, initialRoute.pageId);
        if (found && found.page.id !== selectedPageId) {
          setSelectedPageId(found.page.id);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for browser popstate and hashchange for direct navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const route = parseDocRoute();
      if (route.pageId && route.pageId !== selectedPageId) {
        // Retain container height temporarily to avoid jumping
        if (contentContainerRef.current) {
          const currentHeight = contentContainerRef.current.offsetHeight;
          if (currentHeight > 350) {
            setContainerMinHeight(currentHeight);
          }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSelectedPageId(route.pageId);
        setTimeout(() => setContainerMinHeight(undefined), 450);
      }
      if (route.headingSlug) {
        scrollToHeading(route.headingSlug, 100);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [selectedPageId]);

  // Load document content whenever selectedPageId changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Determine category subfolder for the selected page
    const found = findPageInCategories(categories, selectedPageId);
    const folder = found?.page?.folder;

    loadDocPage(selectedPageId, folder)
      .then((res) => {
        if (!isMounted) return;
        setLoadedDoc(res);
        setIsLoading(false);

        // Scroll to anchor heading if URL contains hash
        const currentRoute = parseDocRoute();
        if (currentRoute.headingSlug) {
          scrollToHeading(currentRoute.headingSlug, 150);
        }
      })
      .catch((err) => {
        console.error(`[DocViewer] Failed to load doc page "${selectedPageId}":`, err);
        if (isMounted) {
          setLoadedDoc(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPageId, categories]);

  // Page selection handler that locks height, smoothly scrolls to top, and updates URL
  const handleSelectPage = (page: DocPage) => {
    if (page.id === selectedPageId) return;

    // 1. Lock minHeight to current height to prevent page jerking if new doc is smaller
    if (contentContainerRef.current) {
      const currentHeight = contentContainerRef.current.offsetHeight;
      if (currentHeight > 350) {
        setContainerMinHeight(currentHeight);
      }
    }

    // 2. Immediately smooth scroll user to the very top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setSelectedPageId(page.id);
    setIsMobileMenuOpen(false);

    // 3. Update canonical URL in browser history: /docs/file-name
    const url = buildDocUrl(page.id);
    try {
      const urlObj = new URL(url);
      window.history.pushState(null, '', `${urlObj.pathname}${urlObj.search}`);
    } catch {
      window.history.pushState(null, '', url);
    }

    // 4. Smoothly release minHeight after scroll & mount transition
    if (heightTimerRef.current) clearTimeout(heightTimerRef.current);
    heightTimerRef.current = setTimeout(() => {
      setContainerMinHeight(undefined);
    }, 450);
  };

  // Real-time search filtering across all categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();

    return categories.map(cat => {
      const matchedPages = cat.pages.filter(page => 
        page.title.toLowerCase().includes(query) || 
        page.id.toLowerCase().includes(query)
      );

      return {
        ...cat,
        pages: matchedPages
      };
    }).filter(cat => cat.pages.length > 0);
  }, [categories, searchQuery]);

  // Toggle category expand/collapse
  const toggleCategory = (catName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Category Icon Mapping
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return <Compass className="w-4 h-4 text-[#efb8c8]" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-[#d0bcff]" />;
      case 'Network': return <Network className="w-4 h-4 text-emerald-400" />;
      default: return <BookOpen className="w-4 h-4 text-slate-300" />;
    }
  };

  // Calculate next page for pagination
  const nextPage = useMemo(() => {
    const allPages = categories.flatMap(cat => cat.pages);
    const currentIndex = allPages.findIndex(page => page.id === selectedPageId);
    if (currentIndex !== -1 && currentIndex < allPages.length - 1) {
      return allPages[currentIndex + 1];
    }
    return null;
  }, [categories, selectedPageId]);

  // Find currently active page title
  const activePageTitle = useMemo(() => {
    for (const cat of categories) {
      const page = cat.pages.find(p => p.id === selectedPageId);
      if (page) return page.title;
    }
    return "Документация";
  }, [categories, selectedPageId]);

  return (
    <div className="pt-6 md:pt-8 pb-10 max-w-7xl mx-auto relative px-4" id="docs-view-layout-container">
      {/* Toast Alert Dialog for link copies */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 bg-[#381e72] border border-m3-primary/30 text-[#eaddff] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold font-mono"
            id="toast-notification-success"
          >
            <Check className="w-4 h-4 text-m3-primary" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating menu button for mobile viewports */}
      <button
        id="mobile-docs-menu-toggler"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-m3-primary hover:bg-[#c2aeff] text-m3-onPrimary rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center border border-white/5"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 relative gap-6 md:gap-8">
        {/* LEFT SIDE: Sidebar Navigation - col-span-3 */}
        <aside className={`
          fixed md:sticky md:top-24 left-0 z-30 w-[280px] md:w-auto md:col-span-3 p-4 sm:p-5 m3-glass border border-white/10 rounded-2xl md:rounded-3xl transition-transform duration-300 transform md:transform-none flex flex-col md:h-fit md:max-h-[calc(100vh-120px)] inset-y-0 md:inset-y-auto
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `} id="docs-sidebar-panel">

          <div className="flex flex-col overflow-hidden h-full">

            {/* Search bar input */}
            <div className="relative mb-4" id="docs-search-wrapper">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                id="docs-search-input"
                type="text"
                placeholder="Поиск разделов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/40 border border-white/5 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-m3-primary/30 transition-all font-sans text-white focus:ring-1 focus:ring-m3-primary/20"
              />
            </div>

            {/* Folders navigation list */}
            <nav className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {filteredCategories.length === 0 ? (
                <div className="text-xs font-mono text-neutral-500 text-center py-6 border border-dashed border-white/5 rounded-xl">
                  Разделы не найдены
                </div>
              ) : (
                filteredCategories.map((cat, cIdx) => {
                  const isExpanded = expandedCategories[cat.category] !== false;

                  return (
                    <div key={cat.category} className="space-y-1.5" id={`sidebar-category-${cIdx}`}>
                      {/* Category item header toggler */}
                      <button
                        onClick={() => toggleCategory(cat.category)}
                        className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white hover:text-m3-primary transition-all p-1.5 cursor-pointer rounded-lg hover:bg-white/2"
                      >
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(cat.icon)}
                          <span>{cat.category}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </button>

                      {/* Pages inside this folder category */}
                      {isExpanded && (
                        <div className="pl-4 border-l border-white/5 ml-3.5 space-y-1">
                          {cat.pages.map(page => {
                            const isActive = page.id === selectedPageId;

                            return (
                              <button
                                key={page.id}
                                id={`sidebar-page-${page.id}`}
                                onClick={() => handleSelectPage(page)}
                                className={`w-full text-left py-2.5 px-3 rounded-xl text-xs transition-all duration-200 flex items-center cursor-pointer select-none ${
                                  isActive
                                    ? 'bg-gradient-to-r from-m3-primaryContainer/80 to-m3-primaryContainer/40 text-white font-semibold shadow-md border-2 border-m3-primary/30'
                                    : 'text-[#cac4d0] hover:text-white hover:bg-white/8 hover:translate-x-0.5 border-2 border-transparent'
                                }`}
                              >
                                {isActive && (
                                  <span className="w-1.5 h-3.5 rounded-full bg-m3-primary mr-2 shrink-0" />
                                )}
                                <span className="truncate">{page.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
          </div>

        </aside>

        {/* Screen dim layer on mobile */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* RIGHT SIDE: MDX/Markdown Canvas Display - col-span-9 */}
        <main className="md:col-span-9" id="docs-view-scroll-canvas">
          <div className="max-w-3xl mx-auto">

            {/* Render compiled MDX or Markdown */}
            <div
              ref={contentContainerRef}
              style={{ minHeight: containerMinHeight ? `${containerMinHeight}px` : undefined }}
              className="p-6 md:p-10 rounded-3xl m3-glass border border-white/5 shadow-xl relative min-h-[500px] overflow-hidden transition-[min-height] duration-300 ease-out"
            >

              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="docs-loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center justify-center py-28 text-center"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-m3-primary border-t-transparent animate-spin mb-4" />
                    <span className="text-xs font-mono text-[#cac4d0]">Загрузка документации...</span>
                  </motion.div>
                ) : loadedDoc ? (
                  <motion.div
                    key={selectedPageId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="markdown-body"
                  >
                    {loadedDoc.type === 'component' ? (
                      <MDXProvider components={mdxComponents}>
                        <loadedDoc.Component components={mdxComponents} />
                      </MDXProvider>
                    ) : (
                      <Markdown
                        remarkPlugins={[remarkGfm, remarkCodeGroup]}
                        components={mdxComponents}
                      >
                        {loadedDoc.markdown}
                      </Markdown>
                    )}
                  </motion.div>
                ) : (
                  <div className="py-20 text-center text-[#cac4d0] font-mono text-sm">
                    Документ не найден
                  </div>
                )}
              </AnimatePresence>

              {/* Bottom pagination */}
              <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#cac4d0]/50">
                <span>Solas Engine Documentation</span>

                {nextPage && (
                  <button
                    onClick={() => handleSelectPage(nextPage)}
                    className="flex items-center gap-2 text-m3-primary text-right hover:text-white transition-colors cursor-pointer"
                  >
                    Следующая страница: {nextPage.title}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default memo(DocViewerComponent);
