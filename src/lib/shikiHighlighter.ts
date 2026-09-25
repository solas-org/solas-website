import { createHighlighter, type Highlighter } from 'shiki';

let _promise: Promise<Highlighter> | null = null;
let _highlighter: Highlighter | null = null;

/**
 * Returns a cached Shiki highlighter.
 * First call triggers async creation; subsequent calls return the cached instance.
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (_highlighter) return _highlighter;
  if (!_promise) {
    _promise = createHighlighter({
      themes: ['catppuccin-mocha'],
      langs: [
        'csharp', 'bash', 'shell', 'typescript', 'tsx',
        'javascript', 'jsx', 'json', 'yaml', 'xml',
        'hlsl', 'glsl', 'markdown',
      ],
    });
  }
  _highlighter = await _promise;
  return _highlighter;
}

// Kick off loading immediately so it's ready by the time docs are shown
getHighlighter().catch(() => {/* ignore preload errors */});
