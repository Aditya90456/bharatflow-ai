import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react({
        // Optimize JSX runtime
        jsxRuntime: 'automatic'
      })
    ],
    define: {
      // robustly define the API key so it is replaced at build time
      // Check both loaded env object AND system process.env to ensure key is found
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '')
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      // Optimize build performance
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Improved code splitting for better caching
          manualChunks: {
            // Core React libraries
            'react-vendor': ['react', 'react-dom'],
            // UI libraries
            'ui-vendor': ['@heroicons/react'],
            // Chart libraries
            'charts-vendor': ['recharts'],
            // Search engine components
            'search-engine': ['./services/searchEngine.ts'],
            // Gemini AI services
            'ai-services': ['./services/geminiService.ts']
          },
          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/[name]-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.');
            const ext = info[info.length - 1];
            if (/\.(css)$/.test(assetInfo.name!)) {
              return `css/[name]-[hash].${ext}`;
            }
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name!)) {
              return `images/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          }
        }
      }
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
        'recharts'
      ],
      // Pre-bundle these for faster dev startup
      force: false
    },
    server: {
      host: true,
      // Optimize dev server
      hmr: {
        overlay: false // Disable error overlay for better performance
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
          timeout: 10000,
          proxyTimeout: 10000
        }
      }
    },
    // Enable esbuild for faster builds
    esbuild: {
      target: 'esnext',
      // Remove console logs in production
      drop: mode === 'production' ? ['console', 'debugger'] : []
    }
  }
})
