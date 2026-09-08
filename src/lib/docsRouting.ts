/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let currentDocPageId = 'Introduction';

export function setCurrentDocPageId(pageId: string): void {
  currentDocPageId = pageId;
}

export function getCurrentDocPageId(): string {
  return currentDocPageId;
}

export interface ParsedDocRoute {
  isDocs: boolean;
  pageId?: string;
  headingSlug?: string;
}

/**
 * Parses current window location for docs routing.
 * Supports:
 * - Pathname: /docs/:pageId or /solas-website/docs/:pageId
 * - Hash fallback: #/docs/:pageId#heading
 * - Query fallback: ?doc=:pageId
 */
export function parseDocRoute(): ParsedDocRoute {
  if (typeof window === 'undefined') {
    return { isDocs: false };
  }

  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  // 1. Pathname match: /docs/:pageId or /<base>/docs/:pageId
  const pathMatch = pathname.match(/(?:^|\/)docs\/([^/?#]+)/i);
  if (pathMatch) {
    const rawPageId = decodeURIComponent(pathMatch[1]);
    const headingSlug = hash ? decodeURIComponent(hash.replace(/^#/, '')) : undefined;
    return {
      isDocs: true,
      pageId: rawPageId,
      headingSlug: headingSlug && !headingSlug.startsWith('/docs') ? headingSlug : undefined,
    };
  }

  // 2. Hash router fallback: #/docs/:pageId or #docs/:pageId
  if (hash.startsWith('#/docs/') || hash.startsWith('#docs/')) {
    const parts = hash.replace(/^#\/?docs\//, '').split('#');
    const rawPageId = decodeURIComponent(parts[0]);
    const headingSlug = parts[1] ? decodeURIComponent(parts[1]) : undefined;
    return {
      isDocs: true,
      pageId: rawPageId,
      headingSlug,
    };
  }

  // 3. Search query fallback: ?doc=:pageId or ?page=:pageId
  const urlParams = new URLSearchParams(search);
  const docParam = urlParams.get('doc') || urlParams.get('page');
  if (docParam) {
    const headingSlug = hash ? decodeURIComponent(hash.replace(/^#/, '')) : undefined;
    return {
      isDocs: true,
      pageId: docParam,
      headingSlug,
    };
  }

  // 4. Plain /docs path
  if (pathname.endsWith('/docs') || pathname.endsWith('/docs/')) {
    return {
      isDocs: true,
      pageId: undefined,
      headingSlug: hash ? decodeURIComponent(hash.replace(/^#/, '')) : undefined,
    };
  }

  return { isDocs: false };
}

/**
 * Constructs the canonical URL for a document page and heading
 */
export function buildDocUrl(pageId: string, headingSlug?: string): string {
  if (typeof window === 'undefined') return '';
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const path = `${basePath}/docs/${pageId}${headingSlug ? `#${headingSlug}` : ''}`;
  return `${window.location.origin}${path}`;
}

/**
 * Programmatically navigate to a doc page and optional heading
 */
export function navigateToDoc(pageId: string, headingSlug?: string): void {
  if (typeof window === 'undefined') return;
  const url = buildDocUrl(pageId, headingSlug);
  try {
    const urlObj = new URL(url);
    window.history.pushState(null, '', `${urlObj.pathname}${urlObj.search}${urlObj.hash}`);
  } catch {
    window.history.pushState(null, '', url);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Smoothly scrolls to a heading anchor in the document
 */
export function scrollToHeading(headingSlug: string, delay = 60): void {
  if (typeof window === 'undefined' || !headingSlug) return;
  
  const attemptScroll = () => {
    const decodedSlug = decodeURIComponent(headingSlug).replace(/^#/, '');
    const element = document.getElementById(decodedSlug) || 
      document.querySelector(`[id="${decodedSlug}"]`) ||
      document.querySelector(`a[name="${decodedSlug}"]`);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }
    return false;
  };

  // Try immediately
  if (!attemptScroll()) {
    // Retry after delay to allow DOM render
    setTimeout(() => {
      if (!attemptScroll()) {
        setTimeout(attemptScroll, 200);
      }
    }, delay);
  }
}
