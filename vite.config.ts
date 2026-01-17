import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

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
    ],
})