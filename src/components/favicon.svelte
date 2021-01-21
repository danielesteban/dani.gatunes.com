<script>
  import { onMount, onDestroy } from 'svelte';

  let animationHandler;
  let canvas;
  let ctx;
  let image;
  let grid;
  let pixels;

  const animate = (time) => {
    const step = (sample) => (
      Math.min(
        Math.max(
          pixels.data[sample] + Math.floor(Math.random() * 65) - 32,
          100
        ),
        228
      )
    );
    grid.forEach((pixel) => {
      const r = step(pixel[0]);
      const g = step(pixel[0] + 1);
      const b = step(pixel[0] + 2);
      pixel.forEach((index) => {
        pixels.data[index] = r;
        pixels.data[index + 1] = g;
        pixels.data[index + 2] = b;
      });
    });
    ctx.putImageData(pixels, 0, 0);
    image = canvas.toDataURL('image/png');

    animationHandler = setTimeout(animate, 100);
  };

  onMount(() => {
    const size = 8;
    const scale = 2;
    const pixel = [];
    for (let y = 0; y < scale; y += 1) {
      for (let x = 0; x < scale; x += 1) {
        pixel.push({ x, y });
      }
    }
    grid = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (
          Math.sqrt(
            ((y - (size * 0.5) + 0.5) ** 2)
            + ((x - (size * 0.5) + 0.5) ** 2)
          ) < size * 0.5
        ) {
          grid.push(pixel.map(({ x: px, y: py }) => (
            (
              (((y * scale) + py) * (size * scale))
              + ((x * scale) + px)
            ) * 4
          )));
        }
      }
    }
    canvas.width = size * scale;
    canvas.height = size * scale;
    ctx = canvas.getContext('2d');
    pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    grid.forEach((pixel) => {
      const r = 100 + Math.floor(Math.random() * 129);
      const g = 100 + Math.floor(Math.random() * 129);
      const b = 100 + Math.floor(Math.random() * 129);
      pixel.forEach((index) => {
        pixels.data[index] = r;
        pixels.data[index + 1] = g;
        pixels.data[index + 2] = b;
        pixels.data[index + 3] = 0xFF;
      });
    });
    ctx.putImageData(pixels, 0, 0);
    image = canvas.toDataURL('image/png');
    animate(0);
  });

  onDestroy(() => {
    clearTimeout(animationHandler);
  });
</script>

<svelte:head>
  <link rel="icon" type="image/png" href={image}>
</svelte:head>
<canvas
  bind:this={canvas}
/>

<style>
  canvas {
    display: none;
  }
</style>
