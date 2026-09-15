import { ShaderTool } from '../../types';

export const shapingTools: ShaderTool[] = [
  {
    id: 'smoothstep-hermite',
    section: '3. Shaping Functions & Analytic Curves',
    name: 'Hermite Smoothstep',
    description: 'Cubic Hermite interpolation curve clamped to [0.0, 1.0].',
    orderIndex: 12,
    difficulty: 'Intermediate',
    glsl: `float smoothStepHermite(in float edge0, in float edge1, in float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float y = smoothStepHermite(0.2, 0.8, uv.x);
  float d = abs(uv.y - y);
  vec3 col = vec3(smoothstep(0.015, 0.0, d));
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Construct a symmetric bell curve by multiplying smoothStepHermite(0.0, 0.5, x) with 1.0 - smoothStepHermite(0.5, 1.0, x).',
      hint: 'float bell = smoothStepHermite(0.1, 0.5, uv.x) * (1.0 - smoothStepHermite(0.5, 0.9, uv.x));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float y = smoothStepHermite(0.1, 0.5, uv.x) * (1.0 - smoothStepHermite(0.5, 0.9, uv.x)) * 2.0;
  float d = abs(uv.y - y);
  vec3 col = vec3(smoothstep(0.015, 0.0, d)) * vec3(0.3, 0.9, 0.4);
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Cubic Hermite Smoothstep

$$S_1(t) = 3t^2 - 2t^3$$`
  },
  {
    id: 'perlin-smootherstep',
    section: '3. Shaping Functions & Analytic Curves',
    name: "Perlin's Quintic Smootherstep",
    description: 'Ken Perlin quintic S-curve with zero 1st and 2nd derivatives at endpoints.',
    orderIndex: 13,
    difficulty: 'Intermediate',
    glsl: `float smootherstep(in float edge0, in float edge1, in float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float y = smootherstep(0.1, 0.9, uv.x);
  float d = abs(uv.y - y);
  vec3 col = vec3(smoothstep(0.015, 0.0, d)) * vec3(0.3, 0.8, 1.0);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Plot the difference between cubic smoothstep and quintic smootherstep across the unit interval to visualize derivative smoothness.',
      hint: 'float diff = abs(smootherstep(0.0, 1.0, uv.x) - smoothstep(0.0, 1.0, uv.x));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float y1 = smootherstep(0.1, 0.9, uv.x);
  float y2 = smoothstep(0.1, 0.9, uv.x);
  float d1 = abs(uv.y - y1);
  float d2 = abs(uv.y - y2);
  vec3 col = vec3(smoothstep(0.01, 0.0, d1)) * vec3(0.2, 0.6, 1.0) +
             vec3(smoothstep(0.01, 0.0, d2)) * vec3(1.0, 0.3, 0.5);
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Ken Perlin's Quintic Smootherstep

$$S_2(t) = 6t^5 - 15t^4 + 10t^3$$`
  },
  {
    id: 'schlick-bias-gain',
    section: '3. Shaping Functions & Analytic Curves',
    name: 'Schlick Bias & Gain',
    description: 'Parametric contrast and bias controls for normalizing curve distributions.',
    orderIndex: 14,
    difficulty: 'Intermediate',
    glsl: `float bias(in float b, in float x) {
  return x / ((1.0 / b - 2.0) * (1.0 - x) + 1.0);
}
float gain(in float g, in float x) {
  if (x < 0.5) return bias(1.0 - g, 2.0 * x) * 0.5;
  return 1.0 - bias(1.0 - g, 2.0 - 2.0 * x) * 0.5;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float g = 0.5 + 0.45 * sin(u_time * 2.0);
  float y = gain(g, uv.x);
  float d = abs(uv.y - y);
  vec3 col = vec3(smoothstep(0.015, 0.0, d)) * vec3(1.0, 0.4, 0.7);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Use gain() on a grayscale gradient to dynamically compress or expand high dynamic range contrast.',
      hint: 'float contrast = gain(0.8, uv.x); output vec4(vec3(contrast), 1.0);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float g = 0.5 + 0.45 * sin(u_time);
  float col = gain(g, uv.x);
  fragColor = vec4(vec3(col), 1.0);
}`
    },
    markdownDoc: `# Schlick Rational Bias & Gain

$$\\text{bias}_b(t) = \\frac{t}{\\left(\\frac{1}{b} - 2\\right)(1 - t) + 1}$$`
  },
  {
    id: 'analytic-impulses',
    section: '3. Shaping Functions & Analytic Curves',
    name: 'Impulses & Attenuation Curves',
    description: 'Inigo Quilez impulse curves and symmetric parabola generators.',
    orderIndex: 15,
    difficulty: 'Intermediate',
    glsl: `float impulse(in float k, in float x) {
  float h = k * x;
  return h * exp(1.0 - h);
}
float parabola(in float x, in float k) {
  return pow(4.0 * x * (1.0 - x), k);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float y1 = impulse(6.0, uv.x);
  float y2 = parabola(uv.x, 2.0);
  float d1 = abs(uv.y - y1 * 0.5);
  float d2 = abs(uv.y - y2 * 0.5);
  vec3 col = vec3(smoothstep(0.015, 0.0, d1)) * vec3(0.2, 1.0, 0.4) +
             vec3(smoothstep(0.015, 0.0, d2)) * vec3(1.0, 0.8, 0.2);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Animate parameter k of impulse(k, x) from 2.0 to 12.0 using sin(u_time) to observe asymmetric attack peak translation.',
      hint: 'float k = 7.0 + 5.0 * sin(u_time * 2.0); float y = impulse(k, uv.x);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float k = 7.0 + 5.0 * sin(u_time * 2.0);
  float y = impulse(k, uv.x);
  float d = abs(uv.y - y);
  vec3 col = vec3(smoothstep(0.015, 0.0, d)) * vec3(1.0, 0.6, 0.2);
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Inigo Quilez Impulse Curve

$$f(x) = k x e^{1 - k x}$$`
  }
];
