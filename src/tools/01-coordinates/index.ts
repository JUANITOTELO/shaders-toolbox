import { ShaderTool } from '../../types';

export const coordinateTools: ShaderTool[] = [
  {
    id: 'get-uv',
    section: '1. Coordinate Spaces & Aspect Correction',
    name: 'Normalized UV',
    description: 'Normalized Device Coordinates (NDC) mapped to [0.0, 1.0].',
    orderIndex: 4,
    difficulty: 'Beginner',
    glsl: `vec2 getUV(in vec2 fragCoord, in vec2 u_resolution) {
  return fragCoord.xy / u_resolution.xy;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = getUV(fragCoord, u_resolution);
  fragColor = vec4(uv, 0.5 + 0.5 * sin(u_time), 1.0);
}`,
    challenge: {
      prompt: 'Multiply the UV coordinate by 2.0 and use fract() to create a 2x2 repeating grid of color gradients across the screen.',
      hint: 'vec2 gridUV = fract(uv * 2.0); then output vec4(gridUV, 0.0, 1.0);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = getUV(fragCoord, u_resolution);
  vec2 gridUV = fract(uv * 2.0);
  fragColor = vec4(gridUV, 0.5 + 0.5 * sin(u_time), 1.0);
}`
    },
    markdownDoc: `# Normalized UV Coordinates (NDC Mapping)

## 1. Mathematical Formulation & Theory
Fragment shaders receive raw screen coordinates in integer/half-integer pixels via \`gl_FragCoord.xy\`. We define a mapping from viewport pixel space $\\mathbf{P} \\in [0, W] \\times [0, H]$ to the normalized unit square $\\mathbf{U} \\in [0.0, 1.0]^2$:

$$\\mathbf{u}(x, y) = \\left( \\frac{x}{W}, \\frac{y}{H} \\right)$$

## 2. GLSL Code Implementation Breakdown
\`\`\`glsl
vec2 getUV(in vec2 fragCoord, in vec2 u_resolution) {
  return fragCoord.xy / u_resolution.xy;
}
\`\`\`
Component-wise division maps $(0,0)$ to the bottom-left and $(1,1)$ to the top-right.`
  },
  {
    id: 'aspect-corrected-uv',
    section: '1. Coordinate Spaces & Aspect Correction',
    name: 'Aspect-Corrected Centered UV',
    description: 'Origin (0,0) at viewport center, y in [-1.0, 1.0]. Prevents non-square pixel stretching.',
    orderIndex: 5,
    difficulty: 'Beginner',
    glsl: `vec2 getAspectCorrectedUV(in vec2 fragCoord, in vec2 u_resolution) {
  return (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = getAspectCorrectedUV(fragCoord, u_resolution);
  float d = length(uv);
  vec3 col = vec3(smoothstep(0.5, 0.49, d));
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Modify the smoothstep threshold and add an animated pulsing radius based on sin(u_time) so the centered circle pulses smoothly.',
      hint: 'float radius = 0.5 + 0.2 * sin(u_time * 3.0); then smoothstep(radius, radius - 0.01, d);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = getAspectCorrectedUV(fragCoord, u_resolution);
  float radius = 0.5 + 0.2 * sin(u_time * 3.0);
  float d = length(uv);
  vec3 col = vec3(smoothstep(radius, radius - 0.01, d));
  fragColor = vec4(col * vec3(0.3, 0.7, 1.0), 1.0);
}`
    },
    markdownDoc: `# Aspect-Corrected Centered UV Coordinates

## 1. Mathematical Formulation
$$\\mathbf{p}(x, y) = \\frac{2\\mathbf{x} - \\mathbf{R}}{H}$$

Normalizes strictly by viewport height $H$, guaranteeing an isotropic Euclidean metric.`
  },
  {
    id: 'transformed-uv',
    section: '1. Coordinate Spaces & Aspect Correction',
    name: 'Pan & Zoom Remapped UV',
    description: 'Screen-to-UV remapping with interactive pan offset and zoom scale factor.',
    orderIndex: 6,
    difficulty: 'Beginner',
    glsl: `vec2 getTransformedUV(in vec2 fragCoord, in vec2 u_resolution, in vec2 pan, in float zoom) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  return (uv - pan) / zoom;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 pan = vec2(sin(u_time * 0.8) * 0.3, cos(u_time * 0.8) * 0.2);
  float zoom = 1.0 + 0.5 * sin(u_time);
  vec2 uv = getTransformedUV(fragCoord, u_resolution, pan, zoom);
  vec3 col = vec3(step(0.0, sin(uv.x * 20.0)) * step(0.0, sin(uv.y * 20.0)));
  fragColor = vec4(col * vec3(0.3, 0.6, 1.0), 1.0);
}`,
    challenge: {
      prompt: 'Connect mouse coordinates from u_mouse.xy to the pan vector so you can click and pan the grid with your mouse cursor.',
      hint: 'vec2 mousePan = (2.0 * u_mouse.xy - u_resolution.xy) / u_resolution.y;',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 pan = (2.0 * u_mouse.xy - u_resolution.xy) / u_resolution.y;
  float zoom = 1.5;
  vec2 uv = getTransformedUV(fragCoord, u_resolution, pan, zoom);
  vec3 col = vec3(step(0.0, sin(uv.x * 20.0)) * step(0.0, sin(uv.y * 20.0)));
  fragColor = vec4(col * vec3(0.4, 0.8, 1.0), 1.0);
}`
    },
    markdownDoc: `# Pan & Zoom Remapped UV

$$\\mathbf{p}' = \\frac{\\mathbf{p} - \\mathbf{t}}{s}$$`
  }
];
