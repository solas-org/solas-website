/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';

export interface RemarkCodeTransclusionOptions {
  rootDir?: string;
}

/**
 * Strips common leading whitespace indentation from multiline string
 */
function stripIndent(str: string): string {
  const lines = str.split(/\r?\n/);
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const match = line.match(/^[ \t]*/);
    const indent = match ? match[0].length : 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === Infinity || minIndent === 0) return str.trimEnd();
  return lines.map(line => line.slice(minIndent)).join('\n').trimEnd();
}

/**
 * Extracts content between #region <name> and matching #endregion
 * Supports both C# (#region) and TS/JS (// #region) comments
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
      if (regionRegex.test(line)) {
        startIndex = i + 1;
        depth = 1;
      }
    } else {
      if (anyRegionRegex.test(line)) {
        depth++;
      } else if (endRegionRegex.test(line)) {
        depth--;
        if (depth === 0) {
          break;
        }
      }
      extractedLines.push(line);
    }
  }

  if (startIndex === -1) return null;
  return stripIndent(extractedLines.join('\n'));
}

/**
 * Extracts line range (1-indexed inclusive)
 */
function extractLineRange(content: string, start: number, end: number): string {
  const lines = content.split(/\r?\n/);
  const s = Math.max(1, start) - 1;
  const e = Math.min(lines.length, end);
  return stripIndent(lines.slice(s, e).join('\n'));
}

/**
 * Infers language from file extension
 */
function inferLanguageFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.cs': return 'csharp';
    case '.slang':
    case '.hlsl':
    case '.glsl': return 'slang';
    case '.ts': return 'typescript';
    case '.tsx': return 'tsx';
    case '.js': return 'javascript';
    case '.jsx': return 'jsx';
    case '.json': return 'json';
    case '.md': return 'markdown';
    case '.xml': return 'xml';
    case '.yaml':
    case '.yml': return 'yaml';
    case '.sh':
    case '.bash': return 'bash';
    default: return 'text';
  }
}

/**
 * Custom Remark plugin that transcludes code from external project files
 * Supports:
 * - ```csharp file="./src/Player.cs#region Init"
 * - ```csharp file="./src/Player.cs#L10-L25"
 * - ```csharp file="./src/Player.cs"
 * - ```csharp:./src/Player.cs#region
 */
export default function remarkCodeTransclusion(options: RemarkCodeTransclusionOptions = {}) {
  const defaultRootDir = options.rootDir || process.cwd();

  return (tree: any, file: any) => {
    const currentDocDir = file?.path ? path.dirname(file.path) : defaultRootDir;

    visit(tree, 'code', (node: any) => {
      const meta = node.meta || '';
      const lang = node.lang || '';

      // Check for file=... directive or lang:filepath syntax
      let filePathQuery = '';
      let titleFromMeta = '';

      // Pattern 1: file="path#fragment" or file='path#fragment' or file=path#fragment
      const fileMatch = meta.match(/\bfile="([^"]+)"|\bfile='([^']+)'|\bfile=([^\s]+)/i);
      if (fileMatch) {
        filePathQuery = fileMatch[1] || fileMatch[2] || fileMatch[3];
      } else if (lang.includes(':')) {
        // Pattern 2: lang:path/to/file#region
        const parts = lang.split(':');
        node.lang = parts[0];
        filePathQuery = parts.slice(1).join(':');
      }

      // Check for title in meta (title="MyTitle")
      const titleMatch = meta.match(/\btitle=["']([^"']+)["']/i);
      if (titleMatch) {
        titleFromMeta = titleMatch[1];
      }

      if (!filePathQuery) return;

      // Split into filePath and fragment (region or line range)
      const [rawFilePath, fragment] = filePathQuery.split('#');
      
      // Resolve path: try relative to doc dir, then relative to project root
      let resolvedPath = path.resolve(currentDocDir, rawFilePath);
      if (!fs.existsSync(resolvedPath)) {
        const fromRoot = path.resolve(defaultRootDir, rawFilePath.replace(/^\.?\//, ''));
        if (fs.existsSync(fromRoot)) {
          resolvedPath = fromRoot;
        } else {
          console.warn(`[remarkCodeTransclusion] File not found: ${rawFilePath} (resolved: ${resolvedPath})`);
          return;
        }
      }

      try {
        const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
        let codeResult = fileContent;

        if (fragment) {
          // Check for line range #L10-L20 or #10-20
          const lineMatch = fragment.match(/^L?(\d+)(?:-L?(\d+))?$/i);
          if (lineMatch) {
            const start = parseInt(lineMatch[1], 10);
            const end = lineMatch[2] ? parseInt(lineMatch[2], 10) : start;
            codeResult = extractLineRange(fileContent, start, end);
          } else {
            // Check for region: #region Name or #Name
            const cleanRegion = fragment.replace(/^region\s*/i, '');
            const regionExtracted = extractRegion(fileContent, cleanRegion);
            if (regionExtracted !== null) {
              codeResult = regionExtracted;
            } else {
              console.warn(`[remarkCodeTransclusion] Region "${cleanRegion}" not found in ${rawFilePath}`);
            }
          }
        } else {
          codeResult = stripIndent(fileContent);
        }

        node.value = codeResult;

        // Auto-infer lang if not explicitly specified
        if (!node.lang || node.lang === 'text') {
          node.lang = inferLanguageFromExt(path.extname(resolvedPath));
        }

        // Set or update title
        const displayTitle = titleFromMeta || path.basename(resolvedPath) + (fragment ? ` (${fragment})` : '');
        node.meta = `${node.meta || ''} title="${displayTitle}" file="${rawFilePath}"`.trim();
      } catch (err) {
        console.error(`[remarkCodeTransclusion] Error reading file ${resolvedPath}:`, err);
      }
    });
  };
}
