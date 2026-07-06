import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // expõe o dev server na rede local para acessar pelo celular (http://<ip-do-pc>:5173)
  server: { host: true },
  preview: { host: true },
})
