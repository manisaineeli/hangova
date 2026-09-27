/* ============================================================
   Shared GLSL chunks — "Hangova" nature palette
   Twilight forest, still water, warm low sun.
   ============================================================ */

export const NOISE = /* glsl */ `
vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
        dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
        dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.55;
  mat2 m = mat2(1.62, 1.14, -1.14, 1.62);
  for (int i = 0; i < 5; i++) { v += a * snoise(p); p = m * p; a *= 0.5; }
  return v;
}
float fbm3(vec2 p){
  float v = 0.0, a = 0.6;
  mat2 m = mat2(1.62, 1.14, -1.14, 1.62);
  for (int i = 0; i < 3; i++) { v += a * snoise(p); p = m * p; a *= 0.5; }
  return v;
}
float ridge(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.72, 1.05, -1.05, 1.72);
  for (int i = 0; i < 5; i++){
    v += a * (1.0 - abs(snoise(p)));
    p = m * p; a *= 0.5;
  }
  return v;
}
`

export const PALETTE = /* glsl */ `
const vec3 C_FERN  = vec3(0.290, 0.871, 0.502);  // fern green
const vec3 C_MOSS  = vec3(0.204, 0.827, 0.600);  // deep moss
const vec3 C_WATER = vec3(0.133, 0.827, 0.933);  // lake teal
const vec3 C_SKY   = vec3(0.490, 0.827, 0.988);  // sky blue
const vec3 C_SUN   = vec3(0.984, 0.749, 0.141);  // warm sun
const vec3 C_CLAY  = vec3(0.851, 0.467, 0.341);  // terracotta earth
const vec3 C_LILAC = vec3(0.769, 0.710, 0.988);  // dusk lilac
`
