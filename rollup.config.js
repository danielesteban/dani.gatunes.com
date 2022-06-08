import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-css-only';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

const cname = (domain) => ({
  writeBundle() {
    fs.writeFileSync(path.join(__dirname, 'dist', 'CNAME'), domain);
  },
});

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
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: path.join(__dirname, 'dist', 'app.js'),
  },
  plugins: [
    svelte({
      dev: !production,
    }),
    css({ output: 'app.css' }),
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    json(),
    copy({
      targets: [
        { src: 'screenshot.png', dest: 'dist' },
        { src: 'src/index.html', dest: 'dist' },
        { src: 'src/fonts/*.ttf', dest: 'dist/fonts' },
      ],
    }),
    images({
      src: path.join(__dirname, 'projects'),
      dest: path.join(__dirname, 'dist', 'projects'),
    }),
    ...(production ? (
      [terser(), cname('dani.gatunes.com')]
    ) : (
      [serve({ contentBase: path.join(__dirname, 'dist'), port: 8080 }), livereload(path.join(__dirname, 'dist'))])
    ),
  ],
};
