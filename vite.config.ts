import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    build: {
        chunkSizeWarningLimit: 10 * 1024, // 10 MB
    },
    worker: {
        format: 'es'
    },
    server: {
        headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    plugins: [
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                "name": "PyRunner",
                "short_name": "PyRunner",
                "theme_color": "#1E1E1E",
                "background_color": "#1E1E1E",
                "display": "standalone",
                "start_url": "/",
                "icons": [
                    {
                        "src": "pwa-64x64.png",
                        "sizes": "64x64",
                        "type": "image/png"
                    },
                    {
                        "src": "pwa-192x192.png",
                        "sizes": "192x192",
                        "type": "image/png"
                    },
                    {
                        "src": "pwa-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png"
                    },
                    {
                        "src": "maskable-icon-512x512.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "maskable"   
                    }
                ]
            },
            includeAssets: [
                'python.svg',
                'favicon.ico',
                'apple-touch-icon-180x180.png'
            ],
            workbox: {
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
                runtimeCaching: [
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|gif|bmp|webp|svg)$/i, // pattern match images
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 30, // cache for 30 days
                            },
                        },
                    },
                    {
                        urlPattern: ({ url }) => /pyodide/.test(url.hostname),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'pyodide-cache',
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 30, // cache for 30 days
                            },
                        },
                    },
                    {
                        urlPattern: ({ url }) => {
                            return /pyodide|monaco/.test(url.hostname);
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'assets-cache',
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 30, // cache for 30 days
                            },
                        },
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/'),
                        handler: 'NetworkFirst', // cache first for your application files
                        options: {
                            cacheName: 'app-shell-cache',
                        },
                    },
                ]
            }
        })
    ],
})