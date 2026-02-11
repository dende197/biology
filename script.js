/* ================================================================
   BIOLOGIA 3D — ENGINE v18 (Video + Artificial Heart)
   - Removed ECG
   - Added Artificial Heart model
   - Added Video Overlay support
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
        actions: [{ type: 'model', label: 'Esamina Sinapsi', target: 'synapse', icon: '⚡' }]
      },
      {
        id: 'synapse',
        file: 'models/result.glb',
        name: 'Sinapsi',
        desc: 'Il ponte chimico tra i neuroni. Qui il segnale elettrico diventa neurotrasmettitore.',
        cam: [0, 2, 7],
        actions: [{ type: 'model', label: 'Torna al Neurone', target: 'neuron', icon: '↩️' }]
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
          { type: 'model', label: 'Midollo Spinale', target: 'spinal', icon: '🦴' },
          { type: 'model', label: 'Cervelletto', target: 'cerebellum', icon: '🧠' }
        ]
      },
      {
        id: 'spinal',
        file: 'models/result-3.glb',
        name: 'Midollo Spinale',
        desc: 'L\'autostrada delle informazioni sensoriali e motorie tra cervello e periferia.',
        cam: [0, 2, 7],
        actions: [{ type: 'model', label: 'Torna all\'Encefalo', target: 'brain', icon: '↩️' }]
      },
      {
        id: 'cerebellum',
        file: 'models/cerebellum-2.glb',
        name: 'Cervelletto',
        desc: 'Il maestro della coordinazione motoria e dell\'equilibrio posturale.',
        cam: [0, 1.5, 6],
        actions: [{ type: 'model', label: 'Torna all\'Encefalo', target: 'brain', icon: '↩️' }]
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
        actions: [{ type: 'model', label: 'Modello Anatomico', target: 'heart_model', icon: '❤️' }]
      },
      {
        id: 'heart_model',
        file: 'models/human_heart_3d_model.glb',
        name: 'Cuore — Anatomia',
        desc: 'Modello anatomico dettagliato. Ventricoli, atri, valvole e grandi vasi.',
        cam: [0, 1.5, 6],
        showVideo: true,
        actions: [
          { type: 'model', label: 'Cuore Animato', target: 'heart_anim', icon: '💓' },
          { type: 'model', label: 'Cuore Artificiale', target: 'heart_artificial', icon: '⚙️' }
        ]
      },
      {
        id: 'heart_artificial',
        file: 'models/cuoreartificiale.glb',
        name: 'Cuore Artificiale',
        desc: 'Dispositivo meccanico progettato per sostituire le funzioni di pompaggio del cuore biologico.',
        cam: [0, 1.5, 6],
        actions: [{ type: 'model', label: 'Torna all\'Anatomia', target: 'heart_model', icon: '↩️' }]
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

// Video Panel DOM
const videoPanel = document.getElementById('video-panel');
const videoPlayer = document.getElementById('video-player');
const btnCloseVideo = document.getElementById('btn-close-video');
let videoPanelDismissed = false; // user closed it manually

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

  // Enhance textures (defensive)
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
    } catch (e) { }
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

/* ─── VIDEO PANEL LOGIC ────────────────────────────────────────── */
function showVideoPanel() {
  if (!videoPanel) return;
  videoPanelDismissed = false;
  videoPanel.classList.remove('hidden');
}

function hideVideoPanel() {
  if (!videoPanel || !videoPlayer) return;
  videoPanel.classList.add('hidden');
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
}

if (btnCloseVideo) {
  btnCloseVideo.addEventListener('click', function () {
    videoPanelDismissed = true;
    hideVideoPanel();
  });
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

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(wrapper);
      for (var k = 0; k < gltf.animations.length; k++) {
        mixer.clipAction(gltf.animations[k]).play();
      }
    }

    tweenCameraTo(model.cam);

    infoTitle.textContent = model.name;
    infoDesc.textContent = model.desc;
    chapterInd.textContent = section.title;
    renderNav(section.id);
    renderActions(model.actions);

    // Auto-show/hide video panel
    if (model.showVideo && !videoPanelDismissed) {
      showVideoPanel();
    } else {
      hideVideoPanel();
    }

  } catch (err) {
    console.error('Errore caricamento modello:', err);
  }

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

    // Set type and target
    btn.setAttribute('data-type', act.type || 'model'); // Default to model if undefined
    btn.setAttribute('data-target', act.target);

    actionRow.appendChild(btn);
  }
}

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
}
window.addEventListener('resize', onResize);

/* ─── RENDER LOOP ──────────────────────────────────────────────── */
var clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  var dt = clock.getDelta();
  controls.update();

  if (mixer) mixer.update(dt);

  if (currentModel && !mixer) {
    currentModel.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.04;
  }

  renderer.render(scene, camera);
}

/* ─── BOOT ─────────────────────────────────────────────────────── */
onResize();
loadModel(SECTIONS[0].models[0].id);
animate();
