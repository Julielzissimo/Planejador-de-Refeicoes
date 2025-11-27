import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define a base como relativa ('./') para que os assets carreguem corretamente
  // independente do nome do repositório no GitHub Pages (ex: /meu-projeto/)
  base: './', 
  build: {
    outDir: 'dist',
  }
});