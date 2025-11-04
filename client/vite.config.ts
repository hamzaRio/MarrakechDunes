import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'MarrakechDunes - Moroccan Adventures',
          short_name: 'MarrakechDunes',
          description: 'Discover the magic of Morocco with our guided tours and experiences',
          theme_color: '#8B4513',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '32x32',
              type: 'image/x-icon'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/marrakechdunes-sppy\.onrender\.com\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            },
            // Exclude static files from API caching
            {
              urlPattern: /^https:\/\/marrakechdunes-sppy\.onrender\.com\/(manifest\.webmanifest|favicon\.ico|sw\.js|workbox-.*\.js)$/i,
              handler: 'NetworkOnly', // Don't cache static files
              options: {
                cacheName: 'static-files',
                expiration: {
                  maxEntries: 0, // Don't cache at all
                  maxAgeSeconds: 0
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, '../shared'),
        'marrakechdunes-shared': path.resolve(__dirname, '../shared'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:10000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            tanstack: ['@tanstack/react-query'],
          },
        },
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // Respect environment-provided API URL from Vercel/Render/local .env
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
      'import.meta.env.MAP_PROVIDER': JSON.stringify(env.MAP_PROVIDER || ''),
      'import.meta.env.LEAFLET_ENABLED': JSON.stringify(env.LEAFLET_ENABLED || ''),
      'import.meta.env.VITE_MAP_PROVIDER': JSON.stringify(env.VITE_MAP_PROVIDER || env.MAP_PROVIDER || ''),
      'import.meta.env.VITE_LEAFLET_ENABLED': JSON.stringify(env.VITE_LEAFLET_ENABLED || env.LEAFLET_ENABLED || ''),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
