import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 6200,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 6201,
    strictPort: true,
  },
  test: {
    environment: 'node',
  },
});
