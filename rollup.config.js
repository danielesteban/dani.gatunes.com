import fs from 'fs';
import path from 'path';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-css-only';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';
import { string } from 'rollup-plugin-string';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

const cname = (domain) => ({
  writeBundle() {
    fs.writeFileSync(path.join(__dirname, 'dist', 'CNAME'), domain);
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
    commonjs(),
    copy({
      targets: [
        { src: 'screenshot.png', dest: 'dist' },
        { src: 'src/index.html', dest: 'dist' },
        { src: 'src/index.css', dest: 'dist' },
        { src: 'fonts/*.ttf', dest: 'dist/fonts' },
        { src: 'projects/*.png', dest: 'dist/projects' },
      ],
    }),
    string({
      include: ["**/*.frag","**/*.vert"],
    }),
    ...(production ? (
      [terser(), cname('dani.gatunes.com')]
    ) : (
      [serve({ contentBase: path.join(__dirname, 'dist'), port: 8080 }), livereload(path.join(__dirname, 'dist'))])
    ),
  ],
};
