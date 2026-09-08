/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Hash, Check } from 'lucide-react';
import CodeBlock from './CodeBlock';
import CodeGroup from './CodeGroup';
import { getCurrentDocPageId, buildDocUrl, scrollToHeading } from '../lib/docsRouting';

/**
 * Slugifies header text for anchor links and section navigation
 */
export function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0400-\u04FF -]/g, '') // preserves Cyrillic and Latin characters
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts plain string from header children (including nested elements)
 */
function getHeadingText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(getHeadingText).join('');
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return getHeadingText(props?.children);
  }
  return '';
}

/**
 * Interactive heading with smooth scroll, /docs/file-name#header-name link copy, and icon feedback
 */
function HeadingWithAnchor({
  as: Tag,
  id,
  children,
  className = '',
  iconSize = 'w-4 h-4',
  ...props
}: {
  as: 'h1' | 'h2' | 'h3' | 'h4';
  id?: string;
  children: React.ReactNode;
  className?: string;
  iconSize?: string;
  [key: string]: any;
}) {
  const [copied, setCopied] = React.useState(false);
  const text = getHeadingText(children);
  const slug = id || slugify(text);

  const handleAnchorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!slug) return;

    // 1. Smooth scroll
    scrollToHeading(slug);

    // 2. URL format: /docs/file-name#header-name
    const pageId = getCurrentDocPageId();
    const url = buildDocUrl(pageId, slug);

    // 3. Update browser address bar without reload
    try {
      const urlObj = new URL(url);
      window.history.pushState(null, '', `${urlObj.pathname}${urlObj.search}${urlObj.hash}`);
    } catch {
      window.history.pushState(null, '', url);
    }

    // 4. Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.dispatchEvent(new CustomEvent('solas-toast', { 
        detail: `Ссылка на раздел скопирована!` 
      }));
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tag
      id={slug}
      className={`${className} flex items-center justify-between group scroll-mt-28`}
      {...props}
    >
      <span className="tracking-tight">{children}</span>
      {slug && (
        <a
          href={`#${slug}`}
          onClick={handleAnchorClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-m3-primary/50 hover:text-m3-primary p-1.5 rounded-lg hover:bg-white/5 cursor-pointer ml-3 shrink-0"
          aria-label="Скопировать ссылку на раздел"
          title={copied ? "Ссылка скопирована!" : "Скопировать ссылку"}
        >
          {copied ? (
            <Check className={`${iconSize} text-emerald-400`} />
          ) : (
            <Hash className={iconSize} />
          )}
        </a>
      )}
    </Tag>
  );
}

/**
 * Mapped MDX components for Solas design system
 */
export const mdxComponents = {
  // 1. TYPOGRAPHY HEADINGS WITH AUTOMATIC ANCHOR LINKS & ROUTING
  h1: (props: any) => (
    <HeadingWithAnchor
      as="h1"
      className="font-display text-3xl md:text-4xl font-bold text-white mb-6 mt-2 border-b border-white/10 pb-3.5"
      iconSize="w-5 h-5"
      {...props}
    />
  ),

  h2: (props: any) => (
    <HeadingWithAnchor
      as="h2"
      className="font-display text-2xl md:text-3xl font-bold text-m3-primary mt-12 mb-4 border-b border-white/5 pb-2.5"
      iconSize="w-4 h-4"
      {...props}
    />
  ),

  h3: (props: any) => (
    <HeadingWithAnchor
      as="h3"
      className="font-display text-lg md:text-xl font-semibold text-m3-tertiary mt-8 mb-3"
      iconSize="w-3.5 h-3.5"
      {...props}
    />
  ),

  h4: (props: any) => (
    <HeadingWithAnchor
      as="h4"
      className="font-display text-base md:text-lg font-medium text-slate-200 mt-6 mb-2"
      iconSize="w-3 h-3"
      {...props}
    />
  ),

  // 2. PARAGRAPHS
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-sm md:text-base text-[#cac4d0] leading-relaxed mb-5 font-sans" {...props}>
      {children}
    </p>
  ),

  // 3. LINKS WITH SMOOTH ANIMATIONS & EXTERNAL ICON
  a: ({ href = '', children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = href.startsWith('http://') || href.startsWith('https://');

    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-m3-primary hover:text-m3-tertiary underline underline-offset-4 decoration-m3-primary/40 hover:decoration-m3-tertiary transition-all duration-200 font-medium inline-flex items-center gap-1 group/link"
        {...props}
      >
        <span>{children}</span>
        {isExternal && (
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/link:opacity-100 transition-opacity inline-block" />
        )}
      </a>
    );
  },

  // 4. CODE BLOCKS & INLINE CODE
  pre: (props: any) => <CodeBlock {...props} />,

  code: ({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    // If inside <pre>, className has language or shiki; if inline, style as badge
    const isInline = !className || !className.includes('language-');

    if (isInline) {
      return (
        <code
          className="bg-white/10 text-m3-primary font-mono text-xs px-1.5 py-0.5 rounded border border-white/10 font-semibold"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },

  // 5. STYLIZED TABLES
  table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-6 rounded-2xl border border-white/10 bg-[#121017]/80 backdrop-blur-md shadow-xl">
      <table className="w-full text-sm text-[#cac4d0] border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-white/5 border-b border-white/10 text-white font-display font-semibold text-xs uppercase tracking-wider" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-white/5" {...props}>
      {children}
    </tbody>
  ),

  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="p-3.5 text-left text-xs font-semibold text-m3-primary" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="p-3.5 text-xs text-[#cac4d0]/90 leading-relaxed font-sans" {...props}>
      {children}
    </td>
  ),

  // 6. BLOCKQUOTES & CALLOUTS
  blockquote: ({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-m3-primary bg-m3-primaryContainer/15 px-4.5 py-3 rounded-r-2xl my-4 text-m3-onPrimaryContainer text-sm leading-relaxed shadow-inner [&>p:last-child]:mb-0 [&>p]:mb-1.5"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // 7. LISTS
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 mb-5 space-y-2 text-sm text-[#cac4d0] marker:text-m3-primary font-sans" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 mb-5 space-y-2 text-sm text-[#cac4d0] marker:text-m3-primary marker:font-mono font-sans" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-t border-white/10" {...props} />
  ),

  // 8. INTERACTIVE CODE GROUPS
  CodeGroup,
  codegroup: CodeGroup,
};

export default mdxComponents;
