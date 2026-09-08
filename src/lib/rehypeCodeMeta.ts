/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { visit } from 'unist-util-visit';

function getNodeText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.children) return node.children.map(getNodeText).join('');
  return '';
}

/**
 * Rehype plugin to preserve raw code string, language, file, and title
 * on <pre> properties so that React CodeBlock component can access them.
 */
export default function rehypeCodeMeta() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'pre') {
        const codeNode = node.children?.find((c: any) => c.tagName === 'code');
        if (codeNode) {
          const rawText = getNodeText(codeNode);
          node.properties = node.properties || {};
          node.properties['data-raw'] = rawText;

          // Extract meta string passed from remark code node
          const meta = (codeNode.data?.meta as string) || '';

          // Language from class="language-xyz"
          const className = (codeNode.properties?.className as string[]) || [];
          const langClass = Array.isArray(className)
            ? className.find((c: string) => typeof c === 'string' && c.startsWith('language-'))
            : '';
          const lang = langClass ? langClass.replace('language-', '') : '';
          if (lang) {
            node.properties['data-language'] = lang;
          }

          // Title
          const titleMatch = meta.match(/\btitle=["']([^"']+)["']/i);
          if (titleMatch) {
            node.properties['data-title'] = titleMatch[1];
          }

          // File
          const fileMatch = meta.match(/\bfile=["']([^"']+)["']/i);
          if (fileMatch) {
            node.properties['data-file'] = fileMatch[1];
          }
        }
      }
    });
  };
}
