// Subtle, static motion "liquid glass" background with Three.js + GLSL
// - No mouse interaction
// - Gentle procedural caustics & refraction highlights
// - Runs under your UI (canvas fixed behind)

let renderer, scene, camera, mesh, startTime = performance.now();

export async function initGlass(){
  const canvas = document.getElementById('glass-canvas');
  const { innerWidth: w, innerHeight: h, devicePixelRatio: dpr } = window;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(dpr, 2));
  renderer.setSize(w, h, false);

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Load shaders
  const [vertSrc, fragSrc] = await Promise.all([
    fetch('assets/shaders/glass.vert').then(r => r.text()),
    fetch('assets/shaders/glass.frag').then(r => r.text())
  ]);

  const uniforms = {
    u_time:       { value: 0.0 },
    u_resolution: { value: new THREE.Vector2(w, h) },
    u_pixelRatio: { value: Math.min(dpr, 2) },
    u_tint:       { value: new THREE.Vector3(0.82, 0.95, 1.0) }, // cold tint
    u_opacity:    { value: 0.16 } // overall alpha
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    uniforms,
    transparent: true
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Resize handling
  window.addEventListener('resize', () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    renderer.setSize(W, H, false);
    mesh.material.uniforms.u_resolution.value.set(W, H);
  });

  // Animate (subtle)
  const render = () => {
    const t = (performance.now() - startTime) / 1000;
    mesh.material.uniforms.u_time.value = t;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();
}
