<script lang="ts">
  // @ts-ignore
  import FastNoise from 'fastnoise-lite';
  import { vec2, mat4 } from 'gl-matrix';
  import { type MouseEventHandler } from 'svelte/elements';

  let animation: number;
  let attributes: {
    light: GLint,
    pixel: GLint,
    position: GLint,
  };
  let buffers: {
    indices: WebGLBuffer,
    light: WebGLBuffer,
    pixel: WebGLBuffer,
    position: WebGLBuffer,
  };
  let canvas: HTMLCanvasElement;
  let data: {
    count: GLint,
    grid: vec2[],
    lightmap: Float32Array,
  };
  let GL: WebGLRenderingContext;
  let program: WebGLProgram;
  let uniforms: {
    pointer: WebGLUniformLocation,
    transform: WebGLUniformLocation,
  };

  const noise: { GetNoise: (x: number, y: number, z: number) => number } = new FastNoise(Math.random());
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
      float distance = length(pointerPosition - pixel);
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

  const animate = (time: number) => {
    const { count, grid, lightmap } = data;
    grid.forEach(([x, y], i) => {
      const light = 0.15 + noise.GetNoise(x, y, time * 0.03) * 0.05;
      lightmap.set([light, light, light, light], i * 4);
    });
    GL.bufferSubData(GL.ARRAY_BUFFER, 0, lightmap);
    GL.uniform2fv(uniforms.pointer, pointer);
    GL.drawElements(GL.TRIANGLES, count, GL.UNSIGNED_SHORT, 0);
    animation = requestAnimationFrame(animate);
  };

  const onMouseMove: MouseEventHandler<Window> = ({ clientX: x, clientY: y }) => {
    pointer[0] = x * scale;
    pointer[1] = canvas.height - (y * scale);
  };

  const onResize = () => {
    if (!GL) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    GL.viewport(0, 0, GL.drawingBufferWidth, GL.drawingBufferHeight);
    mat4.ortho(projection, 0, GL.drawingBufferWidth, 0, GL.drawingBufferHeight, 0, 1.0);
    GL.uniformMatrix4fv(uniforms.transform, false, projection);

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
    const vertices: number[] = [];
    const pixels: number[] = [];
    const index: number[] = [];
    const grid: vec2[] = [];
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
    data = {
      count: index.length,
      grid,
      lightmap: new Float32Array(grid.length * 4),
    };

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, buffers.indices);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), GL.STATIC_DRAW);

    GL.bindBuffer(GL.ARRAY_BUFFER, buffers.pixel);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(pixels), GL.STATIC_DRAW);
    GL.vertexAttribPointer(attributes.pixel, 2, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(attributes.pixel);
  
    GL.bindBuffer(GL.ARRAY_BUFFER, buffers.position);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);
    GL.vertexAttribPointer(attributes.position, 2, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(attributes.position);

    GL.bindBuffer(GL.ARRAY_BUFFER, buffers.light);
    GL.bufferData(GL.ARRAY_BUFFER, data.lightmap, GL.DYNAMIC_DRAW);
    GL.vertexAttribPointer(attributes.light, 1, GL.FLOAT, false, 0, 0);
    GL.enableVertexAttribArray(attributes.light);
  };

  $effect(() => {
    const hints = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    };
    GL = (
      canvas.getContext('webgl', hints)
      || canvas.getContext('experimental-webgl', hints)
    ) as WebGLRenderingContext;
    if (!GL) {
      return;
    }

    const vertex = GL.createShader(GL.VERTEX_SHADER)!;
    GL.shaderSource(vertex, vertexShader);
    GL.compileShader(vertex);
    const fragment = GL.createShader(GL.FRAGMENT_SHADER)!;
    GL.shaderSource(fragment, fragmentShader);
    GL.compileShader(fragment);

    program = GL.createProgram();
    GL.attachShader(program, vertex);
    GL.attachShader(program, fragment);
    GL.linkProgram(program);
    GL.useProgram(program);

    attributes = {
      light: GL.getAttribLocation(program, 'light'),
      pixel: GL.getAttribLocation(program, 'pixel'),
      position: GL.getAttribLocation(program, 'position'),
    };

    buffers = {
      indices: GL.createBuffer(),
      light: GL.createBuffer(),
      pixel: GL.createBuffer(),
      position: GL.createBuffer(),
    };

    uniforms = {
      pointer: GL.getUniformLocation(program, 'pointerPosition')!,
      transform: GL.getUniformLocation(program, 'transform')!,
    };

    GL.uniform1f(GL.getUniformLocation(program, 'pointerHalo'), 300 * scale);

    onResize();
    animate(0);
    return () => {
      cancelAnimationFrame(animation);
      if (GL) {
        const extension = GL.getExtension('WEBGL_lose_context');
        if (extension) {
          extension.loseContext();
        }
      }
    };
  });
</script>

<svelte:window
  onmousemove={onMouseMove}
  onresize={onResize}
/>
<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
  }
</style>
