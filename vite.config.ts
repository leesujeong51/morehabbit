import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: './',
  // 캐릭터 이미지(각 50KB 미만)를 번들에 내장 — 이미지 폴더 누락으로 깨지는 일 방지
  build: { assetsInlineLimit: 64 * 1024 },
})
