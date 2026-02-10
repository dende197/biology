/* ================================================================
   PRESENTAZIONE 3D BIOLOGIA — LOGICA APP (v10 Final Polish)
   High Res, Legacy Loader, Optimized
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── DATI (SEZIONI) ──────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'microunit',
    title: 'Microstruttura',
    models: [
      {
        id: 'neuron_main',
        file: 'models/result-4.glb',
        name: 'Neurone',
        desc: 'L\'unità fondamentale del pensiero. Osserva la complessità delle ramificazioni dendritiche.',
        cam: [0, 2, 9],
        actions: [{ label: 'Esamina Sinapsi', target: 'synapse', icon: '⚡' }]
      },
      {
        id: 'synapse',
        file: 'models/result.glb',
        name: 'Sinapsi',
        desc: 'Il ponte chimico tra i neuroni. Qui il segnale diventa neurotrasmettitore.',
        cam: [0, 2, 7],
        actions: [{ label: 'Torna al Neurone', target: 'neuron_main', icon: '↩️' }]
      }
    ]
  },
  {
    id: 'cns',
    title: 'Sist. Nervoso',
    models: [
      {
        id: 'cns_main',
        file: 'models/result-2.glb',
        name: 'Encefalo',
        desc: 'Il centro di controllo assoluto. Comprende cervello, cervelletto e tronco encefalico.',
        cam: [0, 1.5, 7],
        actions: [
          { label: 'Vedi Midollo', target: 'spinal', icon: '🦴' },
          { label: 'Vedi Cervelletto', target: 'cerebellum', icon: '🧠' }
        ]
      },
      {
        id: 'spinal',
        file: 'models/result-3.glb',
        name: 'Midollo Spinale',
        desc: 'L\'autostrada delle informazioni sensoriali e motorie.',
        cam: [0, 2, 7],
        actions: [{ label: 'Torna al SNC', target: 'cns_main', icon: '↩️' }]
      },
      {
        id: 'cerebellum',
        file: 'models/cerebellum-2.glb',
        name: 'Cervelletto',
        desc: 'Il maestro della coordinazione e dell\'equilibrio.',
        cam: [0, 1.5, 6],
        actions: [{ label: 'Torna al SNC', target: 'cns_main', icon: '↩️' }]
      }
    ]
  },
  {
    id: 'cardio',
    title: 'Cardiocircolatorio',
    models: [
      {
        id: 'heart',
        file: 'models/jantung_manusia.glb',
        name: 'Cuore Umano',
        desc: 'La pompa instancabile della vita. 100.000 battiti al giorno per nutrire ogni cellula.',
        cam: [0, 1.5, 6],
        actions: []
      }
    ]
  }
];

// ─── DOM ELEMENTS ────────────────────────────────────────────────
const canvas = document.getElementById('canvas3d');
const uiLayer = document.getElementById('ui-layer');
const loaderOverlay = document.getElementById('loader'); // Legacy Spinner
const navBar = document.getElementById('nav-bar');
const contextStack = document.getElementById('context-actions');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
const chapterInd = document.getElementById('chapter-indicator');

// ─── THREE.JS SETUP ──────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
// FIX PIXELATION: Use full device pixel ratio
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 2, 10);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 20;

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x44aaff, 0.6);
rimLight.position.set(-5, 3, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(0, 0, 5);
scene.add(fillLight);

// ─── GLTF LOADER ─────────────────────────────────────────────────
const loader = new GLTFLoader();
let currentModel = null;

function wrapModel(gltf) {
  const root = gltf.scene || gltf.scenes[0];
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box.getCenter(center);

  root.position.sub(center);

  const wrapper = new THREE.Group();
  wrapper.add(root);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 4.0 / maxDim;
  wrapper.scale.setScalar(scaleFactor);

  // FIX TEXTURE QUALITY & SHADOWS
  const maxAnisotropy = renderer.capabilities.maxAnisotropy;
  root.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      c.material.depthWrite = true;

      // Enhance textures
      if (c.material.map) c.material.map.anisotropy = maxAnisotropy;
      if (c.material.normalMap) c.material.normalMap.anisotropy = maxAnisotropy;
      if (c.material.roughnessMap) c.material.roughnessMap.anisotropy = maxAnisotropy;
    }
  });

  return wrapper;
}

// ─── APP LOGIC ───────────────────────────────────────────────────

function findModel(id) {
  for (const s of SECTIONS) {
    const m = s.models.find(x => x.id === id);
    if (m) return { model: m, section: s };
  }
  return null;
}

async function loadModel(id) {
  const data = findModel(id);
  if (!data) return;
  const { model, section } = data;

  // UI Fade Out
  gsap.to([infoTitle, infoDesc], { opacity: 0, y: -10, duration: 0.2 });

  // Show Loader
  loaderOverlay.classList.remove('hidden');

  if (currentModel) {
    scene.remove(currentModel); // Instant remove for clearer loading state
    currentModel = null;
  }

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.load(model.file, resolve, undefined, reject);
    });

    // Hide Loader
    loaderOverlay.classList.add('hidden');

    const wrapper = wrapModel(gltf);
    currentModel = wrapper;
    scene.add(wrapper);

    // Smooth Scale In
    wrapper.scale.set(0, 0, 0);
    gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1)', delay: 0.1 });

    // Move Camera
    gsap.to(camera.position, {
      x: model.cam[0], y: model.cam[1], z: model.cam[2],
      duration: 1.0, ease: 'power2.inOut'
    });

    // Update Text
    infoTitle.textContent = model.name;
    infoDesc.textContent = model.desc;
    chapterInd.textContent = section.title;

    updateNav(section.id);
    updateActions(model.actions);

    // Fade In Text
    gsap.to([infoTitle, infoDesc], { opacity: 1, y: 0, duration: 0.5, delay: 0.2 });

  } catch (err) {
    console.error(err);
    loaderOverlay.classList.add('hidden');
  }
}

// ─── NAVBAR & ACTIONS ────────────────────────────────────────────
function updateNav(activeSecId) {
  navBar.innerHTML = '';
  SECTIONS.forEach(sec => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    if (sec.id === activeSecId) btn.classList.add('active');
    btn.textContent = sec.title;
    btn.onclick = () => loadModel(sec.models[0].id);
    navBar.appendChild(btn);
  });
}

function updateActions(actions) {
  contextStack.innerHTML = '';
  actions.forEach((act, i) => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.innerHTML = `<span>${act.label}</span>`;
    if (act.icon) btn.innerHTML += ` <span style="font-size:1.2em">${act.icon}</span>`;

    btn.onclick = () => loadModel(act.target);
    gsap.fromTo(btn, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, delay: 0.3 + (i * 0.1) });
    contextStack.appendChild(btn);
  });
}

// ─── FOCUS & CONTROLS ────────────────────────────────────────────
const btnToggleText = document.getElementById('btn-toggle-text');
let isFocus = false;

btnToggleText.addEventListener('click', () => {
  isFocus = !isFocus;
  const ui = document.getElementById('ui-layer');

  if (isFocus) ui.classList.add('info-hidden');
  else ui.classList.remove('info-hidden');

  btnToggleText.classList.toggle('active', isFocus);
});

const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('active', controls.autoRotate);
});

// ─── RENDER LOOP ─────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  controls.update();

  if (currentModel) {
    currentModel.position.y = Math.sin(t * 0.5) * 0.05;
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// INIT
loadModel(SECTIONS[0].models[0].id);
animate();
