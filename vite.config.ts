import { crx, defineManifest } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'やることリスト枚数確認',
  version: '1.1.1',
  description: 'やることリストで各商品の枚数と件数を確認する拡張機能',
  permissions: ['tabs', 'activeTab', 'scripting', 'storage'],
  host_permissions: [
    'https://jp.mercari.com/todos',
    'http://localhost:5173/*', // 開発環境用
    'https://jp.mercari.com/sell/create',
  ],
  content_scripts: [
    {
      matches: ['https://jp.mercari.com/todos'],
      js: ['src/content.ts'],
    },
    {
      matches: ['https://jp.mercari.com/sell/create'],
      js: ['src/sell-create-content.ts'],
    },
  ],
  action: {
    default_popup: 'src/popup.html',
    default_title: 'らくらくメルカリ便監視設定',
  },
});

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
