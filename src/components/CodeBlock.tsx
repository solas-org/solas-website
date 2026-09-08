/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, memo } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  'data-raw'?: string;
  'data-language'?: string;
  'data-title'?: string;
  'data-file'?: string;
  raw?: string;
  language?: string;
  title?: string;
}

/**
 * Extracts plain text recursively from React children
 */
function extractTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractTextContent).join('');
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return extractTextContent(props?.children);
  }
  return '';
}

/**
 * Custom CodeBlock component adhering to Solas Material Design
 * Features:
 * - High-contrast syntax display (via Shiki)
 * - Copy button: icon-only at top-right, visible on block hover
 * - No top/bottom margins (my-0)
 * - File path / Title bar when available
 */
function CodeBlockComponent(props: CodeBlockProps) {
  const {
    'data-raw': dataRaw,
    'data-language': dataLanguage,
    'data-title': dataTitle,
    'data-file': dataFile,
    raw,
    language,
    title,
    className = '',
    children,
    ...rest
  } = props;

  const [copied, setCopied] = useState(false);

  // Resolve raw text for clipboard
  const codeContent = dataRaw || raw || extractTextContent(children).trim();

  // Resolve title
  const displayTitle = dataTitle || title || dataFile || '';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!codeContent) return;
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e0c14] shadow-2xl transition-all duration-300 group/code">
      {/* Icon-only Copy Button at Top-Right (visible on hover) */}
      <button
        onClick={handleCopy}
        type="button"
        aria-label="Скопировать код"
        title={copied ? "Скопировано!" : "Копировать код"}
        className="absolute top-2.5 right-2.5 z-10 p-2 rounded-xl bg-[#1a1722]/80 hover:bg-[#282236] text-[#cac4d0] hover:text-white border border-white/10 opacity-0 group-hover/code:opacity-100 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md active:scale-95 focus:outline-none"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-m3-primary hover:text-white transition-colors" />
        )}
      </button>

      {/* Code Container */}
      <pre
        className={`md:p-5 overflow-x-auto text-xs md:text-sm leading-relaxed font-mono bg-transparent selection:bg-m3-primary/30 selection:text-white scrollbar-thin border-0 shadow-none m-0 ${className}`}
        {...rest}
      >
        {children}
      </pre>
    </div>
  );
}

export default memo(CodeBlockComponent);
