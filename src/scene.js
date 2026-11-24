import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export async function createScene(host, options = {}) {
  let disposed = false;
  let paused = Boolean(options.paused);
  let visible = true;
  let ready = false;
  let frame = 0;
  let previousTime = 0;
  let mixer;
  let model;
  let head;
  let headBase;
  let environment;
  const pointer = new THREE.Vector2();
  const smoothedPointer = new THREE.Vector2();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(15.5, 1, .1, 100);
  camera.position.set(0, 13.1, 24.7);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.7));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const ambient = new THREE.HemisphereLight(0xe9e1ff, 0x33263f, 1.4);
  const key = new THREE.DirectionalLight(0xfff4ec, 2.6);
  key.position.set(-5, 17, 12);
  const rim = new THREE.DirectionalLight(0xb59aff, 5);
  rim.position.set(5, 16, -5);
  const fill = new THREE.DirectionalLight(0x9c8dfc, 1.3);
  fill.position.set(-5, 9, 2);
  scene.add(ambient, key, rim, fill);
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  draco.setDecoderConfig({ type: 'js' });
  draco.setWorkerLimit(1);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 18000);

  function render() {
    if (!disposed) renderer.render(scene, camera);
  }
  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
  function tick(time) {
    frame = 0;
    if (disposed || paused || !visible || document.hidden || !ready) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    mixer?.update(delta);
    smoothedPointer.lerp(pointer, 1 - Math.exp(-delta * 5));
    if (head && headBase) {
      head.rotation.x = headBase.x + smoothedPointer.y * .12;
      head.rotation.y = headBase.y + smoothedPointer.x * .24;
    }
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  }
  function syncFrame() {
    if (disposed || !ready) return;
    if (paused || !visible || document.hidden) { stopFrame(); render(); }
    else if (!frame) { previousTime = 0; frame = requestAnimationFrame(tick); }
  }
  function resize() {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    // Preserve the character's framing instead of sharing a desktop-only breakpoint.
    camera.fov = width < 420 ? 16.5 : 15.5;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (ready) render();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    syncFrame();
  }, { rootMargin: '80px' });
  visibilityObserver.observe(host);
  const onVisibility = () => syncFrame();
  document.addEventListener('visibilitychange', onVisibility);
  function onPointer(event) {
    if (paused || event.pointerType === 'touch') return;
    const bounds = host.getBoundingClientRect();
    pointer.set(THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1), THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1));
  }
  function resetPointer() { pointer.set(0, 0); }
  const art = host.closest('.hero-art');
  art.addEventListener('pointermove', onPointer, { passive: true });
  art.addEventListener('pointerleave', resetPointer);
  function onContextLost(event) {
    event.preventDefault();
    ready = false;
    stopFrame();
    host.classList.remove('ready');
    document.querySelector('#scene-status').textContent = 'Lightweight view · all the same work';
  }
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);

  function setLight(name) {
    const colors = { violet: 0xb59aff, blue: 0x82c8fc, amber: 0xebbc7e };
    rim.color.setHex(colors[name] ?? colors.violet);
    fill.color.setHex(colors[name] ?? colors.violet);
    if (ready && paused) render();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    clearTimeout(timeout);
    stopFrame();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    art.removeEventListener('pointermove', onPointer);
    art.removeEventListener('pointerleave', resetPointer);
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    mixer?.stopAllAction();
    if (model) mixer?.uncacheRoot(model);
    const textures = new Set();
    const materials = new Set();
    const geometries = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      list.forEach(material => { materials.add(material); Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }); });
    });
    textures.forEach(texture => texture.dispose());
    materials.forEach(material => material.dispose());
    geometries.forEach(geometry => geometry.dispose());
    environment?.dispose();
    draco.dispose();
    scene.clear();
    renderer.dispose();
    renderer.domElement.remove();
    host.classList.remove('ready');
  }
  resize();
  setLight(options.light);
  try {
    const response = await fetch('/models/character.glb', { signal: abort.signal });
    if (!response.ok) throw new Error('Character asset unavailable');
    const bytes = await response.arrayBuffer();
    const gltf = await loader.parseAsync(bytes, '/models/');
    clearTimeout(timeout);
    if (disposed) throw new Error('Scene closed during loading');
    model = gltf.scene;
    scene.add(model);
    model.getObjectByName('Plane004')?.traverse(object => { object.visible = false; });
    const screen = model.getObjectByName('screenlight');
    if (screen) screen.visible = false;
    model.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material.name === 'default') { material.color.set('#777483'); material.roughness = .85; }
      }
    });
    mixer = new THREE.AnimationMixer(model);
    const intro = gltf.animations.find(clip => clip.name === 'introAnimation');
    if (intro) {
      const action = mixer.clipAction(intro);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      mixer.update(intro.duration);
    }
    const blink = gltf.animations.find(clip => clip.name === 'Blink');
    if (blink) mixer.clipAction(blink).play();
    head = model.getObjectByName('spine006');
    headBase = head?.rotation.clone();
    ready = true;
    render();
    host.classList.add('ready');
    draco.dispose();
    syncFrame();
    // Environment lighting is progressive enhancement, not a gate for content.
    new RGBELoader().load('/models/studio.hdr', texture => {
      if (disposed) { texture.dispose(); return; }
      texture.mapping = THREE.EquirectangularReflectionMapping;
      environment = texture;
      scene.environment = texture;
      scene.environmentIntensity = .45;
      render();
    }, undefined, () => { /* Direct lighting remains available. */ });
    return { setLight, setPaused(value) { paused = value; syncFrame(); }, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
