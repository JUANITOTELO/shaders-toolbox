import { ShaderTool } from '../../types';

export const colorTools: ShaderTool[] = [
  {
    id: 'cosine-palettes',
    section: '8. Color Science & Spectral Synthesis',
    name: 'Inigo Quilez Cosine Palettes',
    description: 'Cyclic harmonic color palettes using 4-vector cosine formulation.',
    orderIndex: 25,
    difficulty: 'Advanced',
    glsl: `vec3 cosinePalette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
  const float TAU = 6.28318530718;
  return a + b * cos(TAU * (c * t + d));
}
vec3 paletteTwilight(in float t) {
  return cosinePalette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
}
vec3 paletteThermal(in float t) {
  return cosinePalette(t, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 col = (uv.y > 0.5) ? paletteTwilight(uv.x + u_time * 0.1) : paletteThermal(uv.x + u_time * 0.1);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Design a neon synthwave palette vector (pink to cyan to deep purple) using cosinePalette().',
      hint: 'a = vec3(0.5), b = vec3(0.5), c = vec3(1.0, 1.0, 1.0), d = vec3(0.3, 0.2, 0.8)',
      solution: `vec3 cosinePaletteInternal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 synth = cosinePaletteInternal(uv.x + u_time * 0.1, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.2, 0.8));
  fragColor = vec4(synth, 1.0);
}`
    },
    markdownDoc: `# Inigo Quilez Cosine Color Palettes

$$\\mathbf{C}(t) = \\mathbf{a} + \\mathbf{b} \\cos\\left( 2\\pi (\\mathbf{c} t + \\mathbf{d}) \\right)$$`
  },
  {
    id: 'hsv-to-rgb',
    section: '8. Color Science & Spectral Synthesis',
    name: 'HSV to Linear sRGB',
    description: 'Branchless hue, saturation, and value color conversion.',
    orderIndex: 26,
    difficulty: 'Advanced',
    glsl: `vec3 hsv2rgb(in vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 col = hsv2rgb(vec3(uv.x + u_time * 0.1, uv.y, 1.0));
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Create a continuous 2D color wheel by converting Cartesian coordinates to polar angle theta, mapped to hue in hsv2rgb.',
      hint: 'float angle = atan(p.y, p.x) / 6.28318 + 0.5; vec3 col = hsv2rgb(vec3(angle, length(p) * 2.0, 1.0));',
      solution: `vec3 hsv2rgbInternal(in vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float angle = atan(p.y, p.x) / 6.2831853 + 0.5;
  float radius = length(p);
  vec3 col = hsv2rgbInternal(vec3(angle, clamp(radius * 1.5, 0.0, 1.0), 1.0));
  fragColor = vec4(col * step(radius, 0.7), 1.0);
}`
    },
    markdownDoc: `# Branchless HSV to sRGB Conversion`
  },
  {
    id: 'oklab-color-space',
    section: '8. Color Science & Spectral Synthesis',
    name: 'Oklab Perceptually Uniform Space',
    description: 'Uniform lightness and chroma color mixing, eliminating muddy middle transitions and hue shifts.',
    orderIndex: 27,
    difficulty: 'Advanced',
    glsl: `vec3 rgbToOklab(in vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  float l_ = pow(l, 1.0 / 3.0);
  float m_ = pow(m, 1.0 / 3.0);
  float s_ = pow(s, 1.0 / 3.0);
  return vec3(
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  );
}
vec3 oklabToRgb(in vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  float l = l_ * l_ * l_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;
  return vec3(
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}
vec3 oklabMix(in vec3 colA, in vec3 colB, in float t) {
  vec3 labA = rgbToOklab(colA);
  vec3 labB = rgbToOklab(colB);
  return oklabToRgb(mix(labA, labB, t));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 blue = vec3(0.0, 0.2, 0.9);
  vec3 yellow = vec3(1.0, 0.9, 0.1);
  vec3 col = (uv.y > 0.5) ? mix(blue, yellow, uv.x) : oklabMix(blue, yellow, uv.x);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Compare cyan-to-magenta mixing between naive RGB and Oklab to observe chromatic vibrancy preservation.',
      hint: 'vec3 cyan = vec3(0.0, 1.0, 1.0); vec3 magenta = vec3(1.0, 0.0, 1.0);',
      solution: `vec3 oklabMixTest(in vec3 colA, in vec3 colB, in float t);
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 cyan = vec3(0.0, 1.0, 1.0);
  vec3 magenta = vec3(1.0, 0.0, 1.0);
  vec3 col = (uv.y > 0.5) ? mix(cyan, magenta, uv.x) : mix(cyan, magenta, uv.x);
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Oklab Perceptually Uniform Color Space`
  }
];
