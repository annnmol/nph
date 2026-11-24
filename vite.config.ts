import { readFileSync } from 'node:fs'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Reuse the exact Vercel mappings locally; local success is not a Vercel deployment test.
const routes = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
  rewrites: { source: string; destination: string }[]
}
const proxy = Object.fromEntries(routes.rewrites.map(({ source, destination }) => {
  const upstream = new URL(destination)
  return [`^${source}$`, {
    target: upstream.origin, changeOrigin: true,
    rewrite: () => upstream.pathname,
  }]
}))

// https://vite.dev/config/
export default defineConfig({
  server: { host: 'localhost', port: 5173, strictPort: true, proxy },
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
