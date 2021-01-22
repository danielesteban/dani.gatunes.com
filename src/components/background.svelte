<script>
  import { vec2, mat4 } from 'gl-matrix';
  import { Noise } from 'noisejs';
  import { onMount, onDestroy } from 'svelte';

  let animation;
  let buffers;
  let canvas;
  let GL;
  let program;

  const noise = new Noise(Math.random());
  const pixelWidth = 20;
  const pixelHeight = 30;
  const pointer = vec2.create();
  const projection = mat4.create();
  const scale = 0.6;
  
  const vertexShader = `
    precision mediump float;

    attribute float light;
    attribute vec2 pixel;
    attribute vec2 position;
    varying vec4 fragColor;
    uniform float pointerHalo;
    uniform vec2 pointerPosition;
    uniform mat4 transform;

    void main(void) {
      float vertexLight = light;
      float distance = sqrt(
        pow(pointerPosition.x - pixel.x, 2.0)
        + pow(pointerPosition.y - pixel.y, 2.0)
      );
      if (distance <= pointerHalo) {
        float halo = ((pointerHalo - distance) / pointerHalo) * 0.25;
        vertexLight = clamp(vertexLight + (halo - (halo * 0.5)), 0.0, 1.0);
      }
      gl_Position = transform * vec4(position, 0.0, 1.0);
      fragColor = vec4(vec3(vertexLight), 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;

    varying vec4 fragColor;

    void main(void) {
      gl_FragColor = fragColor;
    }
  `;

  const animate = (time) => {
    const { count, grid, lightmap } = buffers;
    grid.forEach(([x, y], i) => {
      const color = (
        (1 + noise.simplex3(x / 100, y / 100, time * 0.0003)) * 1.1 * 128
      ) / 1000;
      for (let v = 0; v < 4; v += 1) lightmap[(i * 4) + v] = color;
    });
    GL.bufferSubData(GL.ARRAY_BUFFER, 0, lightmap);
    if (pointer.needsUpdate) {
      GL.uniform2fv(pointer.uniform, pointer);
      pointer.needsUpdate = false;
    }
    GL.drawElements(GL.TRIANGLES, count, GL.UNSIGNED_SHORT, 0);
    animation = requestAnimationFrame(animate);
  };

  const onMouseMove = ({ clientX: x, clientY: y }) => {
    pointer[0] = x * scale;
    pointer[1] = canvas.height - (y * scale);
    pointer.needsUpdate = true;
  };

  const onResize = () => {
    const {
      indices,
      light,
      pixel,
      position,
    } = buffers;

    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
    mat4.ortho(projection, 0, GL.drawingBufferWidth, 0, GL.drawingBufferHeight, 0, 1.0);
    GL.uniformMatrix4fv(GL.getUniformLocation(program, 'transform'), false, projection);

    const w = pixelWidth * 0.5;
    const h = pixelHeight * 0.5;
    const pixelVertices = [
      [-w, -h],
      [w, -h],
      [w, h],
      [-w, h],
    ];
    const pixelIndices = [
      0, 1, 2,
      2, 3, 0,
    ];
    const vertices = [];
    const pixels = [];
    const index = [];
    const grid = [];
    for (
      let y = (canvas.height % pixelHeight) * 0.5, offset = 0;
      y < canvas.height + pixelHeight * 0.5;
      y += pixelHeight
    ) {
      for (
        let x = (canvas.width % pixelWidth) * 0.5;
        x < canvas.width + pixelWidth * 0.5;
        x += pixelWidth, offset += 4
      ) {
        pixelVertices.forEach((v) => {
          vertices.push(x + v[0], canvas.height - y + v[1]);
          pixels.push(x, canvas.height - y);
        });
        pixelIndices.forEach((i) => index.push(offset + i));
        grid.push(vec2.fromValues(x, y));
      }
    }
    buffers.count = index.length;
    buffers.grid = grid;

    const positionLocation = GL.getAttribLocation(program, 'position');
    GL.bindBuffer(GL.ARRAY_BUFFER, position);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
    GL.vertexAttribPointer(positionLocation, 2, GL.FLOAT, 0, 0, 0);
    GL.enableVertexAttribArray(positionLocation);
    const pixelLocation = GL.getAttribLocation(program, 'pixel');
    GL.bindBuffer(GL.ARRAY_BUFFER, pixel);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(pixels), GL.STATIC_DRAW);
    GL.vertexAttribPointer(pixelLocation, 2, GL.FLOAT, 0, 0, 0);
    GL.enableVertexAttribArray(pixelLocation);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indices);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), GL.STATIC_DRAW);

    buffers.lightmap = new Float32Array(grid.length * 4);
    const lightLocation = GL.getAttribLocation(program, 'light');
    GL.bindBuffer(GL.ARRAY_BUFFER, light);
    GL.bufferData(GL.ARRAY_BUFFER, buffers.lightmap, GL.STREAM_DRAW);
    GL.vertexAttribPointer(lightLocation, 1, GL.FLOAT, 0, 0, 0);
    GL.enableVertexAttribArray(lightLocation);
  };

  onMount(() => {
    const hints = { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
    GL = canvas.getContext('webgl', hints) || canvas.getContext('experimental-webgl', hints);
    if (!GL) return;

    buffers = {
      indices: GL.createBuffer(),
      light: GL.createBuffer(),
      pixel: GL.createBuffer(),
      position: GL.createBuffer(),
    };

    program = GL.createProgram();
    const vertex = GL.createShader(GL.VERTEX_SHADER);
    GL.shaderSource(vertex, vertexShader);
    GL.compileShader(vertex);
    const fragment = GL.createShader(GL.FRAGMENT_SHADER);
    GL.shaderSource(fragment, fragmentShader);
    GL.compileShader(fragment);
    GL.attachShader(program, vertex);
    GL.attachShader(program, fragment);
    GL.linkProgram(program);
    GL.useProgram(program);
    GL.uniform1f(GL.getUniformLocation(program, 'pointerHalo'), 300 * scale);
    pointer.uniform = GL.getUniformLocation(program, 'pointerPosition');

    onResize();
    animate(0);
  });

  onDestroy(() => {
    cancelAnimationFrame(animation);
    if (GL) {
      const extension = GL.getExtension('WEBGL_lose_context');
      if (extension) {
        extension.loseContext();
      }
    }
  });
</script>

<svelte:window
  on:mousemove={onMouseMove}
  on:resize={onResize}
/>
<canvas
  bind:this={canvas}
/>

<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }
</style>
