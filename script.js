/* ================================================================
   PRESENTAZIONE 3D BIOLOGIA — LOGICA THREE.JS (r133)
   Caricamento modelli GLB con KHR_materials_pbrSpecularGlossiness.
   Ogni sezione è commentata in italiano per comprensione.
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── CONFIGURAZIONE MODELLI ─────────────────────────────────────
// Array con i dati di ogni modello caricabile.
const MODELS = [
  {
    id: 'heart',
    file: 'models/jantung_manusia.glb',
    name: 'Cuore Umano',
    icon: '❤️',
    description: 'Il cuore è un organo muscolare cavo che pompa il sangue attraverso il sistema circolatorio. ' +
      'È diviso in 4 camere: 2 atri (superiori) e 2 ventricoli (inferiori). ' +
      'Il lato destro riceve sangue deossigenato e lo invia ai polmoni; il sinistro riceve sangue ossigenato e lo distribuisce al corpo.',
    scale: 3.0,
    cameraPos: [0, 1.5, 6],
    targetPos: [0, 0, 0],
  },
  {
    id: 'neuron',
    file: 'models/neuron.glb',
    name: 'Neurone',
    icon: '🧬',
    description: 'Il neurone è la cellula fondamentale del sistema nervoso. ' +
      'È composto da: corpo cellulare (soma), dendriti (ricezione segnali), assone (trasmissione impulso) ' +
      'e terminazioni sinaptiche. La guaina mielinica accelera la conduzione dell\'impulso elettrico.',
    scale: 3.0,
    cameraPos: [0, 1.5, 7],
    targetPos: [0, 0, 0],
  },
  {
    id: 'brain',
    file: 'models/human_brain.glb',
    name: 'Cervello Umano',
    icon: '🧠',
    description: 'Il cervello è l\'organo principale del sistema nervoso centrale. ' +
      'Controlla funzioni cognitive, motorie, sensoriali e autonome. ' +
      'È diviso in emisfero destro e sinistro, connessi dal corpo calloso. ' +
      'Contiene circa 86 miliardi di neuroni.',
    scale: 3.0,
    cameraPos: [0, 2, 7],
    targetPos: [0, 0, 0],
  },
  {
    id: 'brain2',
    file: 'models/brain_project.glb',
    name: 'Cervello — Dettaglio',
    icon: '🔬',
    description: 'Vista dettagliata del cervello che evidenzia le principali aree funzionali: ' +
      'lobo frontale (pensiero, decisioni), lobo parietale (sensazioni), ' +
      'lobo temporale (udito, memoria), lobo occipitale (vista) e cervelletto (coordinazione motoria).',
    scale: 3.0,
    cameraPos: [0, 2, 7],
    targetPos: [0, 0, 0],
  }
];

// ─── ELEMENTI DOM ────────────────────────────────────────────────
const canvas = document.getElementById('canvas3d');
const loaderOverlay = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const infoTitle = document.getElementById('info-title');
const infoIcon = document.getElementById('info-icon');
const infoDesc = document.getElementById('info-desc');
const hintEl = document.getElementById('hint');
const btnBar = document.getElementById('model-bar');

// ─── SETUP RENDERER ─────────────────────────────────────────────
// WebGLRenderer con sfondo chiaro, ombre morbide, encoding sRGB.
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xf0f2f8, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;

// ─── SCENA ───────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f8);
// Nessuna nebbia — vogliamo colori puri e fedeli ai modelli

// ─── CAMERA ──────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
camera.position.set(0, 1.5, 6);

// ─── CONTROLLI ORBITALI ──────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.5;
controls.maxDistance = 18;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 1.2;

// ─── LUCI ────────────────────────────────────────────────────────
// Forte luce ambientale per illuminare uniformemente i colori dei modelli
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

// Hemisphere: simula cielo chiaro + riflesso pavimento
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.7);
scene.add(hemiLight);

// Luce direzionale principale — ombre morbide
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(5, 10, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -6;
keyLight.shadow.camera.right = 6;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -6;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Fill da sinistra
const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-6, 4, 4);
scene.add(fillLight);

// Rim dal retro
const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
rimLight.position.set(0, 3, -8);
scene.add(rimLight);

// Front per evitare zone troppo scure
const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
frontLight.position.set(0, 2, 8);
scene.add(frontLight);

// ─── GRIGLIA SOTTILE CHIARA ──────────────────────────────────────
const gridHelper = new THREE.GridHelper(20, 20, 0xd0d4e0, 0xdfe2ec);
gridHelper.position.y = -1.5;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.35;
scene.add(gridHelper);

// ─── GLTF LOADER ─────────────────────────────────────────────────
// Three.js r133 ha supporto nativo per KHR_materials_pbrSpecularGlossiness.
// Non usiamo cache/clone perché Three.js clone() perde texture e materiali PBR.
const gltfLoader = new GLTFLoader();

/**
 * Carica un modello GLB preservando materiali e texture originali.
 */
async function loadGLB(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        // Solo ombre, NON tocchiamo mai i materiali
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
let currentModel = null;    // Wrapper group nella scena
let currentConfig = null;
let animProgress = 0;
let isAnimatingIn = false;
let targetScale = 1;        // Scala finale calcolata da autoFit

/**
 * Centra e scala il modello con un wrapper group.
 * Il modello è centrato usando il bounding box, poi il wrapper
 * viene scalato e posizionato — il modello rimane sempre intero.
 */
function wrapAndFit(rawModel, config) {
  // 1. Calcola bounding box del modello grezzo
  const box = new THREE.Box3().setFromObject(rawModel);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  // 2. Sposta il modello così che il centro del bbox sia in (0,0,0)
  rawModel.position.set(-center.x, -center.y, -center.z);

  // 3. Gruppo wrapper — contiene il modello centrato
  const wrapper = new THREE.Group();
  wrapper.add(rawModel);

  // 4. Scala uniforme basata sulla dimensione massima
  const maxDim = Math.max(size.x, size.y, size.z);
  targetScale = maxDim > 0 ? (config.scale || 3.0) / maxDim : 1;

  // Parte da zero per animazione scale-in
  wrapper.scale.setScalar(0.001);

  // 5. Centra il wrapper: posizione 0,0,0 di default, camera guarda al centro
  wrapper.position.set(0, 0, 0);

  return wrapper;
}

/**
 * Cambia il modello visualizzato con animazione scale-in.
 */
async function switchModel(modelId) {
  const config = MODELS.find(m => m.id === modelId);
  if (!config) return;

  // Mostra loader
  loaderOverlay.classList.remove('hidden');
  loaderText.textContent = 'Caricamento modello…';

  // Rimuovi modello attuale
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

    // Avvia animazione entrata
    animProgress = 0;
    isAnimatingIn = true;

    // Camera e target
    camera.position.set(...config.cameraPos);
    controls.target.set(...config.targetPos);
    controls.update();

    // Aggiorna UI
    infoIcon.textContent = config.icon;
    infoTitle.textContent = config.name;
    infoDesc.textContent = config.description;

    document.querySelectorAll('.model-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.model === modelId);
    });

    setTimeout(() => loaderOverlay.classList.add('hidden'), 300);
    showHint('🖱️ Trascina per ruotare · Rotellina per zoom · Pinch su mobile');

  } catch (err) {
    console.error('Errore nel caricamento:', err);
    loaderText.textContent = 'Errore nel caricamento del modello.';
    setTimeout(() => loaderOverlay.classList.add('hidden'), 2000);
  }
}

// ─── HINT / TOAST ────────────────────────────────────────────────
let hintTimeout = null;

function showHint(text, duration = 4000) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => hintEl.classList.remove('show'), duration);
}

// ─── CREAZIONE PULSANTI MODELLO ──────────────────────────────────
function createButtons() {
  MODELS.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.className = 'model-btn' + (i === 0 ? ' active' : '');
    btn.dataset.model = m.id;
    btn.innerHTML = `<span class="btn-icon">${m.icon}</span>${m.name}`;
    btn.addEventListener('click', () => switchModel(m.id));
    btnBar.appendChild(btn);
  });
}

// ─── PULSANTE AUTO-ROTATE ────────────────────────────────────────
const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('active', controls.autoRotate);
  showHint(controls.autoRotate ? '🔄 Auto-rotazione attiva' : '⏹ Auto-rotazione disattivata', 2000);
});

// Pulsante reset vista
const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', () => {
  if (currentConfig) {
    camera.position.set(...currentConfig.cameraPos);
    controls.target.set(...currentConfig.targetPos);
    controls.update();
    showHint('🎯 Vista reimpostata', 1500);
  }
});

// ─── RESIZE HANDLER ──────────────────────────────────────────────
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

// ─── EASING ──────────────────────────────────────────────────────
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── LOOP DI ANIMAZIONE ──────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();

  // Animazione scale-in
  if (isAnimatingIn && currentModel) {
    animProgress += dt * 1.8;
    if (animProgress >= 1) {
      animProgress = 1;
      isAnimatingIn = false;
    }
    const t = easeOutBack(Math.min(animProgress, 1));
    currentModel.scale.setScalar(targetScale * t);
  }

  // Leggera oscillazione verticale (respiro)
  if (currentModel && !isAnimatingIn) {
    currentModel.position.y = Math.sin(elapsed * 0.8) * 0.04;
  }

  renderer.render(scene, camera);
}

// ─── AVVIO ───────────────────────────────────────────────────────
createButtons();
animate();
switchModel(MODELS[0].id);
