import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Initialize Icons
lucide.createIcons();

// 1. Get Config
const params = new URLSearchParams(window.location.search);
const brandId = params.get('brand') || 'parti';

// Helper to init UI after brand is found
async function setupEditor() {
    let brand = (window.brands || []).find(b => b.id === brandId);

    // If not found locally, check Convex
    if (!brand) {
        try {
            const convexUrl = import.meta.env.VITE_CONVEX_URL;
            if (convexUrl) {
                const convex = new ConvexHttpClient(convexUrl);
                // We need to fetch all approved brands and find by _id or just scan them
                // Ideally we'd have a getBrand(id) query, but getBrands() is filterable client side for now
                const convexBrands = await convex.query(api.brands.getBrands);
                brand = convexBrands.find(b => b._id === brandId || b.id === brandId);
            }
        } catch (e) {
            console.error("Failed to fetch brand:", e);
        }
    }

    // Default if still missing
    if (!brand && window.brands) brand = window.brands[0];
    window.currentBrand = brand; // Global for download handler

    if (brand) {
        document.getElementById('brand-title').textContent = brand.name + (brand.name.includes("Frame") ? "" : " Frame");
        document.getElementById('brand-desc').textContent = brand.description || 'Custom Frames';

        // 3. Setup Frames
        const framesData = brand.frames;
        window.framesData = framesData;

        renderFrameGrid(brand);
        preloadFrames();
    }
}

function renderFrameGrid(brand) {
    const frameGrid = document.getElementById('frame-grid');
    frameGrid.innerHTML = '';

    brand.frames.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = `frame-option ${index === 0 ? 'selected' : ''}`;
        div.onclick = () => selectFrame(index);

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Frame ${index + 1}`;
        // Fix for Google Drive links (convert view?usp=sharing to thumbnail/download link is tricky without proxy)
        // But for direct hosting it's fine.
        img.onerror = () => { img.style.opacity = '0.3'; }

        div.appendChild(img);
        frameGrid.appendChild(div);
    });
}


const loadedFrameImages = [];
let currentFrameIndex = 0;

// Invoke init
setupEditor();

// --- Core Logic ---
let uploadedImage = null;
let fitMode = 'cover';
let currentScale = 1;
let renderRequested = false;
const CANVAS_SIZE = 1080;

const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('upload-input');
const placeholder = document.querySelector('.upload-placeholder');
const dropZone = document.getElementById('drop-zone');
const downloadBtn = document.getElementById('download-btn');
const changeBtn = document.getElementById('change-image-btn');
const imgControls = document.getElementById('img-controls');
const btnFill = document.getElementById('btn-fill');
const btnFit = document.getElementById('btn-fit');
const zoomSlider = document.getElementById('zoom-slider');

// Attach listeners
btnFill.onclick = () => setFitMode('cover');
btnFit.onclick = () => setFitMode('contain');
zoomSlider.oninput = (e) => updateZoom(e.target.value);
downloadBtn.onclick = handleDownload;

// Globals for frames 
// Note: window.framesData is set above
// Preload func
function preloadFrames() {
    let loadedCount = 0;
    if (!window.framesData) return;
    window.framesData.forEach((src, index) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
            loadedFrameImages[index] = img;
            loadedCount++;
            if (loadedCount === window.framesData.length && uploadedImage) scheduleRender();
        };
        img.onerror = () => {
            console.warn("Could not load frame:", src);
        }
        loadedFrameImages[index] = img;
    });
}

// Interaction
function selectFrame(index) {
    currentFrameIndex = index;
    document.querySelectorAll('.frame-option').forEach((el, i) => {
        if (i === index) el.classList.add('selected');
        else el.classList.remove('selected');
    });
    if (uploadedImage) scheduleRender();
}

function setFitMode(mode) {
    fitMode = mode;
    currentScale = 1;
    zoomSlider.value = 1;
    if (mode === 'cover') {
        btnFill.classList.add('active');
        btnFit.classList.remove('active');
    } else {
        btnFit.classList.add('active');
        btnFill.classList.remove('active');
    }
    if (uploadedImage) scheduleRender();
}

function updateZoom(val) {
    currentScale = parseFloat(val);
    if (uploadedImage) scheduleRender();
}

// Upload
uploadInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); });

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            placeholder.classList.add('hidden');
            canvas.style.display = 'block';
            changeBtn.classList.remove('hidden');
            imgControls.classList.remove('hidden');
            downloadBtn.disabled = false;
            currentScale = 1;
            zoomSlider.value = 1;
            scheduleRender();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Render
function scheduleRender() {
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(renderCanvas);
    }
}

function renderCanvas() {
    renderRequested = false;
    if (!uploadedImage) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const imgRatio = uploadedImage.width / uploadedImage.height;

    let baseW, baseH;
    if (fitMode === 'cover') {
        if (imgRatio > 1) { // Landscape
            baseH = CANVAS_SIZE;
            baseW = CANVAS_SIZE * imgRatio;
        } else { // Portrait
            baseW = CANVAS_SIZE;
            baseH = CANVAS_SIZE / imgRatio;
        }
    } else { // Contain
        if (imgRatio > 1) {
            baseW = CANVAS_SIZE;
            baseH = CANVAS_SIZE / imgRatio;
        } else {
            baseH = CANVAS_SIZE;
            baseW = CANVAS_SIZE * imgRatio;
        }
    }

    const drawW = baseW * currentScale;
    const drawH = baseH * currentScale;
    const offsetX = (CANVAS_SIZE - drawW) / 2;
    const offsetY = (CANVAS_SIZE - drawH) / 2;

    ctx.drawImage(uploadedImage, offsetX, offsetY, drawW, drawH);

    const frameImg = loadedFrameImages[currentFrameIndex];
    if (frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
        ctx.drawImage(frameImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
}

function handleDownload() {
    if (!uploadedImage) return;
    const link = document.createElement('a');
    const bId = (window.currentBrand && (window.currentBrand.id || window.currentBrand._id)) || 'brand';
    link.download = `${bId}-frame-masterpiece.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
