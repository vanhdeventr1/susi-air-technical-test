
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineNuxtConfig({
  srcDir: 'src/',
  dir: {
    public: resolve(projectRoot, 'public'),
  },
  modules: ['@pinia/nuxt'],
  css: [resolve(projectRoot, 'assets/scss/main.scss')],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api/v1',
    },
  },
  devServer: {
    port: 3001,
  },
  devtools: { enabled: true },
})