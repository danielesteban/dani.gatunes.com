import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import sharp from 'sharp';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type UserConfig } from 'vite';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const images = ({ src, dest }: { src: string; dest: string }) => {
  const images = fs.readdirSync(src).filter((name) => ~name.indexOf('.png'));
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  return Promise.all(images.map((image) => Promise.all([
    sharp(path.join(src, image)).toFile(path.join(dest, image.replace('.png', '.webp'))),
    sharp(path.join(src, image)).toFile(path.join(dest, image)),
  ])));
};

export default defineConfig(async ({ mode }) => {
  await images({
    src: path.join(__dirname, 'projects'),
    dest: path.join(path.resolve(__dirname, 'public'), 'projects'),
  });
  const config: UserConfig = {
    build: {
      assetsDir: 'code',
      rolldownOptions: {
        output: {
          minify: mode === 'production' ? {
            compress: { dropConsole: true },
          } : {},
        },
      },
    },
    plugins: [
      svelte(),
    ],
    resolve: {
      alias: fs.readdirSync(path.join(__dirname, 'src'), { withFileTypes: true })
        .filter((f) => f.isDirectory())
        .map(({ name }) => (
          { find: name, replacement: path.join(__dirname, 'src', name) }
        )),
    },
    server: {
      port: 8080,
    },
  };
  return config;
});
