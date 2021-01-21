precision mediump float;

attribute vec2 position;
attribute vec2 quad;
attribute float light;
varying vec4 fragColor;
uniform mat4 transform;
uniform float pointerHalo;
uniform vec2 pointerPosition;

void main(void) {
  float vertexLight = light;
  float distance = sqrt(
    pow(pointerPosition.x - quad.x, 2.0)
    + pow(pointerPosition.y - quad.y, 2.0)
  );
  if (distance <= pointerHalo) {
    float halo = ((pointerHalo - distance) / pointerHalo) * 0.25;
    vertexLight = clamp(vertexLight + (halo - (halo * 0.5)), 0.0, 1.0);
  }
  gl_Position = transform * vec4(position, 0.0, 1.0);
  fragColor = vec4(vec3(vertexLight), 1.0);
}
