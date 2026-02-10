/* ================================================================
   PRESENTAZIONE 3D BIOLOGIA — LOGICA THREE.JS
   Caricamento modelli GLB, animazioni, controlli interattivi.
   Ogni sezione è commentata in italiano per comprensione.
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── CONFIGURAZIONE MODELLI ─────────────────────────────────────
// Array con i dati di ogni modello caricabile.
// "file" è il path relativo dentro la cartella models/.
const MODELS = [
  {
    id: 'heart',
    file: 'models/jantung_manusia.glb',
    name: 'Cuore Umano',
    icon: '❤️',
    description: 'Il cuore è un organo muscolare cavo che pompa il sangue attraverso il sistema circolatorio. ' +
      'È diviso in 4 camere: 2 atri (superiori) e 2 ventricoli (inferiori). ' +
      'Il lato destro riceve sangue deossigenato e lo invia ai polmoni; il sinistro riceve sangue ossigenato e lo distribuisce al corpo.',
    scale: 2.5,
    position: [0, -0.5, 0],
    cameraPos: [0, 1, 5],
    targetPos: [0, 0.5, 0],
  },
  {
    id: 'neuron',
    file: 'models/neuron.glb',
    name: 'Neurone',
    icon: '🧬',
    description: 'Il neurone è la cellula fondamentale del sistema nervoso. ' +
      'È composto da: corpo cellulare (soma), dendriti (ricezione segnali), assone (trasmissione impulso) ' +
      'e terminazioni sinaptiche. La guaina mielinica accelera la conduzione dell\'impulso elettrico.',
    scale: 2.0,
    position: [0, -0.3, 0],
    cameraPos: [0, 1.5, 6],
    targetPos: [0, 0.5, 0],
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
    scale: 2.5,
    position: [0, -0.2, 0],
    cameraPos: [0, 2, 6],
    targetPos: [0, 0.8, 0],
  },
  {
    id: 'brain2',
    file: 'models/brain_project.glb',
    name: 'Cervello — Dettaglio',
    icon: '🔬',
    description: 'Vista dettagliata del cervello che evidenzia le principali aree funzionali: ' +
      'lobo frontale (pensiero, decisioni), lobo parietale (sensazioni), ' +
      'lobo temporale (udito, memoria), lobo occipitale (vista) e cervelletto (coordinazione motoria).',
    scale: 2.5,
    position: [0, -0.2, 0],
    cameraPos: [0, 2, 6],
    targetPos: [0, 0.8, 0],
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
// WebGLRenderer con antialiasing e sfondo trasparente.
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ─── SCENA ───────────────────────────────────────────────────────
const scene = new THREE.Scene();

// Leggera nebbia per profondità atmosferica
scene.fog = new THREE.FogExp2(0x06080f, 0.035);

// ─── CAMERA ──────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
camera.position.set(0, 1.5, 6);

// ─── CONTROLLI ORBITALI ──────────────────────────────────────────
// Permettono rotazione con mouse/touch, zoom con rotellina/pinch.
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 15;
controls.target.set(0, 0.5, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;
controls.maxPolarAngle = Math.PI * 0.85;

// ─── LUCI ────────────────────────────────────────────────────────
// Luce ambientale morbida (illuminazione base)
const ambientLight = new THREE.AmbientLight(0x8aa3ff, 0.35);
scene.add(ambientLight);

// Luce direzionale principale (simula il sole, genera ombre)
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(5, 8, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Luce di riempimento (colore accent, da sinistra)
const fillLight = new THREE.DirectionalLight(0x67d5ff, 0.6);
fillLight.position.set(-6, 3, 4);
scene.add(fillLight);

// Luce rim (contorno verde dal retro)
const rimLight = new THREE.DirectionalLight(0xa6ffcb, 0.3);
rimLight.position.set(0, 4, -8);
scene.add(rimLight);

// Luce dal basso (sottile, per drammaticità)
const bottomLight = new THREE.PointLight(0x4ea0ff, 0.4, 12);
bottomLight.position.set(0, -2, 0);
scene.add(bottomLight);

// ─── PIANO DI APPOGGIO (griglia sottile) ─────────────────────────
const gridHelper = new THREE.GridHelper(20, 20, 0x1a2550, 0x111a38);
gridHelper.position.y = -0.8;
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.15;
scene.add(gridHelper);

// ─── PARTICELLE DECORATIVE DI SFONDO ─────────────────────────────
// Piccole sfere fluttuanti per atmosfera
const decoGroup = new THREE.Group();
scene.add(decoGroup);

(function createDecoParticles() {
  const geo = new THREE.SphereGeometry(0.04, 12, 12);
  for (let i = 0; i < 60; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.18, 0.75, 0.55),
      emissive: 0x0b1020,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.45
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      Math.random() * 10 - 1,
      (Math.random() - 0.5) * 20
    );
    mesh.scale.setScalar(0.5 + Math.random() * 2.0);
    // Salvo dati per animazione fluttuante
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.speed = 0.3 + Math.random() * 0.6;
    mesh.userData.amp = 0.15 + Math.random() * 0.4;
    mesh.userData.phase = Math.random() * Math.PI * 2;
    decoGroup.add(mesh);
  }
})();

// ─── GLTF LOADER E CACHE ────────────────────────────────────────
const gltfLoader = new GLTFLoader();
const modelCache = new Map();

/**
 * Carica un modello GLB e lo mette in cache.
 * Restituisce un clone per poter avere istanze indipendenti.
 */
async function loadGLB(url) {
  if (modelCache.has(url)) {
    return modelCache.get(url).clone(true);
  }
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        // Abilita ombre su tutte le mesh del modello
        root.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        modelCache.set(url, root);
        resolve(root.clone(true));
      },
      // Progresso caricamento
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
let currentModel = null;    // THREE.Group attualmente nella scena
let currentConfig = null;   // Configurazione dal array MODELS
let animProgress = 0;       // Progresso animazione entrata (0→1)
let isAnimatingIn = false;  // Flag: animazione entrata in corso

/**
 * Centro e scala automaticamente il modello nella scena
 * usando il bounding box. Sovrascrive con scala da config.
 */
function autoFitModel(model, config) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Centra il modello rispetto al suo bounding box
  model.position.sub(center);

  // Scala uniforme basata sulla dimensione massima
  const maxDim = Math.max(size.x, size.y, size.z);
  const targetScale = (config.scale || 2.0) / maxDim;
  model.scale.setScalar(targetScale);

  // Riposiziona secondo config
  model.position.set(
    config.position[0],
    config.position[1],
    config.position[2]
  );
}

/**
 * Cambia il modello visualizzato.
 * Rimuove il vecchio (con fade-out), carica il nuovo (con scale-in).
 */
async function switchModel(modelId) {
  const config = MODELS.find(m => m.id === modelId);
  if (!config) return;
  
  // Mostra il loader
  loaderOverlay.classList.remove('hidden');
  loaderText.textContent = 'Caricamento modello…';

  // Rimuovi il modello attuale dalla scena
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  try {
    // Carica il GLB
    const model = await loadGLB(config.file);

    // AutoFit: centra e scala
    autoFitModel(model, config);

    // Impostazione iniziale per animazione scale-in (parte da 0)
    model.scale.multiplyScalar(0.001);
    model.userData.targetScale = model.scale.clone().multiplyScalar(1000); // Scala finale

    scene.add(model);
    currentModel = model;
    currentConfig = config;

    // Avvia animazione di entrata
    animProgress = 0;
    isAnimatingIn = true;

    // Aggiorna camera position e target
    camera.position.set(...config.cameraPos);
    controls.target.set(...config.targetPos);
    controls.update();

    // Aggiorna pannello info
    infoIcon.textContent = config.icon;
    infoTitle.textContent = config.name;
    infoDesc.textContent = config.description;

    // Aggiorna pulsanti attivi
    document.querySelectorAll('.model-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.model === modelId);
    });

    // Nascondi loader dopo un attimo
    setTimeout(() => {
      loaderOverlay.classList.add('hidden');
    }, 300);

    // Mostra hint interazione
    showHint('🖱️ Trascina per ruotare · Rotellina per zoom · Pinch su mobile');

  } catch (err) {
    console.error('Errore nel caricamento:', err);
    loaderText.textContent = 'Errore nel caricamento del modello.';
    setTimeout(() => {
      loaderOverlay.classList.add('hidden');
    }, 2000);
  }
}

// ─── HINT / TOAST ────────────────────────────────────────────────
let hintTimeout = null;

function showHint(text, duration = 4000) {
  hintEl.textContent = text;
  hintEl.classList.add('show');
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    hintEl.classList.remove('show');
  }, duration);
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
btnRotate.classList.add('active');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('active', controls.autoRotate);
  showHint(controls.autoRotate ? '🔄 Auto-rotazione attiva' : '⏹ Auto-rotazione disattivata', 2000);
});

// Pulsante per resettare la vista
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

// ─── EASING FUNCTION ─────────────────────────────────────────────
// Easing cubico in-out per animazioni fluide
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

  // Aggiorna i controlli (damping + auto-rotate)
  controls.update();

  // Animazione di entrata scale-in con easing
  if (isAnimatingIn && currentModel) {
    animProgress += dt * 1.8; // Velocità animazione
    if (animProgress >= 1) {
      animProgress = 1;
      isAnimatingIn = false;
    }
    const t = easeOutBack(Math.min(animProgress, 1));
    const ts = currentModel.userData.targetScale;
    currentModel.scale.set(
      ts.x * t,
      ts.y * t,
      ts.z * t
    );
  }

  // Leggera oscillazione verticale del modello (respiro)
  if (currentModel && !isAnimatingIn) {
    const baseY = currentConfig ? currentConfig.position[1] : 0;
    currentModel.position.y = baseY + Math.sin(elapsed * 0.8) * 0.05;
  }

  // Animazione particelle decorative (fluttuano)
  decoGroup.children.forEach((p) => {
    p.position.y = p.userData.baseY + Math.sin(elapsed * p.userData.speed + p.userData.phase) * p.userData.amp;
  });

  // Render della scena
  renderer.render(scene, camera);
}

// ─── AVVIO ───────────────────────────────────────────────────────
createButtons();
animate();

// Carica il primo modello all'avvio
switchModel(MODELS[0].id);
