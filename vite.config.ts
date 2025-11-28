import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Safe process access for build environments
  const cwd = typeof process !== 'undefined' ? process.cwd() : '.';
  const env = loadEnv(mode, cwd, '');

  return {
    plugins: [react()],
    // Base relativa é crucial para GitHub Pages
    base: './', 
    define: {
      // Previne erro 'process is not defined' substituindo a variável no tempo de build
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  };
});
