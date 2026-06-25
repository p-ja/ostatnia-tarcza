import { defineConfig } from 'vite';

export default defineConfig({
  // Ścieżki względne — gra działa też po wrzuceniu dist/ na dowolny statyczny hosting (GitHub Pages itp.)
  base: './',
  // Katalog z grafiką Kenneya serwujemy jako statyczny.
  // Pliki spod assets/ są dostępne pod URL-em "/<ścieżka-wewnątrz-assets>"
  // oraz kopiowane do dist/ podczas builda.
  publicDir: 'assets',
  server: {
    host: true, // dostęp z telefonu w tej samej sieci (npm run dev -- --host)
  },
});
