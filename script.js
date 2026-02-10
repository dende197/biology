/* ================================================================
   PRESENTAZIONE 3D BIOLOGIA — LOGICA APP (v7 Apple Pro)
   GSAP Animation, Cinematic Intro, Advanced Interaction
   ================================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// GSAP è caricato da CDN in index.html (window.gsap)
const tl = gsap.timeline();

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
const loaderBar = document.getElementById('loader-bar');
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for perf
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9; // Cinematic dark mood
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); // 35mm lens effect (more cinematic)
camera.position.set(0, 0, 10);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 20;

// Lighting Setup (Dramatic)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x44aaff, 1.5); // Blue rim light
rimLight.position.set(-5, 2, -5);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 0, 5);
scene.add(fillLight);

// ─── GLTF LOADER ─────────────────────────────────────────────────
const loader = new GLTFLoader();
let currentModel = null;
let currentSection = null;

function wrapModel(gltf) {
  const root = gltf.scene || gltf.scenes[0];
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box.getCenter(center);

  root.position.sub(center); // Center geometry

  const wrapper = new THREE.Group();
  wrapper.add(root);

  // Normalize scale implies size ~3 units?
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = 4.0 / maxDim;
  wrapper.scale.setScalar(scaleFactor);

  // Material/Shadow fix
  root.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      c.material.depthWrite = true;
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

  // UI Updates (GSAP Out)
  gsap.to([infoTitle, infoDesc], { opacity: 0, y: -20, duration: 0.3 });

  // Loader Update
  gsap.to(loaderBar, { width: '30%', duration: 0.5 });

  if (currentModel) {
    gsap.to(currentModel.scale, {
      x: 0, y: 0, z: 0, duration: 0.4, ease: 'back.in(1.7)', onComplete: () => {
        scene.remove(currentModel);
      }
    });
  }

  try {
    const gltf = await new Promise((resolve, reject) => {
      loader.load(model.file, resolve, (xhr) => {
        if (xhr.total) {
          const pct = (xhr.loaded / xhr.total) * 100;
          gsap.to(loaderBar, { width: pct + '%', duration: 0.2 });
        }
      }, reject);
    });

    const wrapper = wrapModel(gltf);
    currentModel = wrapper;
    scene.add(wrapper);

    // Animate In (Elastic pop)
    wrapper.scale.set(0, 0, 0);
    gsap.to(wrapper.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)', delay: 0.2 });

    // Camera Move
    gsap.to(camera.position, {
      x: model.cam[0], y: model.cam[1], z: model.cam[2],
      duration: 1.5, ease: 'power3.inOut'
    });

    // UI Updates (Content)
    infoTitle.textContent = model.name;
    infoDesc.textContent = model.desc;
    chapterInd.textContent = section.title;

    updateNav(section.id);
    updateActions(model.actions);

    // UI Animate In
    gsap.to(loaderBar, { width: '0%', duration: 0.5, delay: 0.5 });
    gsap.to([infoTitle, infoDesc], { opacity: 1, y: 0, duration: 0.6, delay: 0.4, stagger: 0.1 });

  } catch (err) {
    console.error(err);
  }
}

// ─── UTILS ───────────────────────────────────────────────────────
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
    btn.innerHTML = `<span>${act.label}</span> <span>${act.icon}</span>`;
    btn.onclick = () => loadModel(act.target);

    // Staggered entrance
    gsap.fromTo(btn, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, delay: 0.6 + (i * 0.1) });
    contextStack.appendChild(btn);
  });
}

// Focus Mode Logic (Hide Texts Only)
let isFocus = false;
document.getElementById('btn-toggle-ui').addEventListener('click', (e) => {
  isFocus = !isFocus;
  const btn = e.currentTarget;

  if (isFocus) {
    uiLayer.classList.add('ui-hidden');
    btn.classList.add('active');
  } else {
    uiLayer.classList.remove('ui-hidden');
    btn.classList.remove('active');
  }
});

// Intro Sequence
function playIntro() {
  const introTl = gsap.timeline();

  introTl.to('.intro-title', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
    .to('.intro-subtitle', { opacity: 1, y: 0, duration: 1 }, '-=0.5')
    .to('.intro-overlay', { opacity: 0, duration: 1, delay: 1, pointerEvents: 'none' })
    .add(() => loadModel(SECTIONS[0].models[0].id), '-=0.5'); // Start loading heart
}

// ─── RENDER LOOP ─────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  controls.update();

  if (currentModel) {
    currentModel.rotation.y = Math.sin(t * 0.2) * 0.1; // Very subtle breathing rotation
    currentModel.position.y = Math.sin(t * 1) * 0.05; // Float
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// START
animate();
playIntro();
