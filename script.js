/* ================================================================
   BIOLOGIA 3D — ENGINE v14
   + AnimationMixer for animated models
   + ECG waveform overlay for heart section
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
        id: 'heart_anim',
        file: 'models/realistic_heart_animated.glb',
        name: 'Cuore Animato',
        desc: 'Il cuore umano in battito continuo. Osserva la contrazione ritmica del miocardio — sistole e diastole.',
        cam: [0, 1.5, 6],
        animated: true, // ← flag per AnimationMixer + ECG
        actions: [{ label: 'Modello Anatomico', target: 'heart_model', icon: '❤️' }]
      },
      {
        id: 'heart_model',
        file: 'models/human_heart_3d_model.glb',
        name: 'Cuore — Anatomia',
        desc: 'Modello anatomico dettagliato del cuore umano. Ventricoli, atri, valvole e grandi vasi.',
        cam: [0, 1.5, 6],
        actions: [{ label: 'Cuore Animato', target: 'heart_anim', icon: '💓' }]
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
const ecgCanvas = document.getElementById('ecg-canvas');
const ecgCtx = ecgCanvas.getContext('2d');

/* ─── THREE.JS ─────────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  40, viewer.clientWidth / viewer.clientHeight, 0.1, 100
);
camera.position.set(0, 2, 10);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 25;
controls.autoRotateSpeed = 2;

/* ─── LIGHTING ─────────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(5, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
scene.add(key);

scene.add(Object.assign(
  new THREE.DirectionalLight(0x667fff, 0.5),
  { position: new THREE.Vector3(-5, 4, -5) }
));
scene.add(Object.assign(
  new THREE.DirectionalLight(0xffffff, 0.35),
  { position: new THREE.Vector3(-2, 0, 6) }
));
scene.add(new THREE.HemisphereLight(0xeef0ff, 0x222233, 0.35));

/* ─── GLTF LOADER ──────────────────────────────────────────────── */
const gltfLoader = new GLTFLoader();
let currentModel = null;
let currentModelId = null;
let mixer = null; // AnimationMixer
let ecgActive = false;

function wrapModel(gltf) {
  const root = gltf.scene || gltf.scenes[0];
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 4.0 / maxDim;

  const wrapper = new THREE.Group();
  wrapper.add(root);
  wrapper.scale.setScalar(scale);

  const maxAniso = renderer.capabilities.maxAnisotropy;
  root.traverse(c => {
    if (!c.isMesh) return;
    c.castShadow = true;
    c.receiveShadow = true;
    const m = c.material;
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']
      .forEach(k => { if (m[k]) m[k].anisotropy = maxAniso; });
  });

  return wrapper;
}

/* ─── CAMERA TWEEN ─────────────────────────────────────────────── */
let tweenRaf = null;

function tweenCameraTo(target, duration = 900) {
  if (tweenRaf) cancelAnimationFrame(tweenRaf);
  const s = camera.position.clone();
  const e = new THREE.Vector3(...target);
  const t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    camera.position.lerpVectors(s, e, 1 - Math.pow(1 - p, 3));
    if (p < 1) tweenRaf = requestAnimationFrame(step);
    else tweenRaf = null;
  }
  tweenRaf = requestAnimationFrame(step);
}

/* ─── ECG WAVEFORM ENGINE ──────────────────────────────────────── */
let ecgX = 0;
let ecgPhase = 0;
const ECG_SPEED = 2.5; // pixels per frame
const ECG_BPM = 72;
const ECG_PERIOD = 60 / ECG_BPM; // seconds per beat

// Realistic ECG waveform shape: P-QRS-T
function ecgValue(t) {
  // t = 0..1 within one heartbeat cycle
  // P wave (small bump)
  if (t < 0.10) {
    const s = t / 0.10;
    return 0.15 * Math.sin(Math.PI * s);
  }
  // PR segment (flat baseline)
  if (t < 0.16) return 0;
  // Q dip
  if (t < 0.20) {
    const s = (t - 0.16) / 0.04;
    return -0.15 * Math.sin(Math.PI * s);
  }
  // R spike (tall)
  if (t < 0.28) {
    const s = (t - 0.20) / 0.08;
    return 1.0 * Math.sin(Math.PI * s);
  }
  // S dip
  if (t < 0.34) {
    const s = (t - 0.28) / 0.06;
    return -0.25 * Math.sin(Math.PI * s);
  }
  // ST segment (flat, slight elevation)
  if (t < 0.45) return 0.02;
  // T wave (broad bump)
  if (t < 0.65) {
    const s = (t - 0.45) / 0.20;
    return 0.25 * Math.sin(Math.PI * s);
  }
  // Baseline
  return 0;
}

function resizeECG() {
  const dpr = window.devicePixelRatio || 1;
  const w = ecgCanvas.parentElement.clientWidth;
  const h = 140;
  ecgCanvas.width = w * dpr;
  ecgCanvas.height = h * dpr;
  ecgCanvas.style.width = w + 'px';
  ecgCanvas.style.height = h + 'px';
  ecgCtx.scale(dpr, dpr);
  ecgX = 0;
}

function drawECG(dt) {
  if (!ecgActive) return;

  const w = ecgCanvas.clientWidth;
  const h = ecgCanvas.clientHeight;
  const midY = h * 0.5;
  const ampY = h * 0.35;

  // Advance phase
  ecgPhase += dt / ECG_PERIOD;
  if (ecgPhase > 1) ecgPhase -= 1;

  // Clear a strip ahead for sweep effect
  const clearW = 40;
  const dpr = window.devicePixelRatio || 1;
  ecgCtx.save();
  ecgCtx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ecgCtx.clearRect(ecgX * dpr, 0, clearW * dpr, ecgCanvas.height);
  ecgCtx.restore();

  // Draw the line segment
  const val = ecgValue(ecgPhase);
  const y = midY - val * ampY;

  ecgCtx.strokeStyle = '#ff3b30';
  ecgCtx.lineWidth = 2;
  ecgCtx.shadowColor = 'rgba(255, 59, 48, 0.6)';
  ecgCtx.shadowBlur = 8;
  ecgCtx.beginPath();
  ecgCtx.moveTo(ecgX, y);

  ecgX += ECG_SPEED;
  if (ecgX > w) ecgX = 0;

  const nextPhase = ecgPhase + (ECG_SPEED / w) * (dt / ECG_PERIOD) * 30;
  const nextVal = ecgValue(nextPhase % 1);
  const nextY = midY - nextVal * ampY;
  ecgCtx.lineTo(ecgX, nextY);
  ecgCtx.stroke();

  // Fading trail: apply a dim overlay on the whole canvas
  // (done infrequently to avoid blur buildup)
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

  loaderOverlay.classList.remove('hidden');

  // Clean up previous
  if (currentModel) { scene.remove(currentModel); currentModel = null; }
  if (mixer) { mixer.stopAllAction(); mixer = null; }

  try {
    const gltf = await new Promise((resolve, reject) =>
      gltfLoader.load(model.file, resolve, undefined, reject)
    );

    const wrapper = wrapModel(gltf);
    currentModel = wrapper;
    currentModelId = id;
    scene.add(wrapper);

    // Setup animation if model has clips
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(wrapper);
      gltf.animations.forEach(clip => {
        const action = mixer.clipAction(clip);
        action.play();
      });
    }

    // ECG: show only for animated heart
    ecgActive = !!model.animated;
    ecgCanvas.classList.toggle('hidden', !ecgActive);
    if (ecgActive) {
      resizeECG();
      ecgPhase = 0;
    }

    // Camera
    tweenCameraTo(model.cam);

    // UI
    infoTitle.textContent = model.name;
    infoDesc.textContent = model.desc;
    chapterInd.textContent = section.title;
    renderNav(section.id);
    renderActions(model.actions);

  } catch (err) {
    console.error('Errore caricamento:', err);
  }

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
const btnFocus = document.getElementById('btn-focus');
const iconOpen = document.getElementById('icon-eye-open');
const iconClosed = document.getElementById('icon-eye-closed');

btnFocus.addEventListener('click', () => {
  const hidden = infoCard.classList.toggle('text-hidden');
  iconOpen.style.display = hidden ? 'none' : 'block';
  iconClosed.style.display = hidden ? 'block' : 'none';
  btnFocus.classList.toggle('active', hidden);
});

const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('active', controls.autoRotate);
});

const btnReset = document.getElementById('btn-reset');
btnReset.addEventListener('click', () => {
  if (currentModelId) {
    const d = findModel(currentModelId);
    if (d) tweenCameraTo(d.model.cam, 600);
  }
  controls.autoRotate = false;
  btnRotate.classList.remove('active');
});

/* ─── RESIZE ───────────────────────────────────────────────────── */
function onResize() {
  const w = viewer.clientWidth, h = viewer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (ecgActive) resizeECG();
}
window.addEventListener('resize', onResize);

/* ─── RENDER LOOP ──────────────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  controls.update();

  // Animation mixer
  if (mixer) mixer.update(dt);

  // Gentle float (no float if animated)
  if (currentModel && !mixer) {
    currentModel.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.04;
  }

  // ECG
  if (ecgActive) drawECG(dt);

  renderer.render(scene, camera);
}

/* ─── BOOT ─────────────────────────────────────────────────────── */
onResize();
loadModel(SECTIONS[0].models[0].id);
animate();
