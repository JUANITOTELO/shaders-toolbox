import { ShaderTool } from '../../types';

export const transformationTools: ShaderTool[] = [
  {
    id: 'rotate-2d',
    section: '2. Geometric Transformations & Linear Algebra',
    name: '2D Rotation Matrix',
    description: 'Orthogonal 2D rotation matrix preserving Euclidean distance.',
    orderIndex: 4,
    difficulty: 'Intermediate',
    glsl: `mat2 rotate2D(in float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  uv = rotate2D(u_time) * uv;
  vec3 col = vec3(step(0.3, abs(uv.x)), step(0.3, abs(uv.y)), 0.6);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Apply a counter-rotating inner cross inside the outer rotating pattern by rotating uv with -u_time * 2.0.',
      hint: 'vec2 uv2 = rotate2D(-u_time * 2.0) * uv; and combine using min() or addition.',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec2 uv1 = rotate2D(u_time) * uv;
  vec2 uv2 = rotate2D(-u_time * 2.0) * uv;
  float c1 = step(0.2, abs(uv1.x)) * step(0.2, abs(uv1.y));
  float c2 = step(0.1, abs(uv2.x)) * step(0.1, abs(uv2.y));
  fragColor = vec4(vec3(c1, c2, 0.8), 1.0);
}`
    },
    markdownDoc: `# 2D Orthogonal Rotation Matrix

$$\\mathbf{R}(\\theta) = \\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix}$$`
  },
  {
    id: 'skew-2d',
    section: '2. Geometric Transformations & Linear Algebra',
    name: '2D Shear / Skew',
    description: 'Deforms coordinates by skewing axes by tangent angle amounts.',
    orderIndex: 5,
    difficulty: 'Intermediate',
    glsl: `vec2 skew2D(in vec2 p, in vec2 skewAmount) {
  return vec2(
    p.x + p.y * tan(skewAmount.x),
    p.y + p.x * tan(skewAmount.y)
  );
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec2 s = vec2(sin(u_time) * 0.5, cos(u_time * 0.7) * 0.3);
  uv = skew2D(uv, s);
  float d = length(max(abs(uv) - vec2(0.4), 0.0));
  fragColor = vec4(vec3(smoothstep(0.02, 0.0, d)), 1.0);
}`,
    challenge: {
      prompt: 'Combine skew2D with a periodic grid using sin(uv * 10.0) to observe isometric perspective skewing.',
      hint: 'Replace the box distance with sin(uv.x * 10.0) * sin(uv.y * 10.0).',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  uv = skew2D(uv, vec2(0.5, 0.2));
  float pattern = step(0.0, sin(uv.x * 12.0) * sin(uv.y * 12.0));
  fragColor = vec4(vec3(pattern), 1.0);
}`
    },
    markdownDoc: `# 2D Shear & Skew Deformation

$$\\mathbf{S} = \\begin{bmatrix} 1 & \\tan\\phi_x \\\\ \\tan\\phi_y & 1 \\end{bmatrix}$$`
  },
  {
    id: 'polar-conformal',
    section: '2. Geometric Transformations & Linear Algebra',
    name: 'Polar & Log-Spherical Map',
    description: 'Cartesian to polar conversion and complex logarithmic spiral conformal mapping.',
    orderIndex: 6,
    difficulty: 'Intermediate',
    glsl: `vec2 toPolar(in vec2 p) {
  return vec2(length(p), atan(p.y, p.x));
}
vec2 toCartesian(in vec2 polar) {
  return vec2(polar.x * cos(polar.y), polar.x * sin(polar.y));
}
vec2 complexLogMap(in vec2 p) {
  return vec2(log(length(p)), atan(p.y, p.x));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec2 logMap = complexLogMap(uv);
  float stripes = sin(10.0 * logMap.x + 5.0 * logMap.y - u_time * 3.0);
  fragColor = vec4(vec3(0.5 + 0.5 * stripes), 1.0);
}`,
    challenge: {
      prompt: 'Create an infinite spiral tunnel by animating logMap.x forward with u_time.',
      hint: 'float stripes = sin(8.0 * logMap.y - 12.0 * (logMap.x - u_time * 2.0));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec2 logMap = complexLogMap(uv);
  float tunnel = sin(8.0 * logMap.y + 16.0 * logMap.x - u_time * 5.0);
  fragColor = vec4(vec3(0.5 + 0.5 * tunnel) * vec3(0.2, 0.6, 1.0), 1.0);
}`
    },
    markdownDoc: `# Polar & Log-Spherical Conformal Mapping

$$w = \\ln(z) = \\ln(r) + i\\theta$$`
  },
  {
    id: 'swirl-vortex',
    section: '2. Geometric Transformations & Linear Algebra',
    name: 'Swirl Vortex Deformation',
    description: 'Non-linear spatial twist deformation falling off quadratically with radius.',
    orderIndex: 7,
    difficulty: 'Intermediate',
    glsl: `mat2 rotate2D(in float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat2(c, -s, s, c);
}
vec2 swirl(in vec2 p, in float strength, in float radius) {
  float dist = length(p);
  if (dist < radius) {
    float percent = (radius - dist) / radius;
    float theta = percent * percent * strength;
    return rotate2D(theta) * p;
  }
  return p;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  uv = swirl(uv, sin(u_time * 2.0) * 8.0, 1.0);
  float grid = step(0.1, abs(fract(uv.x * 5.0) - 0.5)) * step(0.1, abs(fract(uv.y * 5.0) - 0.5));
  fragColor = vec4(vec3(grid) * vec3(0.9, 0.4, 0.2), 1.0);
}`,
    challenge: {
      prompt: 'Increase swirl radius to 1.5 and animate the swirl strength continuously to create an interactive black hole distortion.',
      hint: 'uv = swirl(uv, u_time * 4.0, 1.5);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  uv = swirl(uv, u_time * 3.0, 1.5);
  float grid = step(0.05, abs(fract(uv.x * 6.0) - 0.5)) * step(0.05, abs(fract(uv.y * 6.0) - 0.5));
  fragColor = vec4(vec3(grid) * vec3(0.3, 0.8, 0.9), 1.0);
}`
    },
    markdownDoc: `# Swirl Vortex Deformation

$$\\theta(r) = \\left( \\frac{R - r}{R} \\right)^2 \\cdot k$$`
  },
  {
    id: 'rotate-axis-rodrigues',
    section: '2. Geometric Transformations & Linear Algebra',
    name: '3D Rodrigues Axis Rotation',
    description: 'Rotates 3D space around an arbitrary unit axis vector using Rodrigues formula.',
    orderIndex: 24,
    difficulty: 'Hero',
    glsl: `mat3 rotateAxis(in vec3 axis, in float angle) {
  vec3 a = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c,        oc * a.x * a.y - a.z * s, oc * a.z * a.x + a.y * s,
    oc * a.x * a.y + a.z * s, oc * a.y * a.y + c,        oc * a.y * a.z - a.x * s,
    oc * a.z * a.x - a.y * s, oc * a.y * a.z + a.x * s, oc * a.z * a.z + c
  );
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 p = vec3(uv, 1.0);
  p = rotateAxis(vec3(1.0, 1.0, 0.5), u_time) * p;
  fragColor = vec4(0.5 + 0.5 * p, 1.0);
}`,
    challenge: {
      prompt: 'Rotate space around the diagonal axis (1, 1, 1) and project a 3D unit cube wireframe onto the 2D screen.',
      hint: 'Rotate vec3(uv, z) around normalize(vec3(1.0, 1.0, 1.0)).',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 p = rotateAxis(vec3(1.0, 1.0, 1.0), u_time) * vec3(uv, 0.5);
  fragColor = vec4(abs(p), 1.0);
}`
    },
    markdownDoc: `# 3D Rodrigues' Rotation Matrix

$$\\mathbf{R}(\\mathbf{a}, \\theta) = \\cos\\theta \\mathbf{I} + (1 - \\cos\\theta)(\\mathbf{a} \\otimes \\mathbf{a}) + \\sin\\theta [\\mathbf{a}]_\\times$$`
  }
];
