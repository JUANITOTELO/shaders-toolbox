import { ShaderTool } from '../../types';

export const tilingTools: ShaderTool[] = [
  {
    id: 'domain-repetition',
    section: '7. Procedural Tiling, Lattices & Symmetry',
    name: 'Domain Repetition (Infinite & Clamped)',
    description: 'Periodic domain modulus repetition and finite clamped lattice boundaries.',
    orderIndex: 27,
    difficulty: 'Advanced',
    glsl: `vec2 opRepetition(in vec2 p, in vec2 c) {
  return mod(p + 0.5 * c, c) - 0.5 * c;
}
vec2 opRepetitionLimited(in vec2 p, in float c, in vec2 limit) {
  return p - c * clamp(round(p / c), -limit, limit);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 3.0;
  vec2 p = opRepetition(uv, vec2(1.0));
  float d = length(p) - 0.3;
  float mask = 1.0 - smoothstep(0.0, 0.05, abs(d));
  fragColor = vec4(vec3(mask) * vec3(0.2, 0.9, 0.6), 1.0);
}`,
    challenge: {
      prompt: 'Use opRepetitionLimited with limit vec2(2.0, 1.0) so the repeating pattern stops outside a 5x3 finite matrix.',
      hint: 'vec2 p = opRepetitionLimited(uv, 1.0, vec2(2.0, 1.0));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 4.0;
  vec2 p = opRepetitionLimited(uv, 1.0, vec2(2.0, 1.0));
  float d = length(p) - 0.35;
  float mask = 1.0 - smoothstep(0.0, 0.02, d);
  fragColor = vec4(vec3(mask) * vec3(0.9, 0.5, 0.2), 1.0);
}`
    },
    markdownDoc: `# Domain Repetition & Periodic Lattices

$$\\mathbf{p}' = \\text{mod}(\\mathbf{p} + 0.5\\mathbf{c}, \\mathbf{c}) - 0.5\\mathbf{c}$$`
  },
  {
    id: 'hexagonal-grid-tiling',
    section: '7. Procedural Tiling, Lattices & Symmetry',
    name: 'Hexagonal Grid Tiling',
    description: 'Decomposes 2D space into discrete hexagonal cell indices and centered local coordinates.',
    orderIndex: 28,
    difficulty: 'Advanced',
    glsl: `struct HexGrid {
  vec2 id;
  vec2 uv;
};
HexGrid getHexGrid(in vec2 p) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  vec2 id = p - gv;
  return HexGrid(id, gv);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 4.0;
  HexGrid hg = getHexGrid(uv + u_time * 0.2);
  float d = length(hg.uv);
  float edge = smoothstep(0.48, 0.5, d);
  vec3 col = mix(vec3(0.1, 0.15, 0.25), vec3(0.9, 0.6, 0.1), edge);
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Color each hexagon uniquely using sin(dot(hg.id, vec2(12.3, 45.6))) to generate a cellular mosaic.',
      hint: 'vec3 hexColor = 0.5 + 0.5 * cos(vec3(0.0, 1.0, 2.0) + sin(dot(hg.id, vec2(7.1, 13.9))));',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 5.0;
  HexGrid hg = getHexGrid(uv);
  vec3 hexColor = 0.5 + 0.5 * cos(vec3(0.0, 1.0, 2.0) + dot(hg.id, vec2(3.14, 1.57)));
  float d = length(hg.uv);
  float border = smoothstep(0.45, 0.5, d);
  fragColor = vec4(mix(hexColor, vec3(0.0), border), 1.0);
}`
    },
    markdownDoc: `# Hexagonal Grid Tiling & Lattice Decomposition

$$\\mathbf{r} = (1.0, \\sqrt{3}) \\approx (1.0, 1.73205)$$`
  },
  {
    id: 'truchet-labyrinth',
    section: '7. Procedural Tiling, Lattices & Symmetry',
    name: 'Truchet Labyrinth Tiling',
    description: 'Multi-arc labyrinth procedural tiling with random diagonal lattice flipping.',
    orderIndex: 29,
    difficulty: 'Advanced',
    glsl: `float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 truchetTile(in vec2 p) {
  vec2 id = floor(p);
  vec2 f = fract(p);
  if (hash21(id) > 0.5) {
    f.x = 1.0 - f.x;
  }
  float d1 = length(f) - 0.5;
  float d2 = length(f - vec2(1.0)) - 0.5;
  return vec2(d1, d2);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 5.0 + u_time * 0.5;
  vec2 d = truchetTile(uv);
  float dist = min(abs(d.x), abs(d.y));
  float line = smoothstep(0.08, 0.02, dist);
  fragColor = vec4(vec3(line) * vec3(0.2, 0.7, 1.0), 1.0);
}`,
    challenge: {
      prompt: 'Add animated glowing pulses traversing through the Truchet tracks using sin(min(abs(d.x), abs(d.y)) * 20.0 - u_time * 6.0).',
      hint: 'Combine line mask with glowing pulse scalar.',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y * 5.0;
  vec2 d = truchetTile(uv);
  float dist = min(abs(d.x), abs(d.y));
  float line = smoothstep(0.06, 0.02, dist);
  float glow = exp(-dist * 15.0);
  fragColor = vec4(vec3(line + glow * 0.5) * vec3(0.3, 0.8, 1.0), 1.0);
}`
    },
    markdownDoc: `# Truchet Labyrinth Tiling`
  }
];
