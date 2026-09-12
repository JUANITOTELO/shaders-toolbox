import { ShaderTool } from '../../types';

export const noiseTools: ShaderTool[] = [
  {
    id: 'dimensionless-hashes',
    section: '4. Procedural Coherent Noise & Field Generators',
    name: 'Dimensionless PRNG Hashes',
    description: 'Textureless, deterministic 1D, 2D, and gradient vector hashes without sinusoidal artifacts.',
    orderIndex: 19,
    difficulty: 'Advanced',
    glsl: `float hash11(in float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 20.0;
  float h = hash21(floor(uv) + floor(u_time * 2.0));
  fragColor = vec4(vec3(h), 1.0);
}`,
    challenge: {
      prompt: 'Use hash22 to generate random star point offsets inside a tiled grid.',
      hint: 'vec2 o = hash22(floor(uv)); float star = smoothstep(0.05, 0.0, length(fract(uv) - o));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 15.0;
  vec2 id = floor(uv);
  vec2 f = fract(uv);
  vec2 offset = hash22(id);
  float star = smoothstep(0.08, 0.0, length(f - offset));
  fragColor = vec4(vec3(star), 1.0);
}`
    },
    markdownDoc: `# Dimensionless PRNG Hashes

$$h(p) = \\text{frac}\\left( p \\cdot (p + C_1) \\right)$$`
  },
  {
    id: 'value-noise',
    section: '4. Procedural Coherent Noise & Field Generators',
    name: 'Bilinear Value Noise',
    description: 'Lattice value noise interpolated via Ken Perlin quintic polynomial.',
    orderIndex: 20,
    difficulty: 'Advanced',
    glsl: `float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float valueNoise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i + vec2(0.0, 0.0));
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 6.0;
  float n = valueNoise(uv + u_time * 0.5);
  fragColor = vec4(vec3(n), 1.0);
}`,
    challenge: {
      prompt: 'Layer two frequencies of value noise: one low frequency at 4.0 and one high frequency at 16.0 with half amplitude.',
      hint: 'float n = valueNoise(uv * 4.0) * 0.7 + valueNoise(uv * 16.0) * 0.3;',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float n = valueNoise(uv * 4.0 + u_time * 0.2) * 0.7 + valueNoise(uv * 16.0 - u_time * 0.4) * 0.3;
  fragColor = vec4(vec3(n), 1.0);
}`
    },
    markdownDoc: `# 2D Bilinear Value Noise`
  },
  {
    id: 'perlin-noise',
    section: '4. Procedural Coherent Noise & Field Generators',
    name: 'Classic 2D Gradient Noise (Perlin)',
    description: 'Gradient dot-product noise computed on lattice points for isotropic texture generation.',
    orderIndex: 21,
    difficulty: 'Advanced',
    glsl: `float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 getGradient(in vec2 i) {
  float a = hash21(i) * 6.28318530718;
  return vec2(cos(a), sin(a));
}
float perlinNoise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 g00 = getGradient(i + vec2(0.0, 0.0));
  vec2 g10 = getGradient(i + vec2(1.0, 0.0));
  vec2 g01 = getGradient(i + vec2(0.0, 1.0));
  vec2 g11 = getGradient(i + vec2(1.0, 1.0));
  float d00 = dot(g00, f - vec2(0.0, 0.0));
  float d10 = dot(g10, f - vec2(1.0, 0.0));
  float d01 = dot(g01, f - vec2(0.0, 1.0));
  float d11 = dot(g11, f - vec2(1.0, 1.0));
  return mix(mix(d00, d10, u.x), mix(d01, d11, u.x), u.y) + 0.5;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 6.0;
  float p = perlinNoise(uv + u_time * 0.4);
  fragColor = vec4(vec3(p), 1.0);
}`,
    challenge: {
      prompt: 'Turn perlin noise into marble veins using abs(sin(uv.x * 10.0 + perlinNoise(uv * 4.0) * 6.0)).',
      hint: 'float marble = abs(sin(uv.x * 8.0 + p * 6.0));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float p = perlinNoise(uv * 6.0);
  float marble = abs(sin(uv.x * 10.0 + p * 8.0));
  fragColor = vec4(vec3(marble), 1.0);
}`
    },
    markdownDoc: `# Classic 2D Gradient Noise (Ken Perlin)`
  },
  {
    id: 'simplex-noise',
    section: '4. Procedural Coherent Noise & Field Generators',
    name: '2D Simplex Noise',
    description: 'Evaluated on a skewed triangular grid to eliminate directional axis bias and artifacts.',
    orderIndex: 22,
    difficulty: 'Advanced',
    glsl: `vec3 permute(in vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}
float simplexNoise(in vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g) * 0.5 + 0.5;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 5.0;
  float s = simplexNoise(uv + u_time * 0.3);
  fragColor = vec4(vec3(s), 1.0);
}`,
    challenge: {
      prompt: 'Animate a dynamic organic water caustics effect by evaluating two counter-drifting simplex noise fields.',
      hint: 'float caustics = pow(simplexNoise(uv + t) * simplexNoise(uv - t), 2.0);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 6.0;
  float s1 = simplexNoise(uv + u_time * 0.3);
  float s2 = simplexNoise(uv - u_time * 0.2);
  float caustics = pow(s1 * s2 * 1.5, 3.0);
  fragColor = vec4(vec3(caustics) * vec3(0.2, 0.7, 1.0), 1.0);
}`
    },
    markdownDoc: `# 2D Simplex Noise`
  },
  {
    id: 'cellular-worley-noise',
    section: '4. Procedural Coherent Noise & Field Generators',
    name: 'Cellular / Worley Noise (F1 & F2)',
    description: 'Computes Euclidean distance to the closest (F1) and second-closest (F2) Poisson feature points.',
    orderIndex: 23,
    difficulty: 'Advanced',
    glsl: `vec2 hash22(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
vec2 cellularNoise(in vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash22(n + g);
      vec2 delta = g + o - f;
      float d = dot(delta, delta);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return vec2(sqrt(f1), sqrt(f2));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 6.0;
  vec2 f = cellularNoise(uv + u_time * 0.2);
  float border = f.y - f.x;
  fragColor = vec4(vec3(border), 1.0);
}`,
    challenge: {
      prompt: 'Render bioluminescent stained glass cells using F1 distance for the center and F2-F1 for dark leaded borders.',
      hint: 'float cell = 1.0 - f.x; float border = smoothstep(0.0, 0.1, f.y - f.x);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy * 5.0;
  vec2 f = cellularNoise(uv);
  float border = smoothstep(0.02, 0.1, f.y - f.x);
  vec3 col = vec3(1.0 - f.x) * vec3(0.2, 0.8, 0.6) * border;
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Cellular / Worley Voronoi Noise`
  }
];
