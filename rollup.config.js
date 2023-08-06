import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import livereload from 'rollup-plugin-livereload';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import terser from '@rollup/plugin-terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const production = !process.env.ROLLUP_WATCH;
const outputPath = path.resolve(__dirname, 'dist');

const images = ({ src, dest }) => ({
  writeBundle() {
    const images = fs.readdirSync(src).filter((name) => ~name.indexOf('.png'));
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    return Promise.all(images.map((image) => Promise.all([
      sharp(path.join(src, image)).toFile(path.join(dest, image.replace('.png', '.webp'))),
      sharp(path.join(src, image)).toFile(path.join(dest, image)),
    ])));
  },
});

export default {
  input: path.join(__dirname, 'src', 'main.js'),
  output: {
    dir: outputPath,
    format: 'iife',
    sourcemap: !production,
  },
  plugins: [
    json(),
    nodeResolve({ browser: true }),
    svelte({ preprocess: sveltePreprocess({ sourceMap: !production }) }),
    postcss({ extract: true, minimize: production }),
    copy({
      targets: [
        { src: 'screenshot.png', dest: 'dist' },
        { src: 'src/index.html', dest: 'dist' },
        { src: 'src/fonts/*.ttf', dest: 'dist/fonts' },
      ],
    }),
    images({
      src: path.join(__dirname, 'projects'),
      dest: path.join(outputPath, 'projects'),
    }),
    ...(production ? (
      [terser()]
    ) : (
      [
        serve({ contentBase: outputPath, port: 8080 }),
        livereload(outputPath)
      ])
    ),
  ],
};
