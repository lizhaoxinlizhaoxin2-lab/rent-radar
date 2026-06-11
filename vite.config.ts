import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 设为相对路径，方便部署到 GitHub Pages 等子路径环境
export default defineConfig({
  plugins: [react()],
  base: './',
});
