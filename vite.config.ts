import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';


export default defineConfig({
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
                        "src": "/python.png",
                        "sizes": "512x512",
                        "type": "image/png"
                    }
                ]
            },
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