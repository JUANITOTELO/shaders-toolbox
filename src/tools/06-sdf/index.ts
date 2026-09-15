import { ShaderTool } from '../../types';

export const sdfTools: ShaderTool[] = [
  {
    id: 'sd-circle',
    section: '6. 2D Signed Distance Fields & Operators',
    name: 'Circle SDF',
    description: 'Exact Euclidean signed distance field to a circle boundary.',
    orderIndex: 23,
    difficulty: 'Intermediate',
    glsl: `float sdCircle(in vec2 p, in float r) {
  return length(p) - r;
}
float renderSDF(in float d) {
  float antiAliasUnits = fwidth(d);
  return 1.0 - smoothstep(-antiAliasUnits, antiAliasUnits, d);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float d = sdCircle(uv, 0.5);
  float mask = renderSDF(d);
  fragColor = vec4(vec3(mask), 1.0);
}`,
    challenge: {
      prompt: 'Render the signed distance isolines (concentric contour rings) using sin(d * 40.0) outside and inside the circle.',
      hint: 'float rings = sin(d * 40.0 - u_time * 5.0); vec3 col = vec3(0.5 + 0.5 * rings);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float d = sdCircle(uv, 0.5);
  float rings = sin(d * 50.0 - u_time * 4.0);
  vec3 col = (d > 0.0) ? vec3(0.2, 0.6, 1.0) : vec3(1.0, 0.4, 0.2);
  fragColor = vec4(col * (0.6 + 0.4 * rings), 1.0);
}`
    },
    markdownDoc: `# 2D Circle Signed Distance Field (SDF)

$$d(\\mathbf{p}) = \\|\\mathbf{p}\\| - r$$`
  },
  {
    id: 'sd-box',
    section: '6. 2D Signed Distance Fields & Operators',
    name: 'Axis-Aligned Box SDF',
    description: 'Exact exterior and interior signed distance to a box with half-bounds b.',
    orderIndex: 24,
    difficulty: 'Intermediate',
    glsl: `float sdBox(in vec2 p, in vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float renderSDF(in float d) {
  float antiAliasUnits = fwidth(d);
  return 1.0 - smoothstep(-antiAliasUnits, antiAliasUnits, d);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float d = sdBox(uv, vec2(0.6, 0.3));
  float mask = renderSDF(d);
  fragColor = vec4(vec3(mask) * vec3(0.3, 0.7, 1.0), 1.0);
}`,
    challenge: {
      prompt: 'Add corner rounding to the box by subtracting a roundness radius r from both half-extents b and the resulting distance d.',
      hint: 'float sdRoundedBox(vec2 p, vec2 b, float r) { return sdBox(p, b - r) - r; }',
      solution: `float sdBoxInternal(in vec2 p, in vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float r = 0.1;
  float d = sdBoxInternal(uv, vec2(0.6, 0.3) - r) - r;
  float mask = 1.0 - smoothstep(-fwidth(d), fwidth(d), d);
  fragColor = vec4(vec3(mask) * vec3(0.2, 0.8, 0.6), 1.0);
}`
    },
    markdownDoc: `# Axis-Aligned Box SDF

$$d(\\mathbf{p}) = \\|\\max(|\\mathbf{p}| - \\mathbf{b}, \\mathbf{0})\\| + \\min(\\max(|p_x| - b_x, |p_y| - b_y), 0.0)$$`
  },
  {
    id: 'sd-segment-triangle-ring',
    section: '6. 2D Signed Distance Fields & Operators',
    name: 'Segment, Triangle & Ring SDFs',
    description: 'Segment line distance, regular equilateral triangle, and stroke ring primitives.',
    orderIndex: 25,
    difficulty: 'Intermediate',
    glsl: `float sdSegment(in vec2 p, in vec2 a, in vec2 b) {
  vec2 pa = p - a; vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdEquilateralTriangle(in vec2 p, in float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
float sdRing(in vec2 p, in float r, in float strokeWidth) {
  return abs(length(p) - r) - strokeWidth * 0.5;
}
float renderSDF(in float d) {
  float antiAliasUnits = fwidth(d);
  return 1.0 - smoothstep(-antiAliasUnits, antiAliasUnits, d);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float d1 = sdEquilateralTriangle(uv - vec2(-0.5, 0.0), 0.35);
  float d2 = sdRing(uv - vec2(0.5, 0.0), 0.3, 0.08);
  float d = min(d1, d2);
  float mask = renderSDF(d);
  fragColor = vec4(vec3(mask) * vec3(1.0, 0.6, 0.2), 1.0);
}`,
    challenge: {
      prompt: 'Animate the segment endpoint b in a circular path using sin(u_time) and cos(u_time) to draw a rotating laser hand.',
      hint: 'vec2 b = vec2(cos(u_time), sin(u_time)) * 0.6;',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec2 b = vec2(cos(u_time * 2.0), sin(u_time * 2.0)) * 0.6;
  float d = sdSegment(uv, vec2(0.0), b) - 0.02;
  float mask = renderSDF(d);
  fragColor = vec4(vec3(mask) * vec3(0.1, 1.0, 0.5), 1.0);
}`
    },
    markdownDoc: `# Segment, Triangle & Ring SDFs`
  },
  {
    id: 'csg-boolean-smooth-ops',
    section: '6. 2D Signed Distance Fields & Operators',
    name: 'Constructive Solid Geometry (CSG) & Smooth Blends',
    description: 'Exact union, intersection, subtraction, and polynomial smooth blending operators.',
    orderIndex: 26,
    difficulty: 'Intermediate',
    glsl: `float opUnion(in float d1, in float d2) { return min(d1, d2); }
float opIntersection(in float d1, in float d2) { return max(d1, d2); }
float opSubtraction(in float d1, in float d2) { return max(-d1, d2); }
float opSmoothUnion(in float d1, in float d2, in float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}
float opSmoothSubtraction(in float d1, in float d2, in float k) {
  float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
  return mix(d2, -d1, h) + k * h * (1.0 - h);
}
float renderSDF(in float d) {
  float antiAliasUnits = fwidth(d);
  return 1.0 - smoothstep(-antiAliasUnits, antiAliasUnits, d);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float c1 = length(uv - vec2(-0.25 + 0.2 * sin(u_time), 0.0)) - 0.35;
  float c2 = length(uv - vec2(0.25 - 0.2 * sin(u_time), 0.0)) - 0.35;
  float d = opSmoothUnion(c1, c2, 0.25);
  float mask = renderSDF(d);
  fragColor = vec4(vec3(mask) * vec3(0.8, 0.2, 0.9), 1.0);
}`,
    challenge: {
      prompt: 'Use opSmoothSubtraction to create a metaball organic bite being eaten out of the primary circle.',
      hint: 'float d = opSmoothSubtraction(c1, c2, 0.15);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float c1 = length(uv - vec2(0.3 * sin(u_time), 0.0)) - 0.25;
  float c2 = length(uv) - 0.45;
  float d = opSmoothSubtraction(c1, c2, 0.1);
  float mask = renderSDF(d);
  fragColor = vec4(vec3(mask) * vec3(1.0, 0.4, 0.3), 1.0);
}`
    },
    markdownDoc: `# CSG & Smooth Polynomial Blending

$$h = \\text{clamp}\\left( 0.5 + 0.5 \\frac{d_2 - d_1}{k}, 0, 1 \\right)$$
$$\\text{smin}(d_1, d_2, k) = \\text{mix}(d_2, d_1, h) - k h (1 - h)$$`
  }
];
