#ifdef GL_ES
precision highp float;
#endif

// Subtle Apple-like liquid glass look:
// - Soft caustic waves (fbm noise)
// - Gentle refraction highlights
// - Cold tint + low opacity
// - Static, slow motion

varying vec2 vUv;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_pixelRatio;
uniform vec3  u_tint;     // e.g., vec3(0.82, 0.95, 1.0)
uniform float u_opacity;  // overall alpha

// Hash & noise utils
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for(int i=0;i<5;i++){
    val += amp * noise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return val;
}

void main(){
  // Normalize UV to aspect
  vec2 uv = vUv;
  vec2 res = u_resolution;
  float aspect = res.x / max(res.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  // Slow drift
  float t = u_time * 0.05;

  // Caustic layers
  float n1 = fbm(uv * 2.5 + vec2(t, -t*0.7));
  float n2 = fbm(uv * 5.0 + vec2(-t*0.5, t*0.8));
  float caustics = smoothstep(0.35, 0.75, (n1*0.6 + n2*0.4));

  // Soft highlight using gradient of noise (approx by offset sample)
  vec2 eps = vec2(1.0 / res.x, 1.0 / res.y) * 2.0;
  float n_c = fbm(uv * 3.5 + vec2(t*0.6, t*0.4));
  float n_x = fbm((uv + vec2(eps.x, 0.0)) * 3.5 + vec2(t*0.6, t*0.4));
  float n_y = fbm((uv + vec2(0.0, eps.y)) * 3.5 + vec2(t*0.6, t*0.4));
  vec2 grad = vec2(n_x - n_c, n_y - n_c);
  float highlight = clamp(dot(normalize(vec3(-grad, 1.0)), vec3(0.2, -0.3, 0.93)), 0.0, 1.0);

  // Base tint + layering
  vec3 base = mix(vec3(0.85), u_tint, 0.35); // subtle cold tint
  vec3 color = base;

  // Add highlights & caustics (very gentle)
  color += 0.08 * highlight;
  color += 0.05 * caustics;

  // Subtle vignette to keep focus on center
  float vignette = smoothstep(0.95, 0.35, length(p));
  color *= mix(1.0, 0.92, vignette);

  gl_FragColor = vec4(color, u_opacity);
}
