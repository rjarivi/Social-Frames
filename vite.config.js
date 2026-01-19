import { defineConfig } from 'vite';

export default defineConfig({
    root: '.', // Serve from root
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
