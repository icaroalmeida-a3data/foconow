import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // expõe o dev server na rede local para acessar pelo celular (http://<ip-do-pc>:5173)
  server: { host: true },
  preview: { host: true },
  build: {
    rolldownOptions: {
      output: {
        // separa as libs grandes em chunks próprios: melhora o cache do navegador
        // entre deploys e elimina o aviso de chunk > 500 kB
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
})
