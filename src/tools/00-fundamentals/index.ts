import { ShaderTool } from '../../types';

export const fundamentalTools: ShaderTool[] = [
  {
    id: 'simd-pipeline-intro',
    section: '0. The GPU Mental Model & Pipeline',
    name: 'The SIMD Parallel Mental Model',
    description: 'Understanding massively parallel GPU execution: millions of fragments computing concurrently with zero CPU-style loops.',
    orderIndex: 1,
    difficulty: 'Beginner',
    glsl: `// The simplest fragment shader in GLSL ES 3.00:
// Every pixel executes this identical code in parallel.
vec4 computeBaseColor(in vec2 fragCoord, in vec2 u_resolution) {
  // Pure static color vector (Red, Green, Blue, Alpha)
  return vec4(0.2, 0.6, 1.0, 1.0);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  fragColor = computeBaseColor(fragCoord, u_resolution);
}`,
    challenge: {
      prompt: 'Change the output color to a warm sunset orange (Red: 1.0, Green: 0.5, Blue: 0.1, Alpha: 1.0).',
      hint: 'Return vec4(1.0, 0.5, 0.1, 1.0); in computeBaseColor.',
      solution: `vec4 computeBaseColor(in vec2 fragCoord, in vec2 u_resolution) {
  return vec4(1.0, 0.5, 0.1, 1.0);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  fragColor = computeBaseColor(fragCoord, u_resolution);
}`
    },
    markdownDoc: `# The GPU Mental Model & The SIMD Execution Pipeline

## 1. Architectural Theory: The CPU vs. GPU Paradigm Shift
On a traditional CPU, drawing an image requires an explicit double loop:
\`\`\`cpp
for (int y = 0; y < height; y++) {
  for (int x = 0; x < width; x++) {
    setPixelColor(x, y, calculateColor(x, y));
  }
}
\`\`\`

On a GPU, **there is no loop**. A GPU is an ultra-wide parallel computing machine utilizing **SIMD (Single Instruction, Multiple Data)** and **SIMT (Single Instruction, Multiple Threads)** architectures:
- Millions of pixels run the exact same compiled fragment shader concurrently in warps (NVIDIA: 32 threads) or wavefronts (AMD: 64 threads).
- Each thread computes only for its single assigned pixel location, accessible via \`gl_FragCoord.xy\`.
- All threads execute in lockstep across hardware execution units.

## 2. GLSL Pipeline Breakdown & Memory Spaces
\`\`\`glsl
#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
\`\`\`
1. **Qualifiers**:
   - \`in\`: Read-only function parameter or interpolated attribute from vertex stages.
   - \`out\`: The final pixel color sent to the framebuffer (\`out vec4 fragColor\`).
   - \`uniform\`: Global constant across all parallel threads for the entire draw call (e.g. screen resolution, elapsed time, mouse input).
2. **Color Normalization**:
   - Unlike 8-bit integers ($0 - 255$), GPU color components are strictly normalized floating-point numbers in range $[0.0, 1.0]$.`
  },
  {
    id: 'vectors-and-swizzling',
    section: '0. The GPU Mental Model & Pipeline',
    name: 'Vector Math & Swizzling',
    description: 'Mastering vector constructors, component extraction, and SIMD swizzling (.xyzw, .rgba, .stpq).',
    orderIndex: 2,
    difficulty: 'Beginner',
    glsl: `vec3 demonstrateSwizzling(in vec2 uv) {
  vec3 base = vec3(uv.x, uv.y, 0.5);
  // Swizzling: reorder or duplicate components instantaneously in hardware
  vec3 reversed = base.zyx;
  return reversed;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 col = demonstrateSwizzling(uv);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Extract and invert the green channel using swizzling so green increases from top to bottom (1.0 - uv.y).',
      hint: 'vec3 col = vec3(uv.x, 1.0 - uv.y, 0.5);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 col = vec3(uv.x, 1.0 - uv.y, 0.8);
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Vector Math & Hardware Swizzling

## 1. Vector Types in GLSL
GLSL provides first-class vector types with hardware-level SIMD operations:
- \`vec2\`: $(x, y)$ or $(u, v)$
- \`vec3\`: $(x, y, z)$ or $(r, g, b)$
- \`vec4\`: $(x, y, z, w)$ or $(r, g, b, a)$

## 2. Swizzling Mechanics
Components can be accessed and reordered without memory copies:
- \`v.xy\`: Returns a \`vec2\` containing $x$ and $y$.
- \`v.bgr\`: Returns a \`vec3\` with red and blue channels swapped.
- \`v.xxxx\`: Broadcasts the $x$ component across a \`vec4\`.`
  },
  {
    id: 'branchless-programming',
    section: '0. The GPU Mental Model & Pipeline',
    name: 'Branchless Logic: step() & mix()',
    description: 'Eliminating GPU thread divergence: replacing slow if/else branches with hardware step() and mix() instructions.',
    orderIndex: 3,
    difficulty: 'Beginner',
    glsl: `vec3 branchlessSplit(in vec2 uv) {
  // Step function: step(edge, x) returns 0.0 if x < edge, 1.0 if x >= edge
  float mask = step(0.5, uv.x);
  
  vec3 leftColor = vec3(0.1, 0.2, 0.5);
  vec3 rightColor = vec3(0.9, 0.4, 0.1);
  
  // Linear interpolation: mix(x, y, a) = x * (1 - a) + y * a
  return mix(leftColor, rightColor, mask);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 col = branchlessSplit(uv);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Create a 3-stripe flag by using two step() thresholds (at 0.33 and 0.66) combined with mix().',
      hint: 'float m1 = step(0.33, uv.x); float m2 = step(0.66, uv.x);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  float m1 = step(0.33, uv.x);
  float m2 = step(0.66, uv.x);
  vec3 col = mix(vec3(0.9, 0.2, 0.2), vec3(0.9, 0.9, 0.2), m1);
  col = mix(col, vec3(0.2, 0.4, 0.9), m2);
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Branchless Programming & Thread Divergence

## 1. Why if/else Kills GPU Performance
GPUs execute instructions across groups of threads called **warps** (NVIDIA) or **wavefronts** (AMD).
When an \`if (condition)\` is evaluated:
- If all 32 threads in the warp take the same branch, execution proceeds at full speed.
- If some threads take the \`if\` branch while others take the \`else\` branch, **branch divergence** occurs: the GPU must serialize both branches, executing the \`if\` body while masking out the \`else\` threads, then executing the \`else\` body while masking out the \`if\` threads. Throughput drops by 50%!

## 2. Hardware Replacement Primitives
1. **\`step(edge, x)\`**:
   $$f(x) = \\begin{cases} 0.0 & x < \\text{edge} \\\\ 1.0 & x \\ge \\text{edge} \\end{cases}$$
2. **\`clamp(x, minVal, maxVal)\`**:
   $$\\min(\\max(x, \\text{minVal}), \\text{maxVal})$$
3. **\`mix(x, y, a)\`**:
   $$x \\cdot (1 - a) + y \\cdot a$$`
  }
];
