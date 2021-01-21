<script>
  import { vec2, mat4 } from 'gl-matrix';
  import { Noise } from 'noisejs';
  import { onMount, onDestroy } from 'svelte';
  import vertexShader from '../shaders/background.vert';
  import fragmentShader from '../shaders/background.frag';

  let canvas;
  let state;
  
  const QUAD_WIDTH = 20;
  const QUAD_HEIGHT = 30;

  const animate = (time) => {
    const {
      GL,
      count,
      grid,
      lightmap,
      noise,
      pointer,
    } = state;
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
    state.animationHandler = requestAnimationFrame(animate);
  };

  const reset = () => {
    const {
      GL,
      indices,
      light,
      position,
      projection,
      quad,
      scale,
      shader,
    } = state;

    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
    mat4.ortho(projection, 0, GL.drawingBufferWidth, 0, GL.drawingBufferHeight, 0, 1.0);
    GL.uniformMatrix4fv(GL.getUniformLocation(shader, 'transform'), false, projection);

    const w = QUAD_WIDTH * 0.5;
    const h = QUAD_HEIGHT * 0.5;
    const quadVertices = [
      [-w, -h],
      [w, -h],
      [w, h],
      [-w, h],
    ];
    const quadIndices = [
      0, 1, 2,
      2, 3, 0,
    ];
    const vertices = [];
    const quads = [];
    const index = [];
    const grid = [];
    for (
      let y = (canvas.height % QUAD_HEIGHT) * 0.5, offset = 0;
      y < canvas.height + QUAD_HEIGHT * 0.5;
      y += QUAD_HEIGHT
    ) {
      for (
        let x = (canvas.width % QUAD_WIDTH) * 0.5;
        x < canvas.width + QUAD_WIDTH * 0.5;
        x += QUAD_WIDTH, offset += 4
      ) {
        quadVertices.forEach((v) => {
          vertices.push(x + v[0], canvas.height - y + v[1]);
          quads.push(x, canvas.height - y);
        });
        // eslint-disable-next-line no-loop-func
        quadIndices.forEach((i) => index.push(offset + i));
        grid.push(vec2.fromValues(x, y));
      }
    }
    state.count = index.length;
    state.grid = grid;

    const positionLocation = GL.getAttribLocation(shader, 'position');
    GL.bindBuffer(GL.ARRAY_BUFFER, position);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
    GL.vertexAttribPointer(positionLocation, 2, GL.FLOAT, 0, 0, 0);
    GL.enableVertexAttribArray(positionLocation);
    const quadLocation = GL.getAttribLocation(shader, 'quad');
    GL.bindBuffer(GL.ARRAY_BUFFER, quad);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(quads), GL.STATIC_DRAW);
    GL.vertexAttribPointer(quadLocation, 2, GL.FLOAT, 0, 0, 0);
    GL.enableVertexAttribArray(quadLocation);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indices);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), GL.STATIC_DRAW);

    state.lightmap = new Float32Array(grid.length * 4);
    const lightLocation = GL.getAttribLocation(shader, 'light');
    GL.bindBuffer(GL.ARRAY_BUFFER, light);
    GL.bufferData(GL.ARRAY_BUFFER, state.lightmap, GL.STREAM_DRAW);
    GL.vertexAttribPointer(lightLocation, 1, GL.FLOAT, 0, 0, 0);
    GL.enableVertexAttribArray(lightLocation);
  };

  const onMouseMove = ({ clientX: x, clientY: y }) => {
    const { pointer, scale } = state;
    pointer[0] = x * scale;
    pointer[1] = canvas.height - (y * scale);
    pointer.needsUpdate = true;
  };

  onMount(() => {
    const hints = { alpha: false, antialias: false, preserveDrawingBuffer: false };
    const GL = canvas.getContext('webgl', hints) || canvas.getContext('experimental-webgl', hints);
    if (!GL) return;

    state = {
      GL,
      position: GL.createBuffer(),
      light: GL.createBuffer(),
      quad: GL.createBuffer(),
      indices: GL.createBuffer(),
      shader: GL.createProgram(),
      noise: new Noise(Math.random()),
      pointer: vec2.create(),
      projection: mat4.create(),
      scale: 0.6,
    };

    const vertex = GL.createShader(GL.VERTEX_SHADER);
    GL.shaderSource(vertex, vertexShader);
    GL.compileShader(vertex);
    const fragment = GL.createShader(GL.FRAGMENT_SHADER);
    GL.shaderSource(fragment, fragmentShader);
    GL.compileShader(fragment);
    GL.attachShader(state.shader, vertex);
    GL.attachShader(state.shader, fragment);
    GL.linkProgram(state.shader);
    GL.useProgram(state.shader);
    GL.uniform1f(GL.getUniformLocation(state.shader, 'pointerHalo'), 300 * state.scale);
    state.pointer.uniform = GL.getUniformLocation(state.shader, 'pointerPosition');

    reset();

    animate(0);
  });

  onDestroy(() => {
    cancelAnimationFrame(state.animationHandler);
  });
</script>

<svelte:window on:mousemove={onMouseMove} on:resize={reset} />
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
