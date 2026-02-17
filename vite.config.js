import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      // Force the standard filename for better detection
      manifestFilename: 'manifest.json',
      // Removed favicon.ico, using the PNGs from public folder instead
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'mask-icon.svg'],
      workbox: {
        // Increase cache limit to 4MB to ensure the large app bundle 
        // (including AI logic and UI libraries) is successfully cached for offline use.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Zip EasySpeak AI',
        short_name: 'EasySpeakAI',
        description: 'A free AAC dashboard by Zip Solutions',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        id: "https://easyspeakai.zipsolutions.org",
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'Screenshot_Mobile_1.png',
            sizes: '1075x2393',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Easy Speak on Mobile'
          },
          {
            src: 'Screenshot_Mobile_2.png',
            sizes: '1075x2393',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Easy Speak on Mobile'
          },
          {
            src: 'Screenshot_Mobile_3.png',
            sizes: '1075x2393',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Easy Speak on Mobile'
          },
          {
            src: 'Screenshot_Mobile_4.png',
            sizes: '1075x2393',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Easy Speak on Mobile'
          },
          {
            src: 'Screenshot_Desktop_1.png',
            sizes: '3292x1974',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Easy Speak on Desktop'
          }
        ]
      }
    })
  ],
})