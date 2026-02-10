/* ================================================================
   PRESENTAZIONE 3D BIOLOGIA — LOGICA APP (v11 Legacy)
   No GSAP, Simple Logic, High Performance
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
const loaderOverlay = document.getElementById('loader');
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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x44aaff, 0.5);
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

  const maxAnisotropy = renderer.capabilities.maxAnisotropy;
  root.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material.map) c.material.map.anisotropy = maxAnisotropy;
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

  loaderOverlay.classList.remove('hidden');

  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.load(model.file, resolve, undefined, reject);
    });

    loaderOverlay.classList.add('hidden');

    const wrapper = wrapModel(gltf);
    currentModel = wrapper;
    scene.add(wrapper);

    // Simple Camera Move
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(model.cam[0], model.cam[1], model.cam[2]);

    // Basic Custom Tween for Camera
    const duration = 1000;
    const start = performance.now();

    function tweenCamera(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.update();

      if (progress < 1) requestAnimationFrame(tweenCamera);
    }
    requestAnimationFrame(tweenCamera);

    // Update Text
    infoTitle.textContent = model.name;
    infoDesc.textContent = model.desc;
    chapterInd.textContent = section.title;

    updateNav(section.id);
    updateActions(model.actions);

  } catch (err) {
    console.error(err);
    loaderOverlay.classList.add('hidden');
  }
}

// ─── UI UPDATES ──────────────────────────────────────────────────
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
  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.innerHTML = `<span>${act.label}</span>`;
    if (act.icon) btn.innerHTML += ` <span style="font-size:1.2em">${act.icon}</span>`;

    btn.onclick = () => loadModel(act.target);
    contextStack.appendChild(btn); // No animation
  });
}

// ─── EVENTS ──────────────────────────────────────────────────────
const btnToggleText = document.getElementById('btn-toggle-text');
let isTextHidden = false;

btnToggleText.addEventListener('click', () => {
  isTextHidden = !isTextHidden;
  const app = document.querySelector('.app');
  if (isTextHidden) app.classList.add('info-hidden');
  else app.classList.remove('info-hidden');
});

const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
});

// ─── LOOP ────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  controls.update();
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
