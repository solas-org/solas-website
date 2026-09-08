import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import remarkCodeTransclusion from './src/lib/remarkCodeTransclusion';
import remarkCodeGroup from './src/lib/remarkCodeGroup';
import rehypeCodeMeta from './src/lib/rehypeCodeMeta';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm, remarkCodeTransclusion, remarkCodeGroup],
        rehypePlugins: [
          rehypeCodeMeta,
          [rehypeShiki, {
            theme: 'catppuccin-mocha',
            langAlias: {
              slang: 'hlsl',
            },
          }],
        ],
      }),
      react(),
      tailwindcss(),
    ],
    base: '/solas-website/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-mdx': ['@mdx-js/react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
