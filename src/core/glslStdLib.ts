export const GLSL_STANDARD_LIBRARY = `
// =================================================================
// Modular Shader & Mathematical Graphics Toolbox - Standard Library
// GLSL ES 3.00 Production-Ready Library
// =================================================================

// --- 1. Coordinate Spaces & Aspect Correction ---
vec2 getUV(in vec2 fragCoord, in vec2 u_resolution) {
  return fragCoord.xy / u_resolution.xy;
}
vec2 getAspectCorrectedUV(in vec2 fragCoord, in vec2 u_resolution) {
  return (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
}
vec2 getTransformedUV(in vec2 fragCoord, in vec2 u_resolution, in vec2 pan, in float zoom) {
  vec2 uv = (2.0 * fragCoord - u_resolution.xy) / u_resolution.y;
  return (uv - pan) / zoom;
}

// --- 2. Geometric Transformations & Linear Algebra ---
mat2 rotate2D(in float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat2(c, -s, s, c);
}
vec2 skew2D(in vec2 p, in vec2 skewAmount) {
  return vec2(p.x + p.y * tan(skewAmount.x), p.y + p.x * tan(skewAmount.y));
}
mat3 rotateAxis(in vec3 axis, in float angle) {
  vec3 a = normalize(axis); float s = sin(angle); float c = cos(angle); float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c, oc * a.x * a.y - a.z * s, oc * a.z * a.x + a.y * s,
    oc * a.x * a.y + a.z * s, oc * a.y * a.y + c, oc * a.y * a.z - a.x * s,
    oc * a.z * a.x - a.y * s, oc * a.y * a.z + a.x * s, oc * a.z * a.z + c
  );
}
vec2 toPolar(in vec2 p) { return vec2(length(p), atan(p.y, p.x)); }
vec2 toCartesian(in vec2 polar) { return vec2(polar.x * cos(polar.y), polar.x * sin(polar.y)); }
vec2 complexLogMap(in vec2 p) { return vec2(log(length(p)), atan(p.y, p.x)); }
vec2 swirl(in vec2 p, in float strength, in float radius) {
  float dist = length(p);
  if (dist < radius) {
    float percent = (radius - dist) / radius;
    float theta = percent * percent * strength;
    return rotate2D(theta) * p;
  }
  return p;
}

// --- 3. Shaping Functions & Analytic Curves ---
float smoothStepHermite(in float edge0, in float edge1, in float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
float smootherstep(in float edge0, in float edge1, in float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}
float bias(in float b, in float x) { return x / ((1.0 / b - 2.0) * (1.0 - x) + 1.0); }
float gain(in float g, in float x) {
  if (x < 0.5) return bias(1.0 - g, 2.0 * x) * 0.5;
  return 1.0 - bias(1.0 - g, 2.0 - 2.0 * x) * 0.5;
}
float impulse(in float k, in float x) { float h = k * x; return h * exp(1.0 - h); }
float parabola(in float x, in float k) { return pow(4.0 * x * (1.0 - x), k); }

// --- 4. Procedural Coherent Noise & Field Generators ---
float hash11(in float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(in vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(in vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }

// --- 6. 2D Signed Distance Fields (SDFs) & Operators ---
float sdCircle(in vec2 p, in float r) { return length(p) - r; }
float sdBox(in vec2 p, in vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdSegment(in vec2 p, in vec2 a, in vec2 b) {
  vec2 pa = p - a; vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdRing(in vec2 p, in float r, in float strokeWidth) { return abs(length(p) - r) - strokeWidth * 0.5; }
float renderSDF(in float d) { float antiAliasUnits = fwidth(d); return 1.0 - smoothstep(-antiAliasUnits, antiAliasUnits, d); }
float opUnion(in float d1, in float d2) { return min(d1, d2); }
float opIntersection(in float d1, in float d2) { return max(d1, d2); }
float opSubtraction(in float d1, in float d2) { return max(-d1, d2); }
float opSmoothUnion(in float d1, in float d2, in float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

// --- 8. Color Science & Spectral Synthesis ---
vec3 cosinePalette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
  const float TAU = 6.28318530718;
  return a + b * cos(TAU * (c * t + d));
}
vec3 paletteTwilight(in float t) { return cosinePalette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67)); }
vec3 paletteThermal(in float t) { return cosinePalette(t, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)); }
vec3 hsv2rgb(in vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
`.trim();
