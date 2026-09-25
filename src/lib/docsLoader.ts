
import React from 'react';
import { DocCategory, DocPage } from '../types';

declare global {
  interface Window {
    __SOLAS_DOCS_URL__?: string;
  }
}

// In-memory caches
let cachedCategories: DocCategory[] | null = null;
const componentCache = new Map<string, React.ComponentType<any>>();
const markdownCache = new Map<string, string>();

/**
 * Returns the base URL where documentation subfolders and markdown files are hosted.
 * Priority:
 * 1. window.__SOLAS_DOCS_URL__ (runtime override)
 * 2. import.meta.env.VITE_DOCS_URL (build/env config)
 * 3. Default: ${import.meta.env.BASE_URL}docs (local site hosting)
 */
export function getDocsBaseUrl(): string {
  window.__SOLAS_DOCS_URL__ = "https://raw.githubusercontent.com/solas-org/solas/master/Docs/Ru";
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
 * 1. Fetching root `${docsBaseUrl}/index.json`
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

  cachedCategories = [];
  return [];
}

export type LoadedDocResult =
  | { type: 'component'; Component: React.ComponentType<any> }
  | { type: 'markdown'; markdown: string };

// ---------------------------------------------------------------------------
// Helpers shared by resolveRelativePaths and resolveTransclusions
// ---------------------------------------------------------------------------

/**
 * Splits a markdown string into alternating [text, codeBlock, text, codeBlock, ...]
 * segments. Even indices are plain text; odd indices are fenced code blocks
 * (including the opening/closing fence lines). This lets us process only the
 * plain-text parts while leaving code blocks untouched.
 */
function splitMarkdownCodeBlocks(markdown: string): string[] {
  const fenceRegex = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm;
  const segments: string[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = fenceRegex.exec(markdown)) !== null) {
    segments.push(markdown.slice(lastIndex, m.index)); // plain text before block
    segments.push(m[0]);                               // the code block itself
    lastIndex = m.index + m[0].length;
  }
  segments.push(markdown.slice(lastIndex)); // trailing plain text
  return segments;
}

/**
 * Resolves relative markdown link/image paths (both ../ and ./) against
 * pageBaseUrl. Code blocks are left completely untouched so that file=
 * directives and code examples are not modified.
 */
function resolveRelativePaths(markdown: string, pageBaseUrl: string): string {
  const relativePathRegex = /((?:\.\.\/|\.\/)[^\s"')]+)/g;

  const segments = splitMarkdownCodeBlocks(markdown);

  return segments
    .map((seg, idx) => {
      // Odd segments are code blocks — skip
      if (idx % 2 === 1) return seg;

      return seg.replace(relativePathRegex, (match) => {
        try {
          const base = pageBaseUrl.endsWith('/') ? pageBaseUrl : `${pageBaseUrl}/`;
          return new URL(match, base).href;
        } catch (e) {
          console.warn(`[Docs] Failed to resolve path: ${match}`, e);
          return match;
        }
      });
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Runtime transclusion (mirrors remarkCodeTransclusion build plugin)
// ---------------------------------------------------------------------------

/**
 * Extracts content between #region <name> and matching #endregion.
 */
function extractRegion(content: string, regionName: string): string | null {
  const lines = content.split(/\r?\n/);
  const cleanName = regionName.trim();
  const regionRegex = new RegExp(`^\\s*(?:\\/\\/|\\/\\*)?\\s*#region\\s+${cleanName}\\b`, 'i');
  const anyRegionRegex = /^\s*(?:\/\/|\/\*)?\s*#region\b/i;
  const endRegionRegex = /^\s*(?:\/\/|\/\*)?\s*#endregion\b/i;

  let startIndex = -1;
  let depth = 0;
  const extractedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (startIndex === -1) {
      if (regionRegex.test(line)) { startIndex = i + 1; depth = 1; }
    } else {
      if (anyRegionRegex.test(line)) depth++;
      else if (endRegionRegex.test(line)) { depth--; if (depth === 0) break; }
      extractedLines.push(line);
    }
  }

  if (startIndex === -1) return null;

  const nonEmpty = extractedLines.filter(l => l.trim().length > 0);
  const minIndent = nonEmpty.reduce((min, l) => {
    const m = l.match(/^[ \t]*/);
    return Math.min(min, m ? m[0].length : 0);
  }, Infinity);
  const indent = isFinite(minIndent) ? minIndent : 0;
  return extractedLines.map(l => l.slice(indent)).join('\n').trimEnd();
}

/**
 * Extracts a line range (1-indexed, inclusive) from file content.
 */
function extractLineRange(content: string, start: number, end: number): string {
  const lines = content.split(/\r?\n/);
  return lines.slice(Math.max(0, start - 1), end).join('\n').trimEnd();
}

/**
 * Converts a path from a code-block `file=` directive into a fetchable URL.
 *
 * - Relative paths (./x, ../x) → resolved against pageBaseUrl (GitHub raw)
 * - Absolute file:/// paths    → stripped of the file:/// scheme and any
 *   Windows drive prefix, then the remaining path segments are resolved
 *   against pageBaseUrl so they land on GitHub raw instead of the local FS
 * - Already-http(s) paths     → returned as-is
 */
function resolveCodeFilePath(rawPath: string, pageBaseUrl: string): string {
  const base = pageBaseUrl.endsWith('/') ? pageBaseUrl : `${pageBaseUrl}/`;

  // Already an HTTP(S) URL — return as-is
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  // Absolute file:/// path — try to salvage by stripping scheme + drive
  if (/^file:\/\/\//i.test(rawPath)) {
    // e.g. file:///D:/project/src/Player.cs  →  src/Player.cs  (we strip
    // everything up to and including the first path segment that looks like
    // a drive letter or repo root, then resolve relative to base)
    let stripped = rawPath.replace(/^file:\/\/\//i, ''); // "D:/project/src/Player.cs"
    stripped = stripped.replace(/^[A-Za-z]:[\\/]/, '');  // "project/src/Player.cs"
    // Forward-slash normalise
    stripped = stripped.replace(/\\/g, '/');
    console.warn(`[docsLoader] Transclusion: converting file:/// path "${rawPath}" → resolving "${stripped}" against base`);
    try {
      return new URL(stripped, base).href;
    } catch {
      return rawPath;
    }
  }

  // Relative path — resolve against base
  try {
    return new URL(rawPath, base).href;
  } catch {
    return rawPath;
  }
}

/**
 * Runtime equivalent of the remarkCodeTransclusion build plugin.
 *
 * Scans the markdown for fenced code blocks that carry a `file=` directive or
 * `lang:path` syntax, fetches the referenced files via HTTP (resolving paths
 * relative to pageBaseUrl), extracts optional region/line-range fragments, and
 * replaces the placeholder block with the actual file content.
 *
 * MUST run BEFORE resolveRelativePaths so that the original relative paths in
 * `file=` attributes are still intact.
 *
 * Supported syntax (mirrors remarkCodeTransclusion):
 *   ```lang file="./src/Player.cs#region Init"
 *   ```lang file="./src/Player.cs#L10-L25"
 *   ```lang file="./src/Player.cs"
 *   ```lang:./src/Player.cs#region
 */
async function resolveTransclusions(markdown: string, pageBaseUrl: string): Promise<string> {
  console.log(`[docsLoader] resolveTransclusions called, pageBaseUrl="${pageBaseUrl}", markdown length=${markdown.length}`);
  console.log(`[docsLoader] Markdown preview:\n${markdown.slice(0, 800)}`);

  // Debug: log every fence block found (without file= filter) to check regex
  const fenceDebugRegex = /^(`{3,}|~{3,})([^\s]*)([ \t][^\n]*)?\n([\s\S]*?)^\1[ \t]*$/gm;
  let fenceCount = 0;
  let fd: RegExpExecArray | null;
  while ((fd = fenceDebugRegex.exec(markdown)) !== null) {
    fenceCount++;
    console.log(`[docsLoader] Fence #${fenceCount}: lang="${fd[2]}", meta="${(fd[3] || '').trim()}", body_start="${fd[4]?.slice(0, 60).replace(/\n/g, '\\n')}"`);
  }
  console.log(`[docsLoader] Total fences in markdown: ${fenceCount}`);
  // Match fenced code blocks (``` or ```` fences)
  const fenceRegex = /^(`{3,})([^\s]*)([ \t][^\n]*)?\n([\s\S]*?)^\1[ \t]*$/gm;

  type PendingMatch = {
    fullMatch: string;
    resolvedLang: string;
    meta: string;
    filePathQuery: string;
  };

  const pending: PendingMatch[] = [];
  let m: RegExpExecArray | null;

  while ((m = fenceRegex.exec(markdown)) !== null) {
    let lang = m[2] || '';
    const meta = (m[3] || '').trim();

    let filePathQuery = '';
    let resolvedLang = lang;

    // Pattern 1: file="path" / file='path' / file=path
    // Note: the attribute value may contain # for region/line fragments
    const fileMatch = meta.match(/\bfile="([^"]+)"|\bfile='([^']+)'|\bfile=(\S+)/i);
    if (fileMatch) {
      filePathQuery = fileMatch[1] || fileMatch[2] || fileMatch[3];
    } else if (lang.includes(':')) {
      // Pattern 2: lang:path/to/file#region
      const colonIdx = lang.indexOf(':');
      resolvedLang = lang.slice(0, colonIdx);
      filePathQuery = lang.slice(colonIdx + 1);
    }

    if (!filePathQuery) continue;

    console.log(`[docsLoader] Found transclusion: lang="${lang}", meta="${meta}", filePathQuery="${filePathQuery}"`);
    pending.push({ fullMatch: m[0], resolvedLang, meta, filePathQuery });
  }

  console.log(`[docsLoader] Total transclusions found: ${pending.length}`);
  if (pending.length === 0) return markdown;

  // Fetch all referenced files in parallel
  const fetched = await Promise.all(
    pending.map(async ({ fullMatch, resolvedLang, meta, filePathQuery }) => {
      // Split path from fragment: "./src/Player.cs#region Init" → path + "region Init"
      const hashIdx = filePathQuery.indexOf('#');
      const rawFilePath = hashIdx === -1 ? filePathQuery : filePathQuery.slice(0, hashIdx);
      const fragment    = hashIdx === -1 ? ''            : filePathQuery.slice(hashIdx + 1);

      const fileUrl = resolveCodeFilePath(rawFilePath, pageBaseUrl);
      console.log(`[docsLoader] Transclusion: rawFilePath="${rawFilePath}", fragment="${fragment}", fileUrl="${fileUrl}"`);

      // Guard: never attempt to fetch file:/// URLs in the browser
      if (/^file:\/\/\//i.test(fileUrl)) {
        console.warn(`[docsLoader] Transclusion skipped — cannot fetch file:/// URL in browser: ${fileUrl}`);
        return null;
      }

      try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
          console.warn(`[docsLoader] Transclusion fetch failed for "${fileUrl}": ${res.status}`);
          return null;
        }
        const fileContent = await res.text();
        console.log(`[docsLoader] Transclusion fetched OK: ${fileUrl} (${fileContent.length} chars)`);

        let code = fileContent;
        if (fragment) {
          const lineMatch = fragment.match(/^L?(\d+)(?:-L?(\d+))?$/i);
          if (lineMatch) {
            const start = parseInt(lineMatch[1], 10);
            const end   = lineMatch[2] ? parseInt(lineMatch[2], 10) : start;
            code = extractLineRange(fileContent, start, end);
          } else {
            const cleanRegion = fragment.replace(/^region\s*/i, '');
            const extracted = extractRegion(fileContent, cleanRegion);
            if (extracted !== null) {
              code = extracted;
            } else {
              console.warn(`[docsLoader] Region "${cleanRegion}" not found in ${fileUrl}`);
            }
          }
        }

        // Build display title (same logic as remarkCodeTransclusion build plugin)
        const baseName = rawFilePath.split('/').pop() || rawFilePath;
        const titleMatch = meta.match(/\btitle=["']([^"']+)["']/i);
        const displayTitle = titleMatch
          ? titleMatch[1]
          : baseName + (fragment ? ` (${fragment})` : '');

        // Rebuild meta: drop old file=/title= attrs, add resolved ones
        const cleanMeta = meta
          .replace(/\bfile=(?:"[^"]*"|'[^']*'|\S+)/gi, '')
          .replace(/\btitle=(?:"[^"]*"|'[^']*'|\S+)/gi, '')
          .trim();
        const newMeta = [cleanMeta, `title="${displayTitle}"`, `file="${rawFilePath}"`]
          .filter(Boolean)
          .join(' ');

        // Reuse the exact fence style from the original block
        const fenceChar = fullMatch.match(/^(`+)/)?.[1] ?? '```';
        const newBlock = `${fenceChar}${resolvedLang} ${newMeta}\n${code}\n${fenceChar}`;

        return { original: fullMatch, replacement: newBlock };
      } catch (err) {
        console.warn(`[docsLoader] Transclusion error for "${fileUrl}":`, err);
        return null;
      }
    })
  );

  let result = markdown;
  for (const entry of fetched) {
    if (entry) {
      // Replace only the first matching occurrence to avoid clobbering identical-looking blocks
      result = result.replace(entry.original, entry.replacement);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main page loader
// ---------------------------------------------------------------------------

export async function loadDocPage(pageId: string, folder?: string): Promise<LoadedDocResult> {

  // 1. Check memory component cache
  if (componentCache.has(pageId)) {
    return { type: 'component', Component: componentCache.get(pageId)! };
  }

  // 2. Check markdown cache
  const cacheKey = `${folder || ''}:${pageId}`;
  if (markdownCache.has(cacheKey)) {
    return { type: 'markdown', markdown: markdownCache.get(cacheKey)! };
  }

  let actualFolder = folder;
  if (!actualFolder) {
    const cats = await loadDocCategories();
    const found = findPageInCategories(cats, pageId);
    if (found && found.page.folder) {
      actualFolder = found.page.folder;
    }
  }

  const baseUrl = getDocsBaseUrl();
  const pageBaseUrl = actualFolder ? `${baseUrl}/${actualFolder}` : baseUrl;
  const fetchUrl = actualFolder
    ? `${baseUrl}/${actualFolder}/${pageId}.md`
    : `${baseUrl}/${pageId}.md`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Failed to load documentation markdown for ${pageId} from ${fetchUrl}`);
  }

  const text = await res.text();

  // Step 1: inline external file references BEFORE resolving relative paths,
  //         so that file="./path" attributes are still in their original form.
  const withTransclusions = await resolveTransclusions(text, pageBaseUrl);

  // Step 2: resolve remaining ./  and ../  relative paths in plain-text sections
  //         (links, images). Code blocks are left untouched.
  const fixedText = resolveRelativePaths(withTransclusions, pageBaseUrl);

  markdownCache.set(cacheKey, fixedText);
  return { type: 'markdown', markdown: fixedText };
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
