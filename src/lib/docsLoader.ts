/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DocCategory, DocPage } from '../types';

declare global {
  interface Window {
    __SOLAS_DOCS_URL__?: string;
  }
}

// Precompiled MDX modules across all category subfolders in src/docs
const localDocModules = import.meta.glob<{ default: React.ComponentType<any> }>('../docs/**/*.{md,mdx}');

// In-memory caches
let cachedCategories: DocCategory[] | null = null;
const componentCache = new Map<string, React.ComponentType<any>>();
const markdownCache = new Map<string, string>();

// Fallback embedded categories in case of offline/network issues
const FALLBACK_CATEGORIES: DocCategory[] = [
  {
    category: 'Введение',
    icon: 'Compass',
    pages: [
      { id: 'Introduction', title: 'Основная концепция', folder: 'introduction' },
      { id: 'QuickStart', title: 'Быстрый старт', folder: 'introduction' },
    ],
  },
  {
    category: 'Ядро (Core)',
    icon: 'Cpu',
    pages: [
      { id: 'EDL', title: 'EDL', folder: 'core' },
      { id: 'Spaces', title: 'Пространства', folder: 'core' },
      { id: 'UpdateCycle', title: 'Цикл Update', folder: 'core' },
      { id: 'Query', title: 'Query', folder: 'core' },
      { id: 'Command', title: 'Command', folder: 'core' },
    ],
  },
  {
    category: 'Архитектура и Сборка',
    icon: 'Network',
    pages: [
      { id: 'Serialization', title: 'Сериализация', folder: 'architecture' },
      { id: 'Assets', title: 'Ассеты', folder: 'architecture' },
      { id: 'Build', title: 'Сборка', folder: 'architecture' },
    ],
  },
];

/**
 * Returns the base URL where documentation subfolders and markdown files are hosted.
 * Priority:
 * 1. window.__SOLAS_DOCS_URL__ (runtime override)
 * 2. import.meta.env.VITE_DOCS_URL (build/env config)
 * 3. Default: ${import.meta.env.BASE_URL}docs (local site hosting)
 */
export function getDocsBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__SOLAS_DOCS_URL__) {
    return window.__SOLAS_DOCS_URL__.replace(/\/$/, '');
  }
  const envUrl = (import.meta as any).env?.VITE_DOCS_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/$/, '');
  }
  const siteBase = (import.meta as any).env?.BASE_URL || '/';
  return `${siteBase.replace(/\/$/, '')}/docs`;
}

export function setDocsBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    window.__SOLAS_DOCS_URL__ = url.replace(/\/$/, '');
    cachedCategories = null; // Clear cache to refetch from new base
  }
}

/**
 * Loads all documentation categories by:
 * 1. Fetching root `${docsBaseUrl}/index.json` (subfolders list, e.g. ["introduction", "core", "architecture"])
 * 2. Fetching each subfolder's `${docsBaseUrl}/${folder}/index.json`
 * 3. Deriving page file paths from `${docsBaseUrl}/${folder}/${page.id}.md`
 */
export async function loadDocCategories(): Promise<DocCategory[]> {
  if (cachedCategories && cachedCategories.length > 0) {
    return cachedCategories;
  }

  const baseUrl = getDocsBaseUrl();

  try {
    const rootRes = await fetch(`${baseUrl}/index.json`);
    if (!rootRes.ok) {
      throw new Error(`Failed to fetch root doc index from ${baseUrl}/index.json: status ${rootRes.status}`);
    }

    const rootData = await rootRes.json();
    let folders: string[] = [];

    if (Array.isArray(rootData)) {
      if (typeof rootData[0] === 'string') {
        folders = rootData as string[];
      } else if (typeof rootData[0] === 'object' && rootData[0].category) {
        // Already structured as full categories
        cachedCategories = rootData as DocCategory[];
        return cachedCategories;
      }
    } else if (rootData && Array.isArray(rootData.folders)) {
      folders = rootData.folders;
    } else if (rootData && Array.isArray(rootData.categories)) {
      folders = rootData.categories;
    }

    if (folders.length === 0) {
      folders = ['introduction', 'core', 'architecture'];
    }

    // Fetch subfolder indexes in parallel
    const categoryPromises = folders.map(async (folder) => {
      try {
        const subRes = await fetch(`${baseUrl}/${folder}/index.json`);
        if (!subRes.ok) {
          console.warn(`[docsLoader] Subfolder index fetch failed for "${folder}": ${subRes.status}`);
          return null;
        }
        const subData = await subRes.json();

        // Handle both single category object and array of categories
        const catList: DocCategory[] = Array.isArray(subData) ? subData : [subData];

        return catList.map(cat => ({
          ...cat,
          pages: (cat.pages || []).map(p => ({
            ...p,
            folder: p.folder || folder,
            path: p.path || `${baseUrl}/${folder}/${p.id}.md`,
          })),
        }));
      } catch (err) {
        console.warn(`[docsLoader] Could not load subfolder index for ${folder}:`, err);
        return null;
      }
    });

    const results = await Promise.all(categoryPromises);
    const flattened: DocCategory[] = [];

    for (const res of results) {
      if (res && Array.isArray(res)) {
        flattened.push(...res);
      }
    }

    if (flattened.length > 0) {
      cachedCategories = flattened;
      return flattened;
    }
  } catch (err) {
    console.warn('[docsLoader] Root index fetch failed, falling back to embedded manifest.', err);
  }

  cachedCategories = FALLBACK_CATEGORIES;
  return FALLBACK_CATEGORIES;
}

export type LoadedDocResult =
  | { type: 'component'; Component: React.ComponentType<any> }
  | { type: 'markdown'; markdown: string };

/**
 * Loads a documentation page by ID and optional folder.
 * Uses precompiled MDX if available locally, or fetches remote/local markdown text.
 */
export async function loadDocPage(pageId: string, folder?: string): Promise<LoadedDocResult> {
  const normPageId = pageId.trim().toLowerCase();

  // 1. Check memory component cache
  if (componentCache.has(pageId)) {
    return { type: 'component', Component: componentCache.get(pageId)! };
  }

  // 2. Try to find in Vite's precompiled MDX glob
  let matchedKey: string | undefined;
  if (folder) {
    const normFolder = folder.toLowerCase();
    matchedKey = Object.keys(localDocModules).find(k => {
      const lower = k.toLowerCase();
      return lower.includes(`/${normFolder}/`) && (lower.endsWith(`/${normPageId}.md`) || lower.endsWith(`/${normPageId}.mdx`));
    });
  }

  if (!matchedKey) {
    matchedKey = Object.keys(localDocModules).find(k => {
      const lower = k.toLowerCase();
      return lower.endsWith(`/${normPageId}.md`) || lower.endsWith(`/${normPageId}.mdx`);
    });
  }

  if (matchedKey && localDocModules[matchedKey]) {
    try {
      const mod = await localDocModules[matchedKey]();
      componentCache.set(pageId, mod.default);
      return { type: 'component', Component: mod.default };
    } catch (err) {
      console.warn(`[docsLoader] Failed to instantiate precompiled MDX module for ${pageId}, falling back to fetch`, err);
    }
  }

  // 3. Fallback to network fetch (from remote server or local static public/docs)
  const cacheKey = `${folder || ''}:${pageId}`;
  if (markdownCache.has(cacheKey)) {
    return { type: 'markdown', markdown: markdownCache.get(cacheKey)! };
  }

  const baseUrl = getDocsBaseUrl();
  const fetchUrl = folder ? `${baseUrl}/${folder}/${pageId}.md` : `${baseUrl}/${pageId}.md`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    // If folder wasn't specified, try to find folder from categories
    if (!folder) {
      const cats = await loadDocCategories();
      const found = findPageInCategories(cats, pageId);
      if (found && found.page.folder) {
        return loadDocPage(pageId, found.page.folder);
      }
    }
    throw new Error(`Failed to load documentation markdown for ${pageId} from ${fetchUrl}`);
  }

  const text = await res.text();
  markdownCache.set(cacheKey, text);
  return { type: 'markdown', markdown: text };
}

/**
 * Finds a page and its category from the categories list
 */
export function findPageInCategories(
  categories: DocCategory[],
  pageId: string
): { page: DocPage; category: DocCategory } | null {
  const norm = pageId.trim().toLowerCase();
  for (const cat of categories) {
    const page = cat.pages.find(p => p.id.toLowerCase() === norm);
    if (page) {
      return { page, category: cat };
    }
  }
  return null;
}
