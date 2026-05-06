import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // App shell：预缓存所有构建产物，离线秒开
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // 运行时缓存策略
        runtimeCaching: [
          {
            // Supabase REST API — NetworkFirst，超时 4s 降级到缓存
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Supabase Auth — NetworkFirst，短缓存只做超时兜底
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/auth\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-auth',
              networkTimeoutSeconds: 6,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
          {
            // 图片 — StaleWhileRevalidate，立即响应同时后台刷新
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // Google Fonts — CacheFirst，长期有效
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Kana Jump! 日语觉醒之旅',
        short_name: 'Kana Jump',
        description: '日语假名和单词学习应用',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#87CEEB',
        orientation: 'portrait',
        lang: 'zh-CN',
        icons: [
          {
            src: '/icons/kana-jump-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/kana-jump-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/kana-jump-180.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
