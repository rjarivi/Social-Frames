import { defineConfig } from 'vite';

export default defineConfig({
    root: '.', // Serve from root
    base: '/Social-Frames/', // REQUIRED for GitHub Pages
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
                submit: 'submit.html',
                editor: 'editor.html'
            }
        }
    }
});
