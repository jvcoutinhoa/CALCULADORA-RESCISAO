import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/CALCULADORA-RESCISAO/', // ATENÇÃO AQUI: Tem que ter a barra antes e depois!
})