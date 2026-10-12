import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SEGURANÇA: o antigo bloco `define` injetava GEMINI_API_KEY dentro do JavaScript do navegador
// (qualquer visitante conseguiria ler a chave). O código não usa Gemini, então foi removido.
// Nunca exponha chaves privadas via `define` ou variáveis VITE_*: o que entra no bundle é público.
export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
