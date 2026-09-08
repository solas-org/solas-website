/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { visit } from 'unist-util-visit';

/**
 * Parses tabs attribute from `<CodeGroup tabs={['C#', 'Slang']}>`
 */
function parseTabsAttribute(htmlString: string): string[] | undefined {
  // Pattern 1: tabs={['C#', 'Slang']} or tabs={["C#", "Slang"]}
  const arrayMatch = htmlString.match(/tabs\s*=\s*\{\s*\[([^\]]+)\]\s*\}/);
  if (arrayMatch) {
    const rawItems = arrayMatch[1].split(',');
    return rawItems
      .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  // Pattern 2: tabs="C#, Slang"
  const stringMatch = htmlString.match(/tabs\s*=\s*["']([^"']+)["']/);
  if (stringMatch) {
    return stringMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  return undefined;
}

function getNodeRawText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(getNodeRawText).join('');
  }
  return '';
}

/**
 * Remark plugin that transforms <CodeGroup>...</CodeGroup> and :::code-group...:::
 * into a single unified AST node whose children are the grouped code blocks.
 */
export default function remarkCodeGroup() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (!node.children || !Array.isArray(node.children)) return;

      const children = node.children;
      let i = 0;

      while (i < children.length) {
        const child = children[i];
        const rawText = getNodeRawText(child).trim();

        // 1. Check for CodeGroup opening: <CodeGroup ...> or :::code-group
        const isHtmlOrTextCodeGroup = /<CodeGroup\b/i.test(rawText);
        const isDirectiveCodeGroup = /^\s*:::code-group\s*$/i.test(rawText);

        if (isHtmlOrTextCodeGroup || isDirectiveCodeGroup) {
          const startIndex = i;
          let tabs: string[] | undefined;

          if (isHtmlOrTextCodeGroup) {
            tabs = parseTabsAttribute(rawText);
          }

          // Find closing tag: </CodeGroup> or :::
          let closeIndex = -1;
          const collectedCodeNodes: any[] = [];

          for (let j = startIndex + 1; j < children.length; j++) {
            const nextChild = children[j];
            const nextRawText = getNodeRawText(nextChild).trim();

            if (isHtmlOrTextCodeGroup && /<\/CodeGroup>/i.test(nextRawText)) {
              closeIndex = j;
              break;
            }

            if (isDirectiveCodeGroup && /^\s*:::\s*$/i.test(nextRawText)) {
              closeIndex = j;
              break;
            }

            // Collect code blocks directly or inside paragraphs
            if (nextChild.type === 'code') {
              collectedCodeNodes.push(nextChild);
            } else if (nextChild.children && Array.isArray(nextChild.children)) {
              for (const inner of nextChild.children) {
                if (inner.type === 'code') {
                  collectedCodeNodes.push(inner);
                }
              }
            }
          }

          if (closeIndex !== -1 && collectedCodeNodes.length > 0) {
            const tabAttrString = tabs && tabs.length > 0 ? tabs.join(',') : '';

            // Create grouped node with both tabs array and data-tabs string for HTML/React hydration
            const groupNode = {
              type: 'mdxJsxFlowElement',
              name: 'CodeGroup',
              attributes: [
                {
                  type: 'mdxJsxAttribute',
                  name: 'tabs',
                  value: tabAttrString,
                },
                {
                  type: 'mdxJsxAttribute',
                  name: 'data-tabs',
                  value: tabAttrString,
                },
              ],
              data: {
                hName: 'CodeGroup',
                hProperties: {
                  tabs: tabs && tabs.length > 0 ? tabs : undefined,
                  'data-tabs': tabAttrString || undefined,
                },
              },
              children: collectedCodeNodes,
            };

            // Replace the entire span [startIndex..closeIndex] with groupNode
            const deleteCount = closeIndex - startIndex + 1;
            children.splice(startIndex, deleteCount, groupNode);
            i = startIndex + 1;
            continue;
          }
        }

        i++;
      }
    });
  };
}

