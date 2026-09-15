import { ShaderTool } from '../../types';

export const warpingTools: ShaderTool[] = [
  {
    id: 'fbm-synthesis',
    section: '5. Domain Warping & Fractal Synthesis',
    name: 'Fractal Brownian Motion (fBM)',
    description: 'Superimposing octaves of noise with rotation, lacunarity, and persistence gain.',
    orderIndex: 21,
    difficulty: 'Hero',
    glsl: `float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float perlinNoise(in vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i); float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)); float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
mat2 rotate2D(in float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat2(c, s, -s, c);
}
float fbm(in vec2 p, in int octaves, in float lacunarity, in float gain) {
  float sum = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  mat2 rot = rotate2D(0.5);
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * perlinNoise(p * freq);
    p = rot * p;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
} `,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 3.0;
  float f = fbm(uv + u_time * 0.1, 5, 2.0, 0.5);
  fragColor = vec4(vec3(f * 0.5), 1.0);
}`,
    challenge: {
      prompt: 'Tune fbm octaves from 2 to 7 based on mouse X position to understand the performance cost vs detail tradeoff of spectral summation.',
      hint: 'int octaves = int(2.0 + 5.0 * (u_mouse.x / u_resolution.x));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 3.0;
  int octaves = int(2.0 + 5.0 * clamp(u_mouse.x / u_resolution.x, 0.0, 1.0));
  float f = fbm(uv + u_time * 0.1, octaves, 2.0, 0.5);
  fragColor = vec4(vec3(f * 0.5), 1.0);
}`
    },
    markdownDoc: `# Fractal Brownian Motion (fBM)

$$f_{\\text{fBM}}(\\mathbf{x}) = \\sum_{k=0}^{N-1} A^k n\\left( \\Lambda^k \\mathbf{R}^k \\mathbf{x} \\right)$$`
  },
  {
    id: 'domain-warp-multiscale',
    section: '5. Domain Warping & Fractal Synthesis',
    name: 'Multi-Scale Domain Warping',
    description: 'Feeds noise fields back into their own coordinate space to simulate organic fluid motion.',
    orderIndex: 22,
    difficulty: 'Hero',
    glsl: `float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float perlinNoise(in vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i); float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)); float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
mat2 rotate2D(in float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat2(c, s, -s, c);
}
float fbm(in vec2 p) {
  float sum = 0.0; float amp = 1.0; float freq = 1.0;
  mat2 rot = rotate2D(0.5);
  for (int i = 0; i < 5; i++) {
    sum += amp * perlinNoise(p * freq);
    p = rot * p; freq *= 2.0; amp *= 0.5;
  }
  return sum;
}
float domainWarp(in vec2 p, out vec2 q, out vec2 r, in float time) {
  q = vec2(
    fbm(p + vec2(0.0, 0.0) + 0.05 * time),
    fbm(p + vec2(5.2, 1.3) + 0.07 * time)
  );
  r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * time),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * time)
  );
  return fbm(p + 4.0 * r);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 1.5;
  vec2 q, r;
  float f = domainWarp(uv, q, r, u_time);
  vec3 col = mix(vec3(0.1, 0.2, 0.5), vec3(0.9, 0.4, 0.1), f * 0.5);
  col = mix(col, vec3(0.2, 0.8, 0.6), dot(q, q) * 0.3);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Inject cosine color palette coloring driven by the secondary feedback vector r to create realistic atmospheric Jupiter storm clouds.',
      hint: 'vec3 col = cosinePalette(length(r), vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 1.5;
  vec2 q, r;
  float f = domainWarp(uv, q, r, u_time);
  vec3 col = 0.5 + 0.5 * cos(6.28318 * (vec3(1.0) * length(r) + vec3(0.0, 0.33, 0.67)));
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Multi-Scale Domain Warping

$$\\mathbf{p}' = \\mathbf{p} + \\alpha \\mathbf{f}_{\\text{fBM}}(\\mathbf{p} + \\beta \\mathbf{f}_{\\text{fBM}}(\\mathbf{p}))$$`
  }
];
