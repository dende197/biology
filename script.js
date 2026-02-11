/* ================================================================
   BIOLOGIA 3D — ENGINE v13 (Final)
   Critical fix: renderer.setSize() on init (was missing → pixelation)
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ─── DATA ─────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'micro', title: 'Microstruttura',
    models: [
      {
        id: 'neuron',
        file: 'models/result-4.glb',
        name: 'Neurone',
        desc: 'L\'unità fondamentale del pensiero. Osserva la complessità delle ramificazioni dendritiche e l\'assone mielinizzato.',
        cam: [0, 2, 9],
        actions: [{ label: 'Esamina Sinapsi', target: 'synapse', icon: '⚡' }]
      },
      {
        id: 'synapse',
        file: 'models/result.glb',
        name: 'Sinapsi',
        desc: 'Il ponte chimico tra i neuroni. Qui il segnale elettrico diventa neurotrasmettitore e attraversa la fessura sinaptica.',
        cam: [0, 2, 7],
        actions: [{ label: 'Torna al Neurone', target: 'neuron', icon: '↩️' }]
      }
    ]
  },
  {
    id: 'snc', title: 'Sist. Nervoso Centrale',
    models: [
      {
        id: 'brain',
        file: 'models/result-2.glb',
        name: 'Encefalo',
        desc: 'Il centro di comando. Comprende cervello (corteccia, lobi), cervelletto e tronco encefalico.',
        cam: [0, 1.5, 7],
        actions: [
          { label: 'Midollo Spinale', target: 'spinal', icon: '🦴' },
          { label: 'Cervelletto', target: 'cerebellum', icon: '🧠' }
        ]
      },
      {
        id: 'spinal',
        file: 'models/result-3.glb',
        name: 'Midollo Spinale',
        desc: 'L\'autostrada delle informazioni sensoriali e motorie tra cervello e periferia.',
        cam: [0, 2, 7],
        actions: [{ label: 'Torna all\'Encefalo', target: 'brain', icon: '↩️' }]
      },
      {
        id: 'cerebellum',
        file: 'models/cerebellum-2.glb',
        name: 'Cervelletto',
        desc: 'Il maestro della coordinazione motoria e dell\'equilibrio posturale.',
        cam: [0, 1.5, 6],
        actions: [{ label: 'Torna all\'Encefalo', target: 'brain', icon: '↩️' }]
      }
    ]
  },
  {
    id: 'cardio', title: 'Cardiocircolatorio',
    models: [
      {
        id: 'heart',
        file: 'models/jantung_manusia.glb',
        name: 'Cuore Umano',
        desc: 'La pompa instancabile della vita. 100.000 battiti al giorno per nutrire ogni cellula del corpo.',
        cam: [0, 1.5, 6],
        actions: []
      }
    ]
  }
];

/* ─── DOM ───────────────────────────────────────────────────────── */
const canvas = document.getElementById('canvas3d');
const viewer = document.getElementById('viewer');
const loaderOverlay = document.getElementById('loader');
const navBar = document.getElementById('nav-bar');
const actionRow = document.getElementById('context-actions');
const infoCard = document.getElementById('info-card');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
const chapterInd = document.getElementById('chapter-indicator');

/* ─── THREE.JS RENDERER ────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});

// ★ CRITICAL FIX: Set size IMMEDIATELY on init
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(viewer.clientWidth, viewer.clientHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0x000000, 0); // Transparent → CSS gradient shows

/* ─── SCENE & CAMERA ───────────────────────────────────────────── */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  40,
  viewer.clientWidth / viewer.clientHeight, // ★ Correct aspect on init
  0.1,
  100
);
camera.position.set(0, 2, 10);

/* ─── CONTROLS ─────────────────────────────────────────────────── */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 25;
controls.autoRotateSpeed = 2;

/* ─── LIGHTING (Balanced for dark BG) ──────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(5, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);

const rim = new THREE.DirectionalLight(0x667fff, 0.5);
rim.position.set(-5, 4, -5);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-2, 0, 6);
scene.add(fill);

// Subtle hemisphere for organic models
const hemi = new THREE.HemisphereLight(0xeef0ff, 0x222233, 0.35);
scene.add(hemi);

/* ─── LOADER ───────────────────────────────────────────────────── */
const gltfLoader = new GLTFLoader();
let currentModel = null;
let currentModelId = null;
const modelCache = {};

function wrapModel(gltf) {
  const root = gltf.scene || gltf.scenes[0];

  // Center
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);

  // Normalize scale
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 4.0 / maxDim;

  const wrapper = new THREE.Group();
  wrapper.add(root);
  wrapper.scale.setScalar(scale);

  // Enhance quality
  const maxAniso = renderer.capabilities.maxAnisotropy;
  root.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const mat = child.material;
    if (mat.map) mat.map.anisotropy = maxAniso;
    if (mat.normalMap) mat.normalMap.anisotropy = maxAniso;
    if (mat.roughnessMap) mat.roughnessMap.anisotropy = maxAniso;
    if (mat.metalnessMap) mat.metalnessMap.anisotropy = maxAniso;
    if (mat.emissiveMap) mat.emissiveMap.anisotropy = maxAniso;
  });

  return wrapper;
}

/* ─── SMOOTH CAMERA TWEEN (no deps) ────────────────────────────── */
let tweenRaf = null;

function tweenCameraTo(target, duration = 900) {
  if (tweenRaf) cancelAnimationFrame(tweenRaf);
  const start = camera.position.clone();
  const end = new THREE.Vector3(...target);
  const t0 = performance.now();

  function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
    camera.position.lerpVectors(start, end, e);
    if (p < 1) tweenRaf = requestAnimationFrame(step);
    else tweenRaf = null;
  }
  tweenRaf = requestAnimationFrame(step);
}

/* ─── LOAD MODEL ───────────────────────────────────────────────── */
function findModel(id) {
  for (const s of SECTIONS)
    for (const m of s.models)
      if (m.id === id) return { model: m, section: s };
  return null;
}

async function loadModel(id) {
  if (id === currentModelId) return;
  const data = findModel(id);
  if (!data) return;
  const { model, section } = data;

  // Show loader
  loaderOverlay.classList.remove('hidden');

  // Remove current
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  try {
    let gltf;
    if (modelCache[model.file]) {
      gltf = modelCache[model.file];
    } else {
      gltf = await new Promise((resolve, reject) =>
        gltfLoader.load(model.file, resolve, undefined, reject)
      );
      modelCache[model.file] = gltf;
    }

    const wrapper = wrapModel(gltf);
    currentModel = wrapper;
    currentModelId = id;
    scene.add(wrapper);

    // Animate camera
    tweenCameraTo(model.cam);

    // Update UI
    infoTitle.textContent = model.name;
    infoDesc.textContent = model.desc;
    chapterInd.textContent = section.title;
    renderNav(section.id);
    renderActions(model.actions);

  } catch (err) {
    console.error('Errore caricamento modello:', err);
  }

  // Hide loader
  loaderOverlay.classList.add('hidden');
}

/* ─── NAV & ACTIONS ────────────────────────────────────────────── */
function renderNav(activeSectionId) {
  navBar.innerHTML = '';
  SECTIONS.forEach(sec => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (sec.id === activeSectionId ? ' active' : '');
    btn.textContent = sec.title;
    btn.addEventListener('click', () => loadModel(sec.models[0].id));
    navBar.appendChild(btn);
  });
}

function renderActions(actions) {
  actionRow.innerHTML = '';
  if (!actions || !actions.length) return;
  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.textContent = act.label + (act.icon ? ' ' + act.icon : '');
    btn.addEventListener('click', () => loadModel(act.target));
    actionRow.appendChild(btn);
  });
}

/* ─── BUTTON HANDLERS ──────────────────────────────────────────── */

// Focus: toggle text visibility in info card
const btnFocus = document.getElementById('btn-focus');
const iconOpen = document.getElementById('icon-eye-open');
const iconClosed = document.getElementById('icon-eye-closed');

btnFocus.addEventListener('click', () => {
  const hidden = infoCard.classList.toggle('text-hidden');
  iconOpen.style.display = hidden ? 'none' : 'block';
  iconClosed.style.display = hidden ? 'block' : 'none';
  btnFocus.classList.toggle('active', hidden);
});

// Auto-rotate
const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('active', controls.autoRotate);
});

// Reset view
const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', () => {
  if (currentModelId) {
    const data = findModel(currentModelId);
    if (data) tweenCameraTo(data.model.cam, 600);
  }
  controls.autoRotate = false;
  btnRotate.classList.remove('active');
});

/* ─── RESIZE ───────────────────────────────────────────────────── */
function onResize() {
  const w = viewer.clientWidth;
  const h = viewer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

/* ─── RENDER LOOP ──────────────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Gentle float
  if (currentModel) {
    currentModel.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.04;
  }

  renderer.render(scene, camera);
}

/* ─── BOOT ─────────────────────────────────────────────────────── */
onResize(); // ★ Ensure correct size before first render
loadModel(SECTIONS[0].models[0].id);
animate();
