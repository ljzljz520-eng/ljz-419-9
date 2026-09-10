import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 开发环境通过代理访问两个后端服务，避免跨域并统一入口
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/account': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/account/, '/api/v1')
      },
      '/api/department': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/department/, '/api/v1')
      }
    }
  }
});
