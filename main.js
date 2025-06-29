
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as TWEEN from 'tween';

const images = [
  'AIDA_MULUNEH_I-IN-THE-OTHER_2017.jpg',
  'AIDA_MULUNEH_BOTH-SIDES_2017.jpg',
  'THE-DEW-AT-DAWN_19_AIDA_MULUNEH_FN_60X80-scaled.jpg',
  'AIDA-MULUNEH_The-barriers-within_2021-scaled.jpg',
  'AIDA_MULUNEH_EVERYBODY-KNOWS-ABOUT-MISSISSIPPI_2017.jpg',
  'This-is-Where-I-am-Cover.jpg'
];

const titles = [
  'I IN THE OTHER',
  'BOTH SIDES',
  'THE DEW AT DAWN',
  'The-barriers',
  'EVERYBODY KNOWS ABOUT MISSISSIPPI',
  'This is Where I am Cover'
];

const artists = [
  'Aida Muluneh',
  'Aida Muluneh',
  'Aida Muluneh',
  'Aida Muluneh',
  'Aida Muluneh',
  'Aida Muluneh',
];

/**
 * Scene setup: creates the main Three.js scene and adds fog for depth
 */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 50);

/**
 * Camera setup: perspective camera positioned to view the gallery
 */
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 4); // Position camera in front of the first painting

/**
 * Renderer setup: configures WebGLRenderer, tone mapping, shadows, and attaches to DOM
 */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0x000000, 1); // pure black background

/**
 * OrbitControls: enables camera orbit, pan, and damping for smooth user control
 */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.enablePan = true;
controls.minDistance = 3;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2;

/**
 * Post-processing: sets up EffectComposer with render, bloom, and output passes
 */
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.7,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

/**
 * Lighting: adds ambient, directional, spot, point, fill, and hemisphere lights for realistic illumination
 */
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

const spotlight = new THREE.SpotLight(0xffffff, 1.2, 15, Math.PI / 6, 0.5);
spotlight.position.set(0, 8, 0);
spotlight.target.position.set(0, 0, -4);
spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
scene.add(spotlight);
scene.add(spotlight.target);

const pointLight = new THREE.PointLight(0x4444ff, 0.7, 10);
pointLight.position.set(-5, 3, 5);
scene.add(pointLight);

// Add a soft fill point light on the right
const fillLight = new THREE.PointLight(0xffffff, 0.7, 20);
fillLight.position.set(7, 4, 4);
scene.add(fillLight);

// Add a soft hemisphere light for even fill
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.4);
scene.add(hemiLight);

/**
 * Texture loading: prepares loader for artwork and navigation arrow textures
 */
const textureLoader = new THREE.TextureLoader();
const leftArrowImage = textureLoader.load(`left.png`);
const rightArrowImage = textureLoader.load(`right.png`);

/**
 * Gallery root: parent Object3D for all gallery elements
 */
const root = new THREE.Object3D();
scene.add(root);

const count = 6;
const galleryObjects = [];
const artworkSpotlights = [];

/**
 * Gallery object creation: for each painting, create frame, artwork, navigation arrows, and individual spotlight
 * - Arranges paintings in a circle
 * - Adds each to the root object
 */
for (let i = 0; i < count; i++) {
  // Debug: log image path
  console.log('Loading image:', images[i]);
  const image = textureLoader.load(images[i], (tex) => {
    console.log('Loaded texture:', images[i], tex);
  });

  const baseNode = new THREE.Object3D();
  baseNode.rotation.y = 2 * Math.PI * (i / count);

  // Frame: thinner, gray for debug
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 3.2, 0.01),
    new THREE.MeshStandardMaterial({ 
      color: 0x888888, // gray for debug
      metalness: 0.7,
      roughness: 0.4
    })
  );
  border.position.z = -4;
  border.castShadow = true;
  border.receiveShadow = true;
  baseNode.add(border);

  // Artwork: smaller, further in front, fully diffuse
  const artworkMaterial = new THREE.MeshStandardMaterial({ 
    map: image,
    metalness: 0.0,
    roughness: 1.0
  });

  const artwork = new THREE.Mesh(
    new THREE.BoxGeometry(3.0 - 0.04, 3.0 - 0.04, 0.008), // slightly smaller than frame
    artworkMaterial
  );
  artwork.position.z = -3.97; // further in front of the frame
  artwork.castShadow = true;
  artwork.receiveShadow = true;
  baseNode.add(artwork);

  const leftArrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.01),
    new THREE.MeshStandardMaterial({ 
      map: leftArrowImage, 
      transparent: true,
      metalness: 0.8,
      roughness: 0.2,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.7
    })
  );
  leftArrow.name = 'left';
  leftArrow.userData = i;
  leftArrow.position.set(2.9, 0, -3.9); // original position for 3:2 frame
  leftArrow.castShadow = true;
  baseNode.add(leftArrow);

  const rightArrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.01),
    new THREE.MeshStandardMaterial({ 
      map: rightArrowImage, 
      transparent: true,
      metalness: 0.8,
      roughness: 0.2,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.7
    })
  );
  rightArrow.name = 'right';
  rightArrow.userData = i;
  rightArrow.position.set(-2.9, 0, -3.9); // original position for 3:2 frame
  rightArrow.castShadow = true;
  baseNode.add(rightArrow);

  // Add individual spotlight for each artwork
  const artworkSpotlight = new THREE.SpotLight(0xffffff, 2.5, 12, Math.PI / 6, 0.2);
  artworkSpotlight.position.set(0, 4, -1); // Always the same relative position
  artworkSpotlight.target.position.set(0, 0, -4); // Always the same target
  artworkSpotlight.castShadow = true;
  artworkSpotlight.shadow.mapSize.width = 512;
  artworkSpotlight.shadow.mapSize.height = 512;
  artworkSpotlight.shadow.camera.near = 0.1;
  artworkSpotlight.shadow.camera.far = 10;
  baseNode.add(artworkSpotlight);
  baseNode.add(artworkSpotlight.target);
  artworkSpotlights.push(artworkSpotlight);

  galleryObjects.push(baseNode);
  root.add(baseNode);
}

/**
 * Mirror setup: adds a reflective floor using Three.js Reflector
 */
const mirror = new Reflector(
  new THREE.CircleGeometry(40, 64),
  {
    color: 0x505050,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
  }
);

mirror.position.set(0, -1.1, 0);
mirror.rotateX(-Math.PI / 2);
mirror.receiveShadow = true;
scene.add(mirror);

/**
 * Interaction state: variables for drag, rotation, and auto-rotate logic
 */
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let currentRotation = 0;
let targetRotation = 0;
let dragThreshold = 50; // Minimum drag distance to trigger rotation
let lastDragDirection = 0; // Track drag direction

// Auto-rotate logic
let autoRotate = false;
let autoRotateInterval = null;

/**
 * setAutoRotate: enables/disables auto-rotation of the gallery
 * @param {boolean} enabled
 */
function setAutoRotate(enabled) {
  autoRotate = enabled;
  const btn = document.getElementById('auto-rotate-btn');
  if (autoRotate) {
    btn.textContent = 'Auto-Rotate: On';
    autoRotateInterval = setInterval(() => {
      targetRotation -= (2 * Math.PI) / count;
      updateTitleAndArtist();
    }, 3000);
  } else {
    btn.textContent = 'Auto-Rotate: Off';
    if (autoRotateInterval) clearInterval(autoRotateInterval);
  }
}

document.getElementById('auto-rotate-btn').onclick = function() {
  setAutoRotate(!autoRotate);
};

// If user interacts, stop auto-rotate
['mousedown', 'touchstart', 'keydown', 'wheel'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (autoRotate) setAutoRotate(false);
  });
});

/**
 * updateTitleAndArtist: updates UI with the current painting's title and artist based on gallery rotation
 */
function updateTitleAndArtist() {
  const normalizedRotation = ((root.rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.round((normalizedRotation / (2 * Math.PI)) * count) % count;
  
  const titleElement = document.getElementById('title');
  const artistElement = document.getElementById('artist');
  
  titleElement.innerText = titles[index];
  artistElement.innerText = artists[index];
}

/**
 * animate: main render loop
 * - Updates controls, TWEEN animations, gallery rotation, and lighting
 * - Renders the scene with post-processing
 */
function animate() {
  requestAnimationFrame(animate);
  
  TWEEN.update();
  controls.update();
  
  // Smooth rotation for drag interaction
  if (!isDragging) {
    const previousRotation = root.rotation.y;
    root.rotation.y += (targetRotation - root.rotation.y) * 0.05;
    
    // Update title and artist when rotation changes significantly
    if (Math.abs(root.rotation.y - previousRotation) > 0.01) {
      updateTitleAndArtist();
    }
  }
  
  // Animate point light
  const time = Date.now() * 0.001;
  pointLight.position.x = Math.sin(time) * 5;
  pointLight.position.z = Math.cos(time) * 5;
  pointLight.color.setHSL((Math.sin(time * 0.2) + 1) / 2, 0.5, 0.7);
  
  // Animate individual artwork spotlights
  artworkSpotlights.forEach((spotlight, index) => {
    spotlight.intensity = 2.5;
  });
  
  composer.render();
}

/**
 * rotateGallery: animates gallery rotation and fades UI during transition
 * @param {number} index - Index of the painting
 * @param {number} direction - Direction of rotation (+1 or -1)
 */
function rotateGallery(index, direction) {
  const newRotationY = root.rotation.y + (direction * 2 * Math.PI) / count;
  targetRotation = newRotationY;

  const titleElement = document.getElementById('title');
  const artistElement = document.getElementById('artist');

  new TWEEN.Tween({})
    .to({}, 1500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()
    .onStart(() => {
      titleElement.style.opacity = 0;
      artistElement.style.opacity = 0;
    })
    .onComplete(() => {
      updateTitleAndArtist();
      titleElement.style.opacity = 1;
      artistElement.style.opacity = 1;
    });
}

/**
 * Mouse wheel: rotates gallery based on scroll
 */
window.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  targetRotation += ev.deltaY * 0.0001;
  updateTitleAndArtist();
});

/**
 * Mouse drag: rotates gallery when dragging with Shift key held
 */
window.addEventListener('mousedown', (ev) => {
  if (ev.button === 0 && ev.shiftKey) {
    isDragging = true;
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    controls.enabled = false;
    lastDragDirection = 0;
  }
});

window.addEventListener('mousemove', (ev) => {
  if (isDragging) {
    const deltaX = ev.clientX - dragStartX;
    
    // Check if drag distance exceeds threshold
    if (Math.abs(deltaX) > dragThreshold) {
      const direction = deltaX > 0 ? -1 : 1; // Negative for right drag, positive for left drag
      
      // Only trigger rotation if direction changed or it's the first significant drag
      if (lastDragDirection !== direction) {
        targetRotation += direction * (2 * Math.PI) / count;
        lastDragDirection = direction;
        dragStartX = ev.clientX; // Reset start position for next increment
        updateTitleAndArtist();
      }
    }
  }
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  controls.enabled = true;
});

/**
 * Touch events: enables drag-to-rotate on mobile
 */
window.addEventListener('touchstart', (ev) => {
  isDragging = true;
  dragStartX = ev.touches[0].clientX;
  dragStartY = ev.touches[0].clientY;
  controls.enabled = false;
  lastDragDirection = 0;
});

window.addEventListener('touchmove', (ev) => {
  if (isDragging) {
    ev.preventDefault();
    const deltaX = ev.touches[0].clientX - dragStartX;
    
    // Check if drag distance exceeds threshold
    if (Math.abs(deltaX) > dragThreshold) {
      const direction = deltaX > 0 ? -1 : 1; // Negative for right drag, positive for left drag
      
      // Only trigger rotation if direction changed or it's the first significant drag
      if (lastDragDirection !== direction) {
        targetRotation += direction * (2 * Math.PI) / count;
        lastDragDirection = direction;
        dragStartX = ev.touches[0].clientX; // Reset start position for next increment
        updateTitleAndArtist();
      }
    }
  }
});

window.addEventListener('touchend', () => {
  isDragging = false;
  controls.enabled = true;
});

/**
 * Click interaction: uses raycaster to detect arrow clicks for navigation
 */
window.addEventListener('click', (ev) => {
  if (isDragging) return; // Prevent click during drag
  
  const mouse = new THREE.Vector2();
  mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Only check for arrow meshes
  const arrowMeshes = [];
  root.children.forEach(baseNode => {
    baseNode.children.forEach(child => {
      if (child.name === 'left' || child.name === 'right') {
        arrowMeshes.push(child);
      }
    });
  });
  const intersects = raycaster.intersectObjects(arrowMeshes, true);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const index = clickedObject.userData;

    if (clickedObject.name === 'left' || clickedObject.name === 'right') {
      const direction = clickedObject.name === 'left' ? -1 : 1;
      rotateGallery(index, direction);
    }
  }
});

/**
 * Keyboard controls: left/right arrows to rotate, space to reset camera, 'r' for random rotation
 */
window.addEventListener('keydown', (ev) => {
  switch (ev.key) {
    case 'ArrowLeft':
      ev.preventDefault();
      targetRotation += (2 * Math.PI) / count;
      updateTitleAndArtist();
      break;
    case 'ArrowRight':
      ev.preventDefault();
      targetRotation -= (2 * Math.PI) / count;
      updateTitleAndArtist();
      break;
    case ' ':
      ev.preventDefault();
      // Reset camera position
      new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 1, z: 4 }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
      break;
    case 'r':
      ev.preventDefault();
      // Random rotation
      targetRotation = Math.random() * Math.PI * 2;
      updateTitleAndArtist();
      break;
  }
});

/**
 * Window resize: keeps camera, renderer, composer, and mirror responsive
 */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

  mirror.getRenderTarget().setSize(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio
  );
});

/**
 * UI initialization: sets initial title and artist
 */
document.getElementById('title').innerText = titles[0];
document.getElementById('artist').innerText = artists[0];

// Start animation
animate();

/**
 * Tooltip and hover logic: highlights frame, shows tooltip, and pops up painting on hover
 */
let highlightedBorder = null;
let originalBorderColor = null;
let tooltip = document.getElementById('tooltip');
let lastHighlightedArtwork = null;

window.addEventListener('mousemove', (ev) => {
  const mouse = new THREE.Vector2();
  mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Collect all border meshes and artwork meshes
  const borderMeshes = [];
  const artworkMeshes = [];
  root.children.forEach((baseNode, idx) => {
    baseNode.children.forEach(child => {
      if (child.geometry && child.geometry.type === 'BoxGeometry' && child.material && child.material.color && child.geometry.parameters.depth === 0.01) {
        borderMeshes.push({ mesh: child, index: idx, baseNode });
      }
      // Find artwork mesh by size (smaller than frame)
      if (child.geometry && child.geometry.type === 'BoxGeometry' && child.material && child.material.map && child.geometry.parameters.width < 3.2) {
        artworkMeshes.push({ mesh: child, index: idx, baseNode });
      }
    });
  });

  const intersects = raycaster.intersectObjects(borderMeshes.map(b => b.mesh), false);

  if (intersects.length > 0) {
    const border = intersects[0].object;
    const borderObj = borderMeshes.find(b => b.mesh === border);
    if (highlightedBorder !== border) {
      // Remove highlight from previous
      if (highlightedBorder && originalBorderColor) {
        highlightedBorder.material.color.set(originalBorderColor);
      }
      // Highlight new
      originalBorderColor = border.material.color.getHex();
      border.material.color.set(0xffff00); // Yellow highlight
      highlightedBorder = border;
    }
    // Show tooltip
    tooltip.style.display = 'block';
    tooltip.innerHTML = `<b>${titles[borderObj.index]}</b><br><i>${artists[borderObj.index]}</i>`;
    tooltip.style.left = (ev.clientX + 18) + 'px';
    tooltip.style.top = (ev.clientY + 18) + 'px';

    // Pop up the painting (scale and move forward)
    const artworkObj = artworkMeshes.find(a => a.index === borderObj.index);
    if (artworkObj && lastHighlightedArtwork !== artworkObj.mesh) {
      // Reset previous
      if (lastHighlightedArtwork) {
        lastHighlightedArtwork.scale.set(1, 1, 1);
        lastHighlightedArtwork.position.z = -3.97;
        lastHighlightedArtwork.material.emissive.set(0x000000);
      }
      // Animate pop up
      artworkObj.mesh.scale.set(1.04, 1.04, 1.04);
      artworkObj.mesh.position.z = -3.93;
      artworkObj.mesh.material.emissive.set(0x333300); // much softer glow
      lastHighlightedArtwork = artworkObj.mesh;
    }
  } else {
    // Remove highlight if not hovering any
    if (highlightedBorder && originalBorderColor) {
      highlightedBorder.material.color.set(originalBorderColor);
      highlightedBorder = null;
      originalBorderColor = null;
    }
    tooltip.style.display = 'none';
    // Reset pop up
    if (lastHighlightedArtwork) {
      lastHighlightedArtwork.scale.set(1, 1, 1);
      lastHighlightedArtwork.position.z = -3.97;
      lastHighlightedArtwork.material.emissive.set(0x000000);
      lastHighlightedArtwork = null;
    }
  }
});

/**
 * Custom drag-to-move: allows free camera movement with Shift+drag
 */
let isCustomDragging = false;
let lastDragX = 0;
let lastDragY = 0;

window.addEventListener('mousedown', (ev) => {
  if (ev.button === 0 && ev.shiftKey) {
    isCustomDragging = true;
    lastDragX = ev.clientX;
    lastDragY = ev.clientY;
    controls.enabled = false;
  }
});

window.addEventListener('mousemove', (ev) => {
  if (isCustomDragging) {
    const deltaX = ev.clientX - lastDragX;
    const deltaY = ev.clientY - lastDragY;
    // Move camera in local X/Y plane
    const moveSpeed = 0.01;
    camera.position.x -= deltaX * moveSpeed;
    camera.position.y += deltaY * moveSpeed;
    lastDragX = ev.clientX;
    lastDragY = ev.clientY;
  }
});

window.addEventListener('mouseup', (ev) => {
  if (isCustomDragging) {
    isCustomDragging = false;
    controls.enabled = true;
  }
});