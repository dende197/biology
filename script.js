/* ================================================================
   PRESENTAZIONE 3D BIOLOGIA — LOGICA THREE.JS (r133)
   Struttura a capitoli con navigazione contestuale.
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── CONFIGURAZIONE SEZIONI E MODELLI ────────────────────────────
// Organizzazione gerarchica: Capitoli -> Modelli principali -> Dettagli
const SECTIONS = [
  {
    id: 'neuron_unit',
    title: 'Neurone & Sinapsi',
    icon: '⚡',
    models: [
      {
        id: 'neuron_main',
        file: 'models/result-4.glb',
        name: 'Neurone Completo',
        icon: '⚡',
        description: 'L\'unità fondamentale del sistema nervoso. Osserva la struttura ramificata: ' +
          'il corpo cellulare (soma), i dendriti ramificati e il lungo assone per la trasmissione dei segnali.',
        scale: 3.5,
        cameraPos: [0, 2, 8],
        targetPos: [0, 0, 0],
        actions: [
          { label: '🔍 Vedi Dettaglio Sinapsi', target: 'synapse_detail', icon: '🔬' }
        ]
      },
      {
        id: 'synapse_detail',
        file: 'models/result.glb',
        name: 'Sinapsi (Dettaglio)',
        icon: '🔬',
        description: 'Il punto di connessione tra due neuroni. Qui i neurotrasmettitori vengono rilasciati ' +
          'per trasmettere il segnale chimico da una cellula all\'altra.',
        scale: 4.0,
        cameraPos: [0, 2, 6],
        targetPos: [0, 0, 0],
        actions: [
          { label: '⬅ Torna al Neurone', target: 'neuron_main', icon: '↩️' }
        ]
      }
    ]
  },
  {
    id: 'cns_unit',
    title: 'Sistema Nervoso Centrale',
    icon: '🧠',
    models: [
      {
        id: 'cns_main',
        file: 'models/result-2.glb',
        name: 'Encefalo & Tronco',
        icon: '🧠',
        description: 'Visione d\'insieme del Sistema Nervoso Centrale: include cervello, cervelletto e tronco encefalico. ' +
          'È il centro di controllo di tutte le funzioni corporee.',
        scale: 3.0,
        cameraPos: [0, 1.5, 7],
        targetPos: [0, 0, 0],
        actions: [
          { label: '🦴 Vedi Midollo Spinale', target: 'spinal_cord', icon: '🦴' },
          { label: '🧠 Vedi Cervelletto', target: 'cerebellum', icon: '🧩' }
        ]
      },
      {
        id: 'spinal_cord',
        file: 'models/result-3.glb',
        name: 'Midollo Spinale',
        icon: '🦴',
        description: 'La via di comunicazione principale tra il cervello e il resto del corpo. ' +
          'Trasmette impulsi motori e sensoriali e coordina i riflessi.',
        scale: 3.0,
        cameraPos: [0, 2, 7],
        targetPos: [0, 0, 0],
        actions: [
          { label: '⬅ Torna al SNC', target: 'cns_main', icon: '↩️' }
        ]
      },
      {
        id: 'cerebellum',
        file: 'models/cerebellum-2.glb',
        name: 'Cervelletto',
        icon: '🧩',
        description: 'Situato alla base del cervello, è essenziale per la coordinazione motoria, ' +
          'l\'equilibrio e l\'apprendimento di movimenti fluidi e precisi.',
        scale: 3.0,
        cameraPos: [0, 1.5, 6],
        targetPos: [0, 0, 0],
        actions: [
          { label: '⬅ Torna al SNC', target: 'cns_main', icon: '↩️' }
        ]
      }
    ]
  },
  {
    id: 'cardio_unit',
    title: 'Apparato Cardiocircolatorio',
    icon: '❤️',
    models: [
      {
        id: 'heart_main',
        file: 'models/jantung_manusia.glb',
        name: 'Cuore Umano',
        icon: '❤️',
        description: 'Il motore del sistema circolatorio. Pompa sangue ossigenato a tutto il corpo ' +
          'e sangue deossigenato ai polmoni. Osserva i vasi principali e la struttura muscolare.',
        scale: 3.0,
        cameraPos: [0, 1.5, 6],
        targetPos: [0, 0, 0],
        actions: []
      }
    ]
  }
];

// Helper per trovare un modello dal suo ID
function findModelConfig(modelId) {
  for (const section of SECTIONS) {
    const found = section.models.find(m => m.id === modelId);
    if (found) return { model: found, section: section };
  }
  return null;
}

// ─── ELEMENTI DOM ────────────────────────────────────────────────
const canvas = document.getElementById('canvas3d');
const loaderOverlay = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const infoTitle = document.getElementById('info-title');
const infoIcon = document.getElementById('info-icon');
const infoDesc = document.getElementById('info-desc');
const hintEl = document.getElementById('hint');
const navBar = document.getElementById('nav-bar');
const contextContainer = document.getElementById('context-actions');

// Creazione dinamica breadcrumbs
let infoBreadcrumbs = document.getElementById('info-breadcrumbs');
if (!infoBreadcrumbs) {
  infoBreadcrumbs = document.createElement('div');
  infoBreadcrumbs.className = 'info-breadcrumbs';
  infoBreadcrumbs.id = 'info-breadcrumbs';
  infoTitle.parentElement.parentElement.insertBefore(infoBreadcrumbs, infoTitle.parentElement);
}

// ─── SETUP RENDERER ─────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true, // Importante: lascia vedere il gradiente CSS
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0); // Trasparente
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4; // Leggermente ridotto per mood dark
renderer.outputEncoding = THREE.sRGBEncoding;

// ─── SCENA ───────────────────────────────────────────────────────
const scene = new THREE.Scene();
// scene.background = null; // Trasparente di default

// ─── CAMERA ──────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
camera.position.set(0, 1.5, 6);

// ─── CONTROLLI ───────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.5;
controls.maxDistance = 18;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 1.2;

// ─── LUCI ────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.7);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(5, 10, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-6, 4, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.6); // Più forte per stacco dal fondo scuro
rimLight.position.set(0, 3, -8);
scene.add(rimLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
frontLight.position.set(0, 2, 8);
scene.add(frontLight);

// ─── GRIGLIA ─────────────────────────────────────────────────────
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
gridHelper.position.y = -1.5;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.2;
scene.add(gridHelper);

// ─── GLTF LOADER ─────────────────────────────────────────────────
const gltfLoader = new GLTFLoader();

async function loadGLB(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        resolve(root);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          loaderText.textContent = `Caricamento modello… ${pct}%`;
        }
      },
      (err) => {
        console.error('Errore caricamento GLB:', url, err);
        reject(err);
      }
    );
  });
}

// ─── GESTIONE MODELLO ATTIVO ─────────────────────────────────────
let currentModel = null;
let currentConfig = null;
let animProgress = 0;
let isAnimatingIn = false;
let targetScale = 1;

function wrapAndFit(rawModel, config) {
  const box = new THREE.Box3().setFromObject(rawModel);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  rawModel.position.set(-center.x, -center.y, -center.z);

  const wrapper = new THREE.Group();
  wrapper.add(rawModel);

  const maxDim = Math.max(size.x, size.y, size.z);
  targetScale = maxDim > 0 ? (config.scale || 3.0) / maxDim : 1;
  wrapper.scale.setScalar(0.001);
  wrapper.position.set(0, 0, 0);

  return wrapper;
}

async function switchModel(modelId) {
  const cfg = findModelConfig(modelId);
  if (!cfg) return;

  const config = cfg.model;
  const section = cfg.section;

  // Stesso modello? Non ricaricare
  // if (currentConfig && currentConfig.id === modelId) return;

  loaderOverlay.classList.remove('hidden');
  loaderText.textContent = 'Caricamento modello…';

  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  try {
    const rawModel = await loadGLB(config.file);
    const wrapper = wrapAndFit(rawModel, config);

    scene.add(wrapper);
    currentModel = wrapper;
    currentConfig = config;

    animProgress = 0;
    isAnimatingIn = true;

    // Aggiorna camera con animazione (opzionale, qui scatto diretto)
    camera.position.set(...config.cameraPos);
    controls.target.set(...config.targetPos);
    controls.update();

    // Aggiorna UI Info
    infoIcon.textContent = config.icon;
    infoTitle.textContent = config.name;
    infoDesc.textContent = config.description;
    infoBreadcrumbs.textContent = section.title;

    // Aggiorna Navigazione (Pillola attiva)
    updateNavUI(section.id);

    // Aggiorna Azioni Contestuali
    updateContextActions(config.actions);

    setTimeout(() => loaderOverlay.classList.add('hidden'), 300);
    // Hint solo la prima volta o cambio sezione
    // showHint('🖱️ Usa mouse/touch per esplorare');

  } catch (err) {
    console.error('Errore:', err);
    loaderText.textContent = 'Errore caricamento.';
    setTimeout(() => loaderOverlay.classList.add('hidden'), 2000);
  }
}

// ─── UI UPDATES ──────────────────────────────────────────────────

function updateNavUI(activeSectionId) {
  // Aggiorna stato attivo dei tab (sezioni)
  const buttons = navBar.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === activeSectionId);
  });
}

function updateContextActions(actions) {
  contextContainer.innerHTML = ''; // Pulisci vecchi bottoni

  if (!actions || actions.length === 0) return;

  actions.forEach((action, i) => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.innerHTML = `<span class="icon">${action.icon || '👉'}</span> ${action.label}`;
    // Delay staggered per animazione entrata
    btn.style.animationDelay = `${i * 0.1}s`;

    btn.addEventListener('click', () => {
      switchModel(action.target);
    });

    contextContainer.appendChild(btn);
  });
}

function createNavigation() {
  navBar.innerHTML = '';
  SECTIONS.forEach(section => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.dataset.section = section.id;
    btn.innerHTML = `<span>${section.icon}</span> ${section.title}`;

    btn.addEventListener('click', () => {
      // Al click sulla sezione, carica il PRIMO modello di quella sezione
      const firstModelId = section.models[0].id;
      switchModel(firstModelId);
    });

    navBar.appendChild(btn);
  });
}

// ─── UTILS ───────────────────────────────────────────────────────
let hintTimeout = null;
function showHint(text, duration = 4000) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => hintEl.classList.remove('show'), duration);
}

const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('active', controls.autoRotate);
  showHint(controls.autoRotate ? '🔄 Auto-rotazione attiva' : '⏹ Auto-rotazione disattivata', 2000);
});

const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', () => {
  if (currentConfig) {
    camera.position.set(...currentConfig.cameraPos);
    controls.target.set(...currentConfig.targetPos);
    controls.update();
    showHint('🎯 Vista reimpostata', 1500);
  }
});

function onResize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize, { passive: true });
onResize();

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── ANIMATION LOOP ──────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();

  if (isAnimatingIn && currentModel) {
    animProgress += dt * 1.8;
    if (animProgress >= 1) {
      animProgress = 1;
      isAnimatingIn = false;
    }
    const t = easeOutBack(Math.min(animProgress, 1));
    currentModel.scale.setScalar(targetScale * t);
  }

  if (currentModel && !isAnimatingIn) {
    currentModel.position.y = Math.sin(elapsed * 0.8) * 0.04;
  }

  renderer.render(scene, camera);
}

// ─── START ───────────────────────────────────────────────────────
createNavigation();
animate();

// Carica il primo modello della prima sezione all'avvio
switchModel(SECTIONS[0].models[0].id);
