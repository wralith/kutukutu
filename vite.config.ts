import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from /<repo>/. Local dev keeps the same
// path so asset URLs behave identically in dev and production.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'kutukutu';

export default defineConfig({
  base: `/${repo}/`,
  plugins: [react()],
});
