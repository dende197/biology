/* ================================================================
   BIOLOGIA 3D — ENGINE v17 (Bulletproof)
   Fixes:
   - v13: renderer.setSize() + camera.aspect on init
   - v16: No Object.assign on readonly Three.js properties
   - v17: Defensive wrapModel, safer init, loader always hides
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
        desc: 'Il ponte chimico tra i neuroni. Qui il segnale elettrico diventa neurotrasmettitore.',
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
        desc: 'Il centro di comando. Comprende cervello, cervelletto e tronco encefalico.',
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
        desc: 'Il cuore umano in battito continuo. Osserva la contrazione ritmica del miocardio.',
        cam: [0, 1.5, 6],
        animated: true,
        actions: [{ label: 'Modello Anatomico', target: 'heart_model', icon: '❤️' }]
      },
      {
        id: 'heart_model',
        file: 'models/human_heart_3d_model.glb',
        name: 'Cuore — Anatomia',
        desc: 'Modello anatomico dettagliato. Ventricoli, atri, valvole e grandi vasi.',
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

/* ─── LIGHTING (safe — no Object.assign) ───────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.65));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x667fff, 0.5);
rimLight.position.set(-5, 4, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
fillLight.position.set(-2, 0, 6);
scene.add(fillLight);

scene.add(new THREE.HemisphereLight(0xeef0ff, 0x222233, 0.35));

/* ─── GLTF LOADER ──────────────────────────────────────────────── */
const gltfLoader = new GLTFLoader();
let currentModel = null;
let currentModelId = null;
let mixer = null;
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

  // Enhance textures (defensive — inside try/catch per mesh)
  const maxAniso = renderer.capabilities.maxAnisotropy;
  root.traverse(child => {
    if (!child.isMesh) return;
    try {
      child.castShadow = true;
      child.receiveShadow = true;
      const mat = child.material;
      if (mat && mat.map && mat.map.anisotropy !== undefined) {
        mat.map.anisotropy = maxAniso;
      }
      if (mat && mat.normalMap && mat.normalMap.anisotropy !== undefined) {
        mat.normalMap.anisotropy = maxAniso;
      }
    } catch (e) {
      // Skip problematic meshes silently
    }
  });

  return wrapper;
}

/* ─── CAMERA TWEEN ─────────────────────────────────────────────── */
let tweenRaf = null;

function tweenCameraTo(target, duration) {
  duration = duration || 900;
  if (tweenRaf) cancelAnimationFrame(tweenRaf);
  const s = camera.position.clone();
  const e = new THREE.Vector3(target[0], target[1], target[2]);
  const t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    camera.position.lerpVectors(s, e, ease);
    if (p < 1) tweenRaf = requestAnimationFrame(step);
    else tweenRaf = null;
  }
  tweenRaf = requestAnimationFrame(step);
}

/* ─── ECG WAVEFORM ─────────────────────────────────────────────── */
let ecgX = 0;
let ecgPhase = 0;
const ECG_SPEED = 2.5;
const ECG_BPM = 72;
const ECG_PERIOD = 60 / ECG_BPM;

function ecgValue(t) {
  if (t < 0.10) return 0.15 * Math.sin(Math.PI * (t / 0.10));
  if (t < 0.16) return 0;
  if (t < 0.20) return -0.15 * Math.sin(Math.PI * ((t - 0.16) / 0.04));
  if (t < 0.28) return 1.0 * Math.sin(Math.PI * ((t - 0.20) / 0.08));
  if (t < 0.34) return -0.25 * Math.sin(Math.PI * ((t - 0.28) / 0.06));
  if (t < 0.45) return 0.02;
  if (t < 0.65) return 0.25 * Math.sin(Math.PI * ((t - 0.45) / 0.20));
  return 0;
}

function resizeECG() {
  var dpr = window.devicePixelRatio || 1;
  var w = ecgCanvas.parentElement.clientWidth;
  var h = 140;
  ecgCanvas.width = w * dpr;
  ecgCanvas.height = h * dpr;
  ecgCanvas.style.width = w + 'px';
  ecgCanvas.style.height = h + 'px';
  ecgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ecgX = 0;
}

function drawECG(dt) {
  if (!ecgActive) return;
  var w = ecgCanvas.clientWidth;
  var h = ecgCanvas.clientHeight;
  var midY = h * 0.5;
  var ampY = h * 0.35;

  ecgPhase += dt / ECG_PERIOD;
  if (ecgPhase > 1) ecgPhase -= 1;

  // Clear strip ahead
  var dpr = window.devicePixelRatio || 1;
  ecgCtx.save();
  ecgCtx.setTransform(1, 0, 0, 1, 0, 0);
  ecgCtx.clearRect(ecgX * dpr, 0, 40 * dpr, ecgCanvas.height);
  ecgCtx.restore();

  var val = ecgValue(ecgPhase);
  var y = midY - val * ampY;

  ecgCtx.strokeStyle = '#ff3b30';
  ecgCtx.lineWidth = 2;
  ecgCtx.shadowColor = 'rgba(255, 59, 48, 0.6)';
  ecgCtx.shadowBlur = 8;
  ecgCtx.beginPath();
  ecgCtx.moveTo(ecgX, y);

  ecgX += ECG_SPEED;
  if (ecgX > w) ecgX = 0;

  var nextPhase = (ecgPhase + 0.005) % 1;
  var nextY = midY - ecgValue(nextPhase) * ampY;
  ecgCtx.lineTo(ecgX, nextY);
  ecgCtx.stroke();
}

/* ─── LOAD MODEL ───────────────────────────────────────────────── */
function findModel(id) {
  for (var i = 0; i < SECTIONS.length; i++) {
    var sec = SECTIONS[i];
    for (var j = 0; j < sec.models.length; j++) {
      if (sec.models[j].id === id) return { model: sec.models[j], section: sec };
    }
  }
  return null;
}

async function loadModel(id) {
  if (id === currentModelId) return;
  var data = findModel(id);
  if (!data) return;
  var model = data.model;
  var section = data.section;

  loaderOverlay.classList.remove('hidden');

  // Clean up previous
  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }
  if (mixer) {
    mixer.stopAllAction();
    mixer = null;
  }

  try {
    var gltf = await new Promise(function (resolve, reject) {
      gltfLoader.load(model.file, resolve, undefined, reject);
    });

    var wrapper = wrapModel(gltf);
    currentModel = wrapper;
    currentModelId = id;
    scene.add(wrapper);

    // Setup animation if model has clips
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(wrapper);
      for (var k = 0; k < gltf.animations.length; k++) {
        mixer.clipAction(gltf.animations[k]).play();
      }
    }

    // ECG
    ecgActive = !!model.animated;
    if (ecgActive) {
      ecgCanvas.classList.remove('hidden');
      resizeECG();
      ecgPhase = 0;
    } else {
      ecgCanvas.classList.add('hidden');
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
    console.error('Errore caricamento modello:', err);
  }

  // ALWAYS hide loader (even on error)
  loaderOverlay.classList.add('hidden');
}

/* ─── NAV & ACTIONS ────────────────────────────────────────────── */
function renderNav(activeSectionId) {
  navBar.innerHTML = '';
  for (var i = 0; i < SECTIONS.length; i++) {
    var sec = SECTIONS[i];
    var btn = document.createElement('button');
    btn.className = 'nav-btn';
    if (sec.id === activeSectionId) btn.className += ' active';
    btn.textContent = sec.title;
    btn.setAttribute('data-section', sec.id);
    btn.setAttribute('data-first-model', sec.models[0].id);
    navBar.appendChild(btn);
  }
}

// Use event delegation for nav (more reliable)
navBar.addEventListener('click', function (e) {
  var btn = e.target.closest('.nav-btn');
  if (!btn) return;
  var modelId = btn.getAttribute('data-first-model');
  if (modelId) loadModel(modelId);
});

function renderActions(actions) {
  actionRow.innerHTML = '';
  if (!actions || actions.length === 0) return;
  for (var i = 0; i < actions.length; i++) {
    var act = actions[i];
    var btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.textContent = act.label + (act.icon ? ' ' + act.icon : '');
    btn.setAttribute('data-target', act.target);
    actionRow.appendChild(btn);
  }
}

// Event delegation for actions
actionRow.addEventListener('click', function (e) {
  var btn = e.target.closest('.action-btn');
  if (!btn) return;
  var target = btn.getAttribute('data-target');
  if (target) loadModel(target);
});

/* ─── BUTTON HANDLERS ──────────────────────────────────────────── */
var btnFocus = document.getElementById('btn-focus');
var iconOpen = document.getElementById('icon-eye-open');
var iconClosed = document.getElementById('icon-eye-closed');

if (btnFocus) {
  btnFocus.addEventListener('click', function () {
    var hidden = infoCard.classList.toggle('text-hidden');
    iconOpen.style.display = hidden ? 'none' : 'block';
    iconClosed.style.display = hidden ? 'block' : 'none';
    btnFocus.classList.toggle('active', hidden);
  });
}

var btnRotate = document.getElementById('btn-rotate');
if (btnRotate) {
  btnRotate.addEventListener('click', function () {
    controls.autoRotate = !controls.autoRotate;
    btnRotate.classList.toggle('active', controls.autoRotate);
  });
}

var btnReset = document.getElementById('btn-reset');
if (btnReset) {
  btnReset.addEventListener('click', function () {
    if (currentModelId) {
      var d = findModel(currentModelId);
      if (d) tweenCameraTo(d.model.cam, 600);
    }
    controls.autoRotate = false;
    if (btnRotate) btnRotate.classList.remove('active');
  });
}

/* ─── RESIZE ───────────────────────────────────────────────────── */
function onResize() {
  var w = viewer.clientWidth;
  var h = viewer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (ecgActive) resizeECG();
}
window.addEventListener('resize', onResize);

/* ─── RENDER LOOP ──────────────────────────────────────────────── */
var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  var dt = clock.getDelta();
  controls.update();

  if (mixer) mixer.update(dt);

  // Gentle float (skip for animated models)
  if (currentModel && !mixer) {
    currentModel.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.04;
  }

  if (ecgActive) drawECG(dt);
  renderer.render(scene, camera);
}

/* ─── BOOT ─────────────────────────────────────────────────────── */
onResize();
loadModel(SECTIONS[0].models[0].id);
animate();
