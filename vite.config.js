import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(Date.now().toString()),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/eporner': {
        target: 'https://www.eporner.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/eporner/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase-vendor';
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor';
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux')) return 'redux-vendor';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'react-vendor';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/swiper')) return 'ui-vendor';
        },
      },
    },
  },
})
