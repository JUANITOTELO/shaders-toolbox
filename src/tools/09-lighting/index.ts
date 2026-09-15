import { ShaderTool } from '../../types';

export const lightingTools: ShaderTool[] = [
  {
    id: 'blinn-phong-fresnel',
    section: '9. Analytical Lighting, Normals & Shading',
    name: 'Blinn-Phong & Schlick-Fresnel Illuminator',
    description: 'Physically plausible specular Blinn-Phong lighting combined with Schlick Fresnel reflectance.',
    orderIndex: 33,
    difficulty: 'Hero',
    glsl: `struct SurfaceMaterial {
  vec3 baseColor;
  float roughness;
  float specularPower;
  float f0;
};
vec3 evaluateBlinnPhong(
  in vec3 normal,
  in vec3 viewDir,
  in vec3 lightDir,
  in vec3 lightColor,
  in SurfaceMaterial mat
) {
  vec3 N = normalize(normal);
  vec3 V = normalize(viewDir);
  vec3 L = normalize(lightDir);
  vec3 H = normalize(L + V);
  float NdotL = max(dot(N, L), 0.0);
  vec3 diffuse = mat.baseColor * lightColor * NdotL;
  float NdotH = max(dot(N, H), 0.0);
  float specFactor = pow(NdotH, mat.specularPower);
  float VdotH = max(dot(V, H), 0.0);
  float fresnel = mat.f0 + (1.0 - mat.f0) * pow(1.0 - VdotH, 5.0);
  vec3 specular = lightColor * specFactor * fresnel;
  return diffuse + specular;
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float r = length(uv);
  if (r > 0.7) {
    fragColor = vec4(0.05, 0.05, 0.08, 1.0);
    return;
  }
  vec3 N = normalize(vec3(uv, sqrt(0.7 * 0.7 - r * r)));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(sin(u_time), cos(u_time), 1.0));
  SurfaceMaterial mat = SurfaceMaterial(vec3(0.1, 0.5, 0.9), 0.2, 32.0, 0.04);
  vec3 color = evaluateBlinnPhong(N, V, L, vec3(1.0), mat);
  fragColor = vec4(color, 1.0);
}`,
    challenge: {
      prompt: 'Change the dielectric material into gold metal by raising F0 to vec3(1.0, 0.78, 0.34) and tuning specular power to 128.',
      hint: 'Update mat.f0 to 0.9 and baseColor to gold.',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float r = length(uv);
  if (r > 0.7) {
    fragColor = vec4(0.05, 0.05, 0.08, 1.0);
    return;
  }
  vec3 N = normalize(vec3(uv, sqrt(0.7 * 0.7 - r * r)));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(sin(u_time), cos(u_time), 1.0));
  SurfaceMaterial gold = SurfaceMaterial(vec3(1.0, 0.76, 0.33), 0.1, 128.0, 0.9);
  vec3 color = evaluateBlinnPhong(N, V, L, vec3(1.0), gold);
  fragColor = vec4(color, 1.0);
}`
    },
    markdownDoc: `# Blinn-Phong & Schlick-Fresnel Illumination Model

$$\\mathbf{H} = \\frac{\\mathbf{L} + \\mathbf{V}}{\\|\\mathbf{L} + \\mathbf{V}\\|}$$
$$F(\\mathbf{V}, \\mathbf{H}) = F_0 + (1 - F_0)(1 - \\mathbf{V} \\cdot \\mathbf{H})^5$$`
  },
  {
    id: 'rim-and-subsurface',
    section: '9. Analytical Lighting, Normals & Shading',
    name: 'Screen-Space Rim & Subsurface Scattering',
    description: 'Silhouette rim lighting glow and thin subsurface scattering wrap lighting.',
    orderIndex: 34,
    difficulty: 'Hero',
    glsl: `float calculateRim(in vec3 normal, in vec3 viewDir, in float rimPower) {
  float f = 1.0 - max(dot(normalize(normal), normalize(viewDir)), 0.0);
  return pow(clamp(f, 0.0, 1.0), rimPower);
}
float wrapLighting(in vec3 normal, in vec3 lightDir, in float wrap) {
  float NdotL = dot(normalize(normal), normalize(lightDir));
  return clamp((NdotL + wrap) / (1.0 + wrap), 0.0, 1.0);
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float r = length(uv);
  if (r > 0.7) {
    fragColor = vec4(0.05, 0.05, 0.08, 1.0);
    return;
  }
  vec3 N = normalize(vec3(uv, sqrt(0.7 * 0.7 - r * r)));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(cos(u_time * 0.8), sin(u_time * 0.8), 0.5));
  float wrap = wrapLighting(N, L, 0.4);
  float rim = calculateRim(N, V, 3.0);
  vec3 col = vec3(0.1, 0.3, 0.6) * wrap + vec3(0.9, 0.5, 0.2) * rim;
  fragColor = vec4(col, 1.0);
}`,
    challenge: {
      prompt: 'Combine strong rim power (4.0) with warm jade green subsurface scattering to achieve a translucent mineral shader.',
      hint: 'vec3 jade = vec3(0.1, 0.8, 0.5) * wrap + vec3(0.8, 1.0, 0.9) * rim;',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  float r = length(uv);
  if (r > 0.7) { fragColor = vec4(0.02, 0.02, 0.04, 1.0); return; }
  vec3 N = normalize(vec3(uv, sqrt(0.49 - r * r)));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(sin(u_time), cos(u_time), 0.5));
  float wrap = wrapLighting(N, L, 0.5);
  float rim = calculateRim(N, V, 4.0);
  vec3 col = vec3(0.1, 0.7, 0.4) * wrap + vec3(0.8, 1.0, 0.7) * rim;
  fragColor = vec4(col, 1.0);
}`
    },
    markdownDoc: `# Rim Glow & Subsurface Scattering (Wrap Lighting)`
  },
  {
    id: 'reconstruct-normals',
    section: '9. Analytical Lighting, Normals & Shading',
    name: 'Finite Difference Normal Reconstruction',
    description: 'Reconstructs smooth surface normal vectors from any 2D procedural scalar heightfield.',
    orderIndex: 35,
    difficulty: 'Hero',
    glsl: `float hash21(in vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float perlin(in vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i); float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0)); float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float heightMap(in vec2 p) {
  return perlin(p * 4.0);
}
vec3 reconstructNormal(in vec2 p, in float eps, in float strength) {
  float hC = heightMap(p);
  float hR = heightMap(p + vec2(eps, 0.0));
  float hT = heightMap(p + vec2(0.0, eps));
  vec3 va = vec3(eps, 0.0, (hR - hC) * strength);
  vec3 vb = vec3(0.0, eps, (hT - hC) * strength);
  return normalize(cross(va, vb));
}`,
    defaultParams: {},
    previewMain: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 normal = reconstructNormal(uv + u_time * 0.05, 0.005, 1.5);
  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  float diff = max(dot(normal, lightDir), 0.0);
  fragColor = vec4(vec3(diff) * vec3(0.8, 0.6, 0.5) + 0.1, 1.0);
}`,
    challenge: {
      prompt: 'Add specular reflection to the reconstructed terrain normal using pow(max(dot(reflect(-lightDir, normal), vec3(0,0,1)), 0.0), 32.0).',
      hint: 'vec3 R = reflect(-lightDir, normal); float spec = pow(max(R.z, 0.0), 32.0);',
      solution: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 N = reconstructNormal(uv + u_time * 0.05, 0.005, 2.0);
  vec3 L = normalize(vec3(sin(u_time), cos(u_time), 1.0));
  float diff = max(dot(N, L), 0.0);
  vec3 R = reflect(-L, N);
  float spec = pow(max(R.z, 0.0), 32.0);
  fragColor = vec4(vec3(diff * 0.7 + spec * 0.5) * vec3(0.3, 0.7, 1.0), 1.0);
}`
    },
    markdownDoc: `# Finite Difference Normal Reconstruction

$$\\mathbf{N} = \\frac{\\mathbf{v}_a \\times \\mathbf{v}_b}{\\|\\mathbf{v}_a \\times \\mathbf{v}_b\\|}$$`
  }
];
