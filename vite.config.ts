import { build, defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Builds the physics prep app (physics-prep/, its own Vite project) into dist/physics right after
// the main app, so the existing eengineer.net deploy serves it at /physics with no extra Vercel
// setup. It runs inside `vite build` itself, so it works whatever build command Vercel uses.
// If the physics build fails, the whole build fails and Vercel keeps the last good deploy live.
function physicsPrep(): Plugin {
  return {
    name: 'eengineer:physics-prep',
    apply: 'build',
    async closeBundle() {
      const root = path.resolve(__dirname, 'physics-prep')
      await build({
        root,
        configFile: path.resolve(root, 'vite.config.ts'),
        base: '/physics/',
        logLevel: 'warn',
        build: { outDir: path.resolve(__dirname, 'dist/physics'), emptyOutDir: true },
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), physicsPrep()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
