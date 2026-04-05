import * as THREE from 'three';
import { OrbitControls } from 'orbitcontrols';
import Holder from 'whole';
import Measurements from 'measurements';

// ── Three.js setup ────────────────────────────────────────────────────────────
const canvas    = document.getElementById('main-canvas');
const container = document.querySelector('.canvas-container');
canvas.width    = container.getBoundingClientRect().width;
canvas.height   = container.getBoundingClientRect().height;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio);

const camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 5000);
camera.position.set(-200, 150, 380);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xededed);
scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 5, 7);
camera.add(dirLight);
scene.add(camera);

(function tick() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(tick); })();

window.addEventListener('resize', () => {
  canvas.width  = container.getBoundingClientRect().width;
  canvas.height = container.getBoundingClientRect().height;
  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.width, canvas.height, false);
});

// ── Holder & state ────────────────────────────────────────────────────────────
const holder     = new Holder();
const partNames   = ['front', 'middle', 'back', 'left', 'right', 'top', 'bottom'];
let   selectedParts = new Set(['front']);
let   fullGroup   = null;

function fitCamera(object) {
  const box  = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()).length();
  const ctr  = box.getCenter(new THREE.Vector3());
  controls.target.copy(ctr);
  camera.position.set(ctr.x - size*0.45, ctr.y + size*0.35, ctr.z + size*0.8);
  controls.update();
}

function rebuild() {
  // Remove old
  if (fullGroup) {
    scene.remove(fullGroup);
    fullGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  // Build all panels
  fullGroup = holder.initialize(Measurements.measurements);
  fullGroup.rotation.y = Math.PI;
  scene.add(fullGroup);

  // Re-apply selection visibility after rebuild
  updateVisibleParts();
}

function showPart(name) {
  if (name === 'all') {
    selectedParts = new Set(partNames);
  } else if (selectedParts.has(name)) {
    // Keep at least one part visible.
    if (selectedParts.size > 1) selectedParts.delete(name);
  } else {
    selectedParts.add(name);
  }

  updateVisibleParts();
}

function updateVisibleParts() {
  Object.entries(holder.meshes).forEach(([key, mesh]) => {
    mesh.visible = selectedParts.has(key);
  });
  fitCamera(fullGroup);

  // Update button states
  document.querySelectorAll('.part-btn').forEach(btn => {
    const part = btn.dataset.part;
    const isActive = part === 'all'
      ? selectedParts.size === partNames.length
      : selectedParts.has(part);
    btn.classList.toggle('active', isActive);
  });
}

rebuild();

// ── Form ──────────────────────────────────────────────────────────────────────
const form        = document.querySelector('.form');
const typeCheckbox= document.querySelector('.type-checkbox');
const unitLabels  = document.querySelectorAll('.units');
const inputFields = document.querySelectorAll('.input-field');
const errorMsg    = document.getElementById('error-msg');
const presetList  = document.getElementById('preset-list');
const previewLink = document.getElementById('preset-preview');
const previewImg  = document.getElementById('preset-preview-image');
const previewName = document.getElementById('preset-preview-name');
const previewMeta = document.getElementById('preset-preview-meta');
const affiliateTrackTop = document.getElementById('affiliate-track-top');
const affiliateTrackBottom = document.getElementById('affiliate-track-bottom');
const canvasTabs = Array.from(document.querySelectorAll('.canvas-tab'));
const previewPanel = document.getElementById('panel-preview');
const chatPanel = document.getElementById('panel-chat');
const giscusHost = document.getElementById('giscus-thread');
const shareTrigger = document.getElementById('share-trigger');
const sharePanel = document.getElementById('share-panel');
const shareFeedback = document.getElementById('share-feedback');
const shareFacebook = document.getElementById('share-facebook');
const sharePinterest = document.getElementById('share-pinterest');
const shareX = document.getElementById('share-x');
const shareLinkedIn = document.getElementById('share-linkedin');
const shareReddit = document.getElementById('share-reddit');
const shareInstagram = document.getElementById('share-instagram');
const shareCopy = document.getElementById('share-copy');
const fallbackShareUrl = 'https://paintholdersizingtool.netlify.app/';
const fallbackShareImage = 'https://paintholdersizingtool.netlify.app/acrylic.jpg';
let   currentUnit = 'in';
let   selectedPresetId = null;
let   giscusLoaded = false;

// Configure these with your Giscus repository details.
const giscusConfig = {
  repo: 'YOUR_GITHUB_USERNAME/YOUR_REPO',
  repoId: 'YOUR_REPO_ID',
  category: 'General',
  categoryId: 'YOUR_CATEGORY_ID',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  theme: 'light',
  lang: 'en'
};

function productPlaceholder(label, bg, fg) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='220' viewBox='0 0 720 220'>
    <rect width='720' height='220' fill='${bg}'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='${fg}'
      font-family='Arial, Helvetica, sans-serif' font-size='38' font-weight='700'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const presetImageFallback = productPlaceholder('Paint', '#6a6a6a', '#ffffff');

function getSitePreviewImage(url) {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl) return presetImageFallback;
  return `https://image.thum.io/get/width/1200/noanimate/${encodeURI(cleanUrl)}`;
}

function getPresetImage(preset) {
  return (preset.image || '').trim() || getSitePreviewImage(preset.affiliateUrl);
}

const productPresets = [
  {
    id: 'apple-barrel-2oz',
    name: 'Apple Barrel Acrylic Paint (2 oz)',
    holeDiameterIn: 1.35,
    spacingIn: 1.75,
    depthIn: 3.2,
    hor: 6,
    vert: 4,
    // Add your affiliate link here when ready.
    affiliateUrl: 'https://amzn.to/4151r5m',
    image: ''
  },
  {
    id: 'folkart-2oz',
    name: 'FolkArt Acrylic Paint (2 oz)',
    holeDiameterIn: 1.35,
    spacingIn: 1.75,
    depthIn: 3.2,
    hor: 6,
    vert: 4,
    // Add your affiliate link here when ready.
    affiliateUrl: 'https://amzn.to/4uWijsx',
    image: ''
  },
  {
    id: 'americana-2oz',
    name: 'DecoArt Americana Acrylic (2 oz)',
    holeDiameterIn: 1.36,
    spacingIn: 1.78,
    depthIn: 3.3,
    hor: 6,
    vert: 4,
    // Add your affiliate link here when ready.
    affiliateUrl: 'https://amzn.to/4v3FBwA',
    image: ''
  },
  {
    id: 'pouring-8oz',
    name: 'Acrylic Pouring Paint Bottle (8 oz)',
    holeDiameterIn: 2.35,
    spacingIn: 2.85,
    depthIn: 4.6,
    hor: 5,
    vert: 3,
    // Add your affiliate link here when ready.
    affiliateUrl: 'https://amzn.to/4v3xC2y',
    image: ''
  },
  {
    id: 'craft-smart-2oz',
    name: 'Craft Smart Acrylic Paint (2 oz)',
    holeDiameterIn: 1.34,
    spacingIn: 1.72,
    depthIn: 3.2,
    hor: 6,
    vert: 4,
    // Add your affiliate link here when ready.
    affiliateUrl: 'https://amzn.to/4cfeh7k',
    image: ''
  },
  {
    id: 'rust-oleum-334020',
    name: 'Rust-Oleum 334020 Painters Touch',
    holeDiameterIn: 2.65,
    spacingIn: 3,
    depthIn: 6,
    hor: 4,
    vert: 3,
    // Add your affiliate link here when ready.
    affiliateUrl: 'https://amzn.to/4dTIc68',
    image: ''
  }  
];

function formatPresetDimension(inches) {
  return currentUnit === 'in'
    ? `${inches.toFixed(2)} in`
    : `${(inches * 25.4).toFixed(1)} mm`;
}

function setInputValueFromInches(id, inches) {
  const el = document.getElementById(id);
  el.value = currentUnit === 'in' ? inches.toFixed(2) : (inches * 25.4).toFixed(2);
}

function updatePresetPreview(preset) {
  const hasLink = Boolean((preset.affiliateUrl || '').trim());
  previewLink.href = hasLink ? preset.affiliateUrl : '#';
  previewLink.classList.toggle('disabled', !hasLink);
  previewImg.src = getPresetImage(preset);
  previewImg.onerror = () => {
    previewImg.onerror = null;
    previewImg.src = presetImageFallback;
  };
  previewName.textContent = preset.name;
  const base = `Hole ${formatPresetDimension(preset.holeDiameterIn)} · Spacing ${formatPresetDimension(preset.spacingIn)} · Depth ${formatPresetDimension(preset.depthIn)}`;
  previewMeta.textContent = hasLink ? base : `${base} · Affiliate link pending`;
}

function applyPreset(preset) {
  selectedPresetId = preset.id;
  setInputValueFromInches('hd', preset.holeDiameterIn);
  setInputValueFromInches('sp', preset.spacingIn);
  setInputValueFromInches('d', preset.depthIn);
  document.getElementById('hor').value = preset.hor;
  document.getElementById('vert').value = preset.vert;
  updatePresetPreview(preset);
  renderPresetList();
  handleInput();
}

function renderPresetList() {
  if (!presetList) return;
  presetList.innerHTML = '';
  productPresets.forEach(preset => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-item';
    if (preset.id === selectedPresetId) button.classList.add('active');
    button.setAttribute('aria-label', `${preset.name} preset`);
    const src = getPresetImage(preset);
    button.innerHTML = `<img src="${src}" alt="${preset.name}"/><div class="preset-item-copy"><strong>${preset.name}</strong><span>Hole ${formatPresetDimension(preset.holeDiameterIn)}</span></div>`;
    const img = button.querySelector('img');
    if (img) {
      img.onerror = () => {
        img.onerror = null;
        img.src = presetImageFallback;
      };
    }
    button.addEventListener('click', () => applyPreset(preset));
    presetList.appendChild(button);
  });
}

function renderAffiliateTrack(trackEl, items) {
  if (!trackEl) return;

  if (!items.length) {
    trackEl.innerHTML = '<span class="affiliate-tag">No affiliate links</span>';
    return;
  }

  const chipMarkup = items
    .map(item => `<a class="affiliate-chip" href="${item.url}" target="_blank" rel="noopener noreferrer nofollow sponsored" aria-label="Sponsored link: ${item.name}">${item.name}</a>`)
    .join('');

  const lane = `<div class="affiliate-lane"><span class="affiliate-tag" aria-hidden="true">Sponsored</span>${chipMarkup}</div>`;
  trackEl.innerHTML = `${lane}${lane}`;
}

function renderAffiliateStrips() {
  const items = productPresets
    .filter(preset => (preset.affiliateUrl || '').trim())
    .map(preset => ({ name: preset.name, url: preset.affiliateUrl }));

  renderAffiliateTrack(affiliateTrackTop, items);
  renderAffiliateTrack(affiliateTrackBottom, items);
}

function giscusIsConfigured() {
  return !Object.values(giscusConfig).some(v => String(v).includes('YOUR_'));
}

function loadGiscusIfNeeded() {
  if (giscusLoaded || !giscusHost) return;

  if (!giscusIsConfigured()) {
    giscusHost.innerHTML = '<p class="chat-note">Configure giscusConfig in js/script.js with your repo, repoId, and categoryId.</p>';
    giscusLoaded = true;
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-repo', giscusConfig.repo);
  script.setAttribute('data-repo-id', giscusConfig.repoId);
  script.setAttribute('data-category', giscusConfig.category);
  script.setAttribute('data-category-id', giscusConfig.categoryId);
  script.setAttribute('data-mapping', giscusConfig.mapping);
  script.setAttribute('data-strict', giscusConfig.strict);
  script.setAttribute('data-reactions-enabled', giscusConfig.reactionsEnabled);
  script.setAttribute('data-emit-metadata', giscusConfig.emitMetadata);
  script.setAttribute('data-input-position', giscusConfig.inputPosition);
  script.setAttribute('data-theme', giscusConfig.theme);
  script.setAttribute('data-lang', giscusConfig.lang);
  giscusHost.appendChild(script);
  giscusLoaded = true;
}

function getSharePayload() {
  const current = new URL(window.location.href);
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(current.hostname);
  const url = isLocal ? fallbackShareUrl : current.href;
  const title = 'Paint Holder Builder';
  const text = 'Build and export a custom paint holder with this free 3D tool.';
  return { url, title, text };
}

function setShareFeedback(message) {
  if (!shareFeedback) return;
  shareFeedback.textContent = message;
}

function buildShareLinks() {
  const { url, text } = getSharePayload();
  const shareUrl = new URL(url);
  shareUrl.searchParams.set('share_preview', 'v3');
  const encodedUrl = encodeURIComponent(shareUrl.href);
  const encodedText = encodeURIComponent(text);
  const media = encodeURIComponent(fallbackShareImage);

  if (shareFacebook) {
    shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  }
  if (sharePinterest) {
    sharePinterest.href = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${media}&description=${encodedText}`;
  }
  if (shareX) {
    shareX.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  }
  if (shareLinkedIn) {
    shareLinkedIn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
  if (shareReddit) {
    shareReddit.href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
  }
}

async function copyShareUrl(customMessage) {
  const { url } = getSharePayload();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      const input = document.createElement('textarea');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setShareFeedback(customMessage || 'Link copied.');
  } catch {
    setShareFeedback('Could not copy link on this device.');
  }
}

async function shareNativelyIfAvailable() {
  if (!navigator.share) return false;
  try {
    await navigator.share(getSharePayload());
    setShareFeedback('Shared.');
    return true;
  } catch {
    return false;
  }
}

function setSharePanelOpen(isOpen) {
  if (!sharePanel || !shareTrigger) return;
  sharePanel.hidden = !isOpen;
  shareTrigger.setAttribute('aria-expanded', String(isOpen));
}

function setCanvasTab(tabName) {
  const isChat = tabName === 'chat';
  canvasTabs.forEach(btn => {
    const active = btn.dataset.tab === tabName;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  previewPanel?.classList.toggle('active', !isChat);
  chatPanel?.classList.toggle('active', isChat);
  chatPanel?.setAttribute('aria-hidden', String(!isChat));

  if (isChat) loadGiscusIfNeeded();
}

function handleInput() {
  const hd   = parseFloat(document.getElementById('hd').value);
  const sp   = parseFloat(document.getElementById('sp').value);
  const hor  = Math.max(1, Math.round(parseFloat(document.getElementById('hor').value)));
  const vert = Math.max(1, Math.round(parseFloat(document.getElementById('vert').value)));
  const d    = parseFloat(document.getElementById('d').value);
  const mt   = parseFloat(document.getElementById('mt').value);

  const err = Measurements.isNotValid(hd, sp, d, mt, currentUnit);
  if (err[0]) {
    errorMsg.textContent = err[1];
    errorMsg.style.display = 'block';
    return false;
  }
  errorMsg.style.display = 'none';

  Measurements.set('HD',   hd,   currentUnit);
  Measurements.set('SP',   sp,   currentUnit);
  Measurements.set('D',    d,    currentUnit);
  Measurements.set('MT',   mt,   currentUnit);
  Measurements.measurements.HOR  = hor;
  Measurements.measurements.VERT = vert;

  rebuild();
  return true;
}

function getSvgExportSizeMm() {
  const { SP, HOR, VERT, D, MT, SVG_SCALE } = Measurements.measurements;
  const fW = SP * HOR;
  const fH = SP * VERT;
  const sW = D;
  const tbD = sW;
  const S = SVG_SCALE || 1;
  const G = S * 8;

  const widthUnits = (fW * 3 + sW * 2 + 2 * MT) * S + G * 6;
  const heightUnits = (fH + tbD * 2) * S + G * 4;

  return {
    widthUnits,
    heightUnits,
    widthMm: widthUnits / S,
    heightMm: heightUnits / S,
  };
}

function downloadSVG() {
  if (!handleInput()) return;

  const svg = holder.getSvg().getSvg();
  const size = getSvgExportSizeMm();
  svg.setAttribute('viewBox', `0 0 ${size.widthUnits} ${size.heightUnits}`);
  svg.setAttribute('width', `${size.widthMm.toFixed(2)}mm`);
  svg.setAttribute('height', `${size.heightMm.toFixed(2)}mm`);

  const str = new XMLSerializer().serializeToString(svg);
  const a   = document.createElement('a');
  a.download = `paint_holder_${Measurements.measurements.HOR}x${Measurements.measurements.VERT}.svg`;
  a.href     = 'data:image/svg+xml;utf8,' + encodeURIComponent(str);
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Events ────────────────────────────────────────────────────────────────────
inputFields.forEach(f => {
  f.addEventListener('input', handleInput);
  f.addEventListener('change', handleInput);
});

form.addEventListener('submit', e => {
  e.preventDefault();
  downloadSVG();
});

typeCheckbox.addEventListener('change', () => {
  const toUnit = typeCheckbox.checked ? 'mm' : 'in';
  unitLabels.forEach(l => l.textContent = `(${toUnit})`);
  ['hd', 'sp', 'd', 'mt'].forEach(id => {
    const el = document.getElementById(id);
    el.value = Measurements.convert(parseFloat(el.value), toUnit);
  });
  currentUnit = toUnit;
  renderPresetList();
  if (selectedPresetId) {
    const preset = productPresets.find(p => p.id === selectedPresetId);
    if (preset) updatePresetPreview(preset);
  }
});

canvasTabs.forEach(btn => {
  btn.addEventListener('click', () => setCanvasTab(btn.dataset.tab));
});

if (shareTrigger && sharePanel) {
  buildShareLinks();
  setSharePanelOpen(true);

  shareTrigger.addEventListener('click', async () => {
    const didShare = await shareNativelyIfAvailable();
    if (didShare) return;
    setSharePanelOpen(sharePanel.hidden);
  });

  shareCopy?.addEventListener('click', () => copyShareUrl('Link copied.'));
  shareInstagram?.addEventListener('click', () => copyShareUrl('Link copied. Paste it in Instagram bio/story.'));

  document.addEventListener('click', (event) => {
    if (!sharePanel.hidden && !sharePanel.contains(event.target) && !shareTrigger.contains(event.target)) {
      setSharePanelOpen(false);
    }
  });
}

// Part selector buttons — wired from HTML
window.showPart = showPart;

if (productPresets.length) {
  selectedPresetId = productPresets[0].id;
  updatePresetPreview(productPresets[0]);
}
renderPresetList();
renderAffiliateStrips();
setCanvasTab('preview');
