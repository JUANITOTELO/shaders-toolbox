import { ShaderTool } from '../../types';

export const raymarchingTools: ShaderTool[] = [
  {
    id: 'pinhole-camera-raygen',
    section: '10. 3D Raymarching & Physical Shading (Hero)',
    name: '3D Pinhole Camera & LookAt Matrix',
    description: 'Constructing virtual camera rays in world space with ray origin (ro), ray direction (rd), and an orthonormal LookAt view basis.',
    orderIndex: 36,
    difficulty: 'Hero',
    glsl: `mat3 setCamera(in vec3 ro, in vec3 ta, in float cr) {
  vec3 cw = normalize(ta - ro); // Forward view vector
  vec3 cp = vec3(sin(cr), cos(cr), 0.0); // Up vector roll
  vec3 cu = normalize(cross(cw, cp)); // Right orthogonal vector
  vec3 cv = cross(cu, cw); // True up orthogonal vector
  return mat3(cu, cv, cw);
}

vec3 getRayDirection(in vec2 uv, in vec3 ro, in vec3 ta, in float fov) {
  mat3 cam = setCamera(ro, ta, 0.0);
  return normalize(cam * vec3(uv, fov));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(2.5 * sin(u_time * 0.5), 1.5, 2.5 * cos(u_time * 0.5));
  vec3 ta = vec3(0.0, 0.0, 0.0);
  vec3 rd = getRayDirection(uv, ro, ta, 1.5);
  // Visualize world ray directions mapped to color
  fragColor = vec4(0.5 + 0.5 * rd, 1.0);
}`,
    challenge: {
      prompt: 'Modify the camera roll angle cr in setCamera() to animate a Dutch angle tilt with sin(u_time).',
      hint: 'Pass sin(u_time) * 0.5 as the cr roll parameter in setCamera().',
      solution: `mat3 setCameraCustom(in vec3 ro, in vec3 ta, in float cr) {
  vec3 cw = normalize(ta - ro);
  vec3 cp = vec3(sin(cr), cos(cr), 0.0);
  vec3 cu = normalize(cross(cw, cp));
  vec3 cv = cross(cu, cw);
  return mat3(cu, cv, cw);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 ta = vec3(0.0);
  mat3 cam = setCameraCustom(ro, ta, sin(u_time));
  vec3 rd = normalize(cam * vec3(uv, 1.5));
  fragColor = vec4(0.5 + 0.5 * rd, 1.0);
}`
    },
    markdownDoc: `# 3D Pinhole Camera Model & Orthonormal LookAt Matrix

## 1. Mathematical Formulation & Orthonormal Basis
To render a 3D scene from an arbitrary viewpoint, we construct an orthonormal camera basis from camera origin $\\mathbf{ro} \\in \\mathbb{R}^3$ and look-at target $\\mathbf{ta} \\in \\mathbb{R}^3$:

1. **Forward view vector**:
   $$\\mathbf{c}_w = \\frac{\\mathbf{ta} - \\mathbf{ro}}{\\|\\mathbf{ta} - \\mathbf{ro}\\|}$$
2. **Right orthogonal vector**:
   $$\\mathbf{c}_u = \\frac{\\mathbf{c}_w \\times \\mathbf{up}}{\\|\\mathbf{c}_w \\times \\mathbf{up}\\|}$$
3. **True orthogonal up vector**:
   $$\\mathbf{c}_v = \\mathbf{c}_u \\times \\mathbf{c}_w$$

The rotation matrix $\\mathbf{M}_{\\text{cam}} = [\\mathbf{c}_u, \\mathbf{c}_v, \\mathbf{c}_w]$ transforms normalized camera screen coordinates $(u, v, f)$ into a world-space ray direction:

$$\\mathbf{rd} = \\frac{\\mathbf{M}_{\\text{cam}} \\begin{pmatrix} u \\\\ v \\\\ f \\end{pmatrix}}{\\|\\mathbf{M}_{\\text{cam}} (u, v, f)^T\\|}$$`
  },
  {
    id: 'sphere-tracing-3d',
    section: '10. 3D Raymarching & Physical Shading (Hero)',
    name: 'Sphere Tracing (Raymarching 3D SDF)',
    description: 'Iterative raymarching using sphere tracing: stepping along ray direction by exact SDF distances until intersection or horizon.',
    orderIndex: 37,
    difficulty: 'Hero',
    glsl: `float mapScene(in vec3 p) {
  // Sphere at origin with radius 1.0 combined with ground plane
  float sphere = length(p) - 1.0;
  float plane = p.y + 1.0;
  return min(sphere, plane);
}

float raymarch(in vec3 ro, in vec3 rd, in float maxDist) {
  float t = 0.0;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    float d = mapScene(p);
    if (d < 0.001) return t; // Hit surface
    t += d;                  // Step forward by guaranteed safe distance
    if (t > maxDist) break;
  }
  return -1.0; // Missed
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 1.0, 3.5);
  vec3 ta = vec3(0.0, 0.0, 0.0);
  vec3 cw = normalize(ta - ro);
  vec3 cu = normalize(cross(cw, vec3(0,1,0)));
  vec3 cv = cross(cu, cw);
  vec3 rd = normalize(mat3(cu, cv, cw) * vec3(uv, 1.5));
  
  float t = raymarch(ro, rd, 20.0);
  if (t > 0.0) {
    vec3 p = ro + rd * t;
    float depth = 1.0 - t / 15.0;
    fragColor = vec4(vec3(depth) * vec3(0.3, 0.7, 1.0), 1.0);
  } else {
    fragColor = vec4(0.05, 0.05, 0.08, 1.0);
  }
}`,
    challenge: {
      prompt: 'Add an animated pulsing torus or box to mapScene() using max(abs(p) - b, 0.0).',
      hint: 'Add a box SDF into mapScene() and combine with min().',
      solution: `float mapSceneCustom(in vec3 p) {
  vec3 d = abs(p) - vec3(0.7);
  float box = length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
  return min(box, p.y + 1.0);
}
float raymarchCustom(in vec3 ro, in vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < 80; i++) {
    float d = mapSceneCustom(ro + rd * t);
    if (d < 0.001) return t;
    t += d;
    if (t > 20.0) break;
  }
  return -1.0;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(2.5 * sin(u_time), 1.5, 2.5 * cos(u_time));
  vec3 cw = normalize(-ro);
  vec3 cu = normalize(cross(cw, vec3(0,1,0)));
  vec3 cv = cross(cu, cw);
  vec3 rd = normalize(mat3(cu, cv, cw) * vec3(uv, 1.5));
  float t = raymarchCustom(ro, rd);
  fragColor = (t > 0.0) ? vec4(vec3(1.0 - t / 10.0) * vec3(0.2, 0.9, 0.6), 1.0) : vec4(0.02, 0.02, 0.04, 1.0);
}`
    },
    markdownDoc: `# Sphere Tracing (Raymarching 3D SDFs) (John Hart, 1996)

## 1. Mathematical Theory
Traditional raytracing solves analytical ray-object intersection equations (e.g. quadratic equations for spheres).
**Sphere tracing** evaluates arbitrary procedural implicit surfaces $f(\\mathbf{p}) = 0$. Because $f(\\mathbf{p})$ represents the exact signed distance to the closest surface boundary, a sphere of radius $d = f(\\mathbf{p})$ centered at $\\mathbf{p}$ contains zero obstacles:

$$\\mathbf{p}_{k+1} = \\mathbf{p}_k + f(\\mathbf{p}_k) \\cdot \\mathbf{rd}$$

Guarantees convergence to within $\\epsilon$ ($10^{-3}$) without overstepping or clipping geometry.`
  },
  {
    id: 'raymarching-normals-shading',
    section: '10. 3D Raymarching & Physical Shading (Hero)',
    name: '3D SDF Surface Normal Gradient',
    description: 'Evaluating surface normal vectors in 3D using the tetrahedral finite difference gradient of the distance field.',
    orderIndex: 38,
    difficulty: 'Hero',
    glsl: `float mapScene(in vec3 p) {
  return length(p) - 1.0;
}

// Tetrahedral finite difference gradient (Inigo Quilez method: 4 evaluations instead of 6)
vec3 calcNormal(in vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0005;
  return normalize(
    e.xyy * mapScene(p + e.xyy) +
    e.yyx * mapScene(p + e.yyx) +
    e.yxy * mapScene(p + e.yxy) +
    e.xxx * mapScene(p + e.xxx)
  );
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.5));
  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    float d = mapScene(ro + rd * t);
    if (d < 0.001) break;
    t += d;
    if (t > 10.0) break;
  }
  if (t < 10.0) {
    vec3 p = ro + rd * t;
    vec3 N = calcNormal(p);
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(N, L), 0.0);
    fragColor = vec4(vec3(diff) * vec3(0.1, 0.6, 1.0) + 0.1, 1.0);
  } else {
    fragColor = vec4(0.02, 0.02, 0.04, 1.0);
  }
}`,
    challenge: {
      prompt: 'Add specular Blinn-Phong highlights using the halfway vector H = normalize(L + V) with specular power 64.',
      hint: 'vec3 V = -rd; vec3 H = normalize(L + V); float spec = pow(max(dot(N, H), 0.0), 64.0);',
      solution: `float mapSphere(in vec3 p) { return length(p) - 1.0; }
vec3 calcNormalSphere(in vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0005;
  return normalize(e.xyy * mapSphere(p + e.xyy) + e.yyx * mapSphere(p + e.yyx) + e.yxy * mapSphere(p + e.yxy) + e.xxx * mapSphere(p + e.xxx));
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.5));
  float t = 0.0;
  for (int i = 0; i < 60; i++) {
    float d = mapSphere(ro + rd * t);
    if (d < 0.001) break;
    t += d;
  }
  if (t < 5.0) {
    vec3 p = ro + rd * t;
    vec3 N = calcNormalSphere(p);
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));
    vec3 V = -rd;
    vec3 H = normalize(L + V);
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), 64.0);
    fragColor = vec4(vec3(diff * 0.8 + spec * 0.6) * vec3(0.2, 0.7, 1.0), 1.0);
  } else {
    fragColor = vec4(0.02, 0.02, 0.04, 1.0);
  }
}`
    },
    markdownDoc: `# 3D Surface Normal Gradient & Tetrahedral Stencil

## 1. Mathematical Formulation
The gradient of a signed distance field $\\nabla f(\\mathbf{p})$ is strictly orthogonal to the level set surface $f(\\mathbf{p}) = 0$:

$$\\mathbf{N} = \\frac{\\nabla f(\\mathbf{p})}{\\|\\nabla f(\\mathbf{p})\\|}$$

Using a regular tetrahedron vertices $(\\pm 1, \\pm 1, \\pm 1)$, only 4 scene evaluations are required instead of 6 in standard central differences, yielding a 33% speedup on GPU arithmetic units.`
  },
  {
    id: 'analytical-soft-shadows',
    section: '10. 3D Raymarching & Physical Shading (Hero)',
    name: 'Analytical Soft Shadows & Penumbra',
    description: 'Simulating spherical area light soft shadows and realistic penumbras by tracking ray-surface clearance along the shadow ray.',
    orderIndex: 39,
    difficulty: 'Hero',
    glsl: `float mapScene(in vec3 p) {
  float sphere = length(p - vec3(0.0, 0.5, 0.0)) - 0.7;
  float plane = p.y;
  return min(sphere, plane);
}

// Inigo Quilez penumbra soft shadow formula
float calcSoftshadow(in vec3 ro, in vec3 rd, in float mint, in float maxt, in float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 48; i++) {
    float h = mapScene(ro + rd * t);
    if (h < 0.001) return 0.0; // In shadow
    res = min(res, k * h / t); // Track closest beam clearance
    t += h;
    if (t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(2.0 * sin(u_time * 0.5), 1.8, 2.0 * cos(u_time * 0.5));
  vec3 ta = vec3(0.0, 0.3, 0.0);
  vec3 cw = normalize(ta - ro);
  vec3 cu = normalize(cross(cw, vec3(0,1,0)));
  vec3 cv = cross(cu, cw);
  vec3 rd = normalize(mat3(cu, cv, cw) * vec3(uv, 1.5));
  
  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    float d = mapScene(ro + rd * t);
    if (d < 0.001) break;
    t += d;
    if (t > 15.0) break;
  }
  
  if (t < 15.0) {
    vec3 p = ro + rd * t;
    const vec2 e = vec2(1.0, -1.0) * 0.0005;
    vec3 N = normalize(e.xyy*mapScene(p+e.xyy) + e.yyx*mapScene(p+e.yyx) + e.yxy*mapScene(p+e.yxy) + e.xxx*mapScene(p+e.xxx));
    vec3 L = normalize(vec3(1.5, 2.5, 1.0));
    float diff = max(dot(N, L), 0.0);
    float shadow = calcSoftshadow(p + N * 0.002, L, 0.02, 5.0, 16.0);
    vec3 col = vec3(0.2, 0.6, 1.0) * diff * shadow + vec3(0.05, 0.08, 0.12);
    fragColor = vec4(col, 1.0);
  } else {
    fragColor = vec4(0.04, 0.04, 0.06, 1.0);
  }
}`,
    challenge: {
      prompt: 'Tune hardness parameter k from 8.0 (diffuse soft shadow) to 64.0 (sharp sunlight shadow) to observe penumbra transitions.',
      hint: 'float shadow = calcSoftshadow(p + N * 0.002, L, 0.02, 5.0, 32.0);',
      solution: `float mapScenePenumbra(in vec3 p) {
  float sphere = length(p - vec3(0.0, 0.5, 0.0)) - 0.7;
  return min(sphere, p.y);
}
float calcSoftshadowCustom(in vec3 ro, in vec3 rd, in float k) {
  float res = 1.0; float t = 0.02;
  for (int i = 0; i < 48; i++) {
    float h = mapScenePenumbra(ro + rd * t);
    if (h < 0.001) return 0.0;
    res = min(res, k * h / t);
    t += h;
    if (t > 4.0) break;
  }
  return clamp(res, 0.0, 1.0);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 1.5, 3.0);
  vec3 rd = normalize(vec3(uv, -1.5));
  float t = 0.0;
  for (int i = 0; i < 60; i++) {
    float d = mapScenePenumbra(ro + rd * t);
    if (d < 0.001) break;
    t += d;
  }
  if (t < 10.0) {
    vec3 p = ro + rd * t;
    vec3 L = normalize(vec3(1.0, 2.0, 1.0));
    float s = calcSoftshadowCustom(p + vec3(0,0.01,0), L, 16.0);
    fragColor = vec4(vec3(s), 1.0);
  } else {
    fragColor = vec4(0.02, 0.02, 0.04, 1.0);
  }
}`
    },
    markdownDoc: `# Analytical Soft Shadows & Penumbra Raymarching

## 1. Mathematical Formulation & Geometric Penumbra
In physical optics, an area light source of radius $R$ casts a **penumbra** (partially occluded region) and an **umbra** (completely occluded region).
Rather than tracing hundreds of distributed stochastic shadow rays, distance fields permit exact penumbra approximation by calculating the minimum beam clearance angle along a single shadow ray:

$$S(\\mathbf{p}, \\mathbf{L}) = \\min_{t \\in [t_{\\min}, t_{\\max}]} \\left( \\frac{k \\cdot d(\\mathbf{p} + t\\mathbf{L})}{t} \\right)$$

- $d/t$ approximates $\\sin\\theta$, the angular clearance to the occluder.
- $k$ controls the apparent light source radius (penumbra softness).`
  },
  {
    id: 'ambient-occlusion-sdf',
    section: '10. 3D Raymarching & Physical Shading (Hero)',
    name: 'SDF Ambient Occlusion (AO)',
    description: 'Approximating diffuse ambient light occlusion in creases and crevices by sampling SDF distances along the surface normal.',
    orderIndex: 40,
    difficulty: 'Hero',
    glsl: `float mapScene(in vec3 p) {
  float sphere = length(p - vec3(0.0, 0.6, 0.0)) - 0.6;
  float plane = p.y;
  return min(sphere, plane);
}

// Ambient Occlusion: samples 5 points along normal and compares expected distance
float calcAO(in vec3 pos, in vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    float d = mapScene(pos + h * nor);
    occ += (h - d) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 2.5 * occ, 0.0, 1.0);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 1.2, 2.5);
  vec3 rd = normalize(vec3(uv.x, uv.y - 0.2, -1.5));
  
  float t = 0.0;
  for (int i = 0; i < 64; i++) {
    float d = mapScene(ro + rd * t);
    if (d < 0.001) break;
    t += d;
    if (t > 10.0) break;
  }
  
  if (t < 10.0) {
    vec3 p = ro + rd * t;
    const vec2 e = vec2(1.0, -1.0) * 0.0005;
    vec3 N = normalize(e.xyy*mapScene(p+e.xyy) + e.yyx*mapScene(p+e.yyx) + e.yxy*mapScene(p+e.yxy) + e.xxx*mapScene(p+e.xxx));
    float ao = calcAO(p, N);
    fragColor = vec4(vec3(ao) * vec3(0.9, 0.8, 0.7), 1.0);
  } else {
    fragColor = vec4(0.02, 0.02, 0.04, 1.0);
  }
}`,
    challenge: {
      prompt: 'Multiply ambient occlusion into both the ambient sky term and indirect diffuse term to give realism to contact shadows.',
      hint: 'vec3 ambient = vec3(0.2, 0.25, 0.3) * ao; vec3 diffuse = vec3(1.0, 0.9, 0.8) * diff * ao;',
      solution: `float mapSceneAOTest(in vec3 p) {
  return min(length(p - vec3(0.0, 0.5, 0.0)) - 0.5, p.y);
}
float calcAOCustom(in vec3 pos, in vec3 nor) {
  float occ = 0.0; float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    float d = mapSceneAOTest(pos + h * nor);
    occ += (h - d) * sca; sca *= 0.9;
  }
  return clamp(1.0 - 2.0 * occ, 0.0, 1.0);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 1.0, 2.5);
  vec3 rd = normalize(vec3(uv.x, uv.y - 0.1, -1.5));
  float t = 0.0;
  for (int i = 0; i < 60; i++) {
    float d = mapSceneAOTest(ro + rd * t);
    if (d < 0.001) break;
    t += d;
  }
  if (t < 8.0) {
    vec3 p = ro + rd * t;
    vec3 N = vec3(0,1,0);
    if (p.y > 0.01) N = normalize(p - vec3(0.0, 0.5, 0.0));
    float ao = calcAOCustom(p, N);
    fragColor = vec4(vec3(ao), 1.0);
  } else {
    fragColor = vec4(0.02, 0.02, 0.04, 1.0);
  }
}`
    },
    markdownDoc: `# SDF Ambient Occlusion (Alex Evans Method)

## 1. Mathematical Formulation
On a completely flat plane, sampling distance at offset $h$ along the surface normal $\\mathbf{N}$ yields $f(\\mathbf{p} + h\\mathbf{N}) = h$.
When nearby geometry occludes ambient sky radiance (e.g. a sphere resting on a plane), $f(\\mathbf{p} + h\\mathbf{N}) < h$. The missing distance $h - d$ directly quantifies geometric occlusion:

$$\\text{AO}(\\mathbf{p}, \\mathbf{N}) = 1.0 - k \\sum_{i=1}^M w_i \\left( h_i - f(\\mathbf{p} + h_i \\mathbf{N}) \\right)$$`
  },
  {
    id: 'aces-tonemapping-hero',
    section: '10. 3D Raymarching & Physical Shading (Hero)',
    name: 'ACES Film Tonemapping & Gamma 2.2',
    description: 'The Hero Finale: Converting unbounded HDR physical radiance into photographic film sRGB using the ACES curve and 2.2 gamma correction.',
    orderIndex: 41,
    difficulty: 'Hero',
    glsl: `// Narkowicz 2015 fitted ACES Film curve (Academy Color Encoding System)
vec3 acesFilm(in vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Linear sRGB to sRGB display gamma 2.2
vec3 linearToScreen(in vec3 col) {
  return pow(col, vec3(1.0 / 2.2));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  // High Dynamic Range (HDR) radiance gradient peaking at 10.0 (super-white sun)
  vec3 hdrColor = vec3(1.0, 0.6, 0.2) * (1.0 / (length(uv) * 0.5 + 0.05));
  
  // Split comparison: Left = Naive clamp; Right = Photographic ACES Tonemapping
  vec3 result = (uv.x < 0.0) ? clamp(hdrColor, 0.0, 1.0) : acesFilm(hdrColor * 0.4);
  
  // Apply final Gamma 2.2 correction
  fragColor = vec4(linearToScreen(result), 1.0);
}`,
    challenge: {
      prompt: 'Observe the sun burnout difference: left shows harsh color clamping artifacts; right preserves smooth filmic highlight rolloff.',
      hint: 'Compare clamping vs ACES curve on high dynamic range radiance.',
      solution: `vec3 acesFilmTest(in vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  vec3 hdr = vec3(1.5, 0.9, 0.3) / (length(uv) * 0.4 + 0.04);
  vec3 mapped = acesFilmTest(hdr * 0.3);
  fragColor = vec4(pow(mapped, vec3(1.0 / 2.2)), 1.0);
}`
    },
    markdownDoc: `# ACES Film Tonemapping & Photographic Color Grading

## 1. Linear vs. Gamma Pipeline & HDR Radiance
Physical light calculation operates in **Linear Space** where radiant flux is additive: doubling light doubles photon energy.
Standard computer monitors, however, apply a non-linear transfer function $V \\approx I^{2.2}$ (Cathode Ray Tube legacy and human eye Weber-Fechner perception).
If linear light is displayed directly without gamma decoding, shadows become unnaturally dark and highlights crush.

## 2. The ACES Filmic S-Curve
The Academy Color Encoding System (ACES) applies a sigmoidal film response:
- Gentle shadow toe (preserves low-light contrast).
- Linear midtone contrast.
- Smooth highlight shoulder rolloff (prevents harsh color blowout when $I > 1.0$).

$$f(x) = \\frac{x(a x + b)}{x(c x + d) + e}$$`
  }
];
