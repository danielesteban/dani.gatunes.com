<script lang="ts">
  let animation: NodeJS.Timeout;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let image = $state<string>(null!);
  let pixels: ImageData;

  const size = 8;
  const scale = 2;
  const grid: number[][] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (
        Math.sqrt(
          ((y - (size * 0.5) + 0.5) ** 2)
          + ((x - (size * 0.5) + 0.5) ** 2)
        ) < size * 0.5
      ) {
        const pixel: number[] = [];
        for (let py = 0; py < scale; py += 1) {
          for (let px = 0; px < scale; px += 1) {
            pixel.push(
              (
                (((y * scale) + py) * (size * scale))
                + ((x * scale) + px)
              ) * 4
            );
          }
        }
        grid.push(pixel);
      }
    }
  }

  const step = (sample: number) => (
    Math.min(
      Math.max(
        pixels.data[sample] + Math.floor(Math.random() * 65) - 32,
        100
      ),
      228
    )
  );

  const animate = () => {
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
    animation = setTimeout(animate, 100);
  };

  $effect(() => {
    canvas.width = size * scale;
    canvas.height = size * scale;
    ctx = canvas.getContext('2d')!;
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
    animate();
    return () => {
      clearTimeout(animation);
    };
  });
</script>

<svelte:head>
  <link rel="icon" type="image/png" href={image}>
</svelte:head>
<canvas bind:this={canvas}></canvas>

<style>
  canvas {
    display: none;
  }
</style>
