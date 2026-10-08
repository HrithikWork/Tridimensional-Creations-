import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          about: path.resolve(__dirname, 'about.html'),
          catalog: path.resolve(__dirname, 'catalog.html'),
          product: path.resolve(__dirname, 'product.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          blog: path.resolve(__dirname, 'blog.html'),
          article: path.resolve(__dirname, 'article.html'),
          gallery: path.resolve(__dirname, 'gallery.html'),
          galleryDecor: path.resolve(__dirname, 'gallery-decor.html'),
          galleryFurniture: path.resolve(__dirname, 'gallery-furniture.html'),
          galleryRetail: path.resolve(__dirname, 'gallery-retail.html'),
          galleryArt: path.resolve(__dirname, 'gallery-art.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
