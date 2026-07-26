import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: (() => {
      if (process.env.GITHUB_PAGES === 'true') {
        let basePath = process.env.VITE_BASE_PATH;
        if (basePath) {
          if (!basePath.startsWith('/')) basePath = '/' + basePath;
          if (!basePath.endsWith('/')) basePath = basePath + '/';
          return basePath;
        }
        return process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.includes('/')
          ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
          : '/MobTracker/';
      }
      return '/';
    })(),
    plugins: [react(), tailwindcss()],
    build: {
      target: 'es2020',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled if the DISABLE_HMR env var is true.
      // Do not modify—file watching is disabled to prevent flickering during automatic edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during automatic edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
