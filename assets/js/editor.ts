/// <reference types="vite/client" />

declare const lucide: any;

declare global {
    interface Window {
        brands: any[];
        currentBrand: any;
        framesData: any[];
    }
}

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Initialize Icons
lucide.createIcons();

// Connection Setup
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://greedy-puffin-630.convex.cloud";
const convex = new ConvexHttpClient(convexUrl);

// 1. Get Config
const params = new URLSearchParams(window.location.search);
const brandId = params.get('brand') || 'parti';

console.log("🚀 Editor initialized for brand:", brandId);

// Helper to init UI after brand is found
async function setupEditor() {
    let brand = (window.brands || []).find((b: any) => b.id === brandId);

    // If not found locally, check Convex
    if (!brand) {
        try {
            console.log("Fetching brands from Convex to find match...");
            const convexBrands = await convex.query(api.brands.getBrands);
            brand = convexBrands.find((b: any) => b._id === brandId || b.id === brandId);
            console.log("Found brand:", brand);
        } catch (e) {
            console.error("Failed to fetch brand:", e);
        }
    }

    // Default if still missing
    if (!brand && (window.brands)) brand = (window.brands as any)[0];
    (window as any).currentBrand = brand; // Global

    if (brand) {
        const titleEl = document.getElementById('brand-title');
        const descEl = document.getElementById('brand-desc');
        if (titleEl) titleEl.textContent = brand.name + (brand.name.includes("Frame") ? "" : " Frame");
        if (descEl) descEl.textContent = brand.description || 'Custom Frames';

        // 3. Setup Frames
        (window as any).framesData = brand.frames;

        renderFrameGrid(brand);
        preloadFrames(); // Start loading
    }
}

function renderFrameGrid(brand: any) {
    const frameGrid = document.getElementById('frame-grid');
    if (!frameGrid) return;
    frameGrid.innerHTML = '';

    brand.frames.forEach((src: string, index: number) => {
        const div = document.createElement('div');
        div.className = `frame-option ${index === 0 ? 'selected' : ''}`;
        div.onclick = () => selectFrame(index);

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Frame ${index + 1}`;
        img.onerror = () => { img.style.opacity = '0.3'; }

        div.appendChild(img);
        frameGrid.appendChild(div);
    });
}

const loadedFrameImages: HTMLImageElement[] = [];
let currentFrameIndex = 0;

// Invoke init
setupEditor();

// --- Core Logic ---
let uploadedImage: HTMLImageElement | null = null;
let fitMode = 'cover';
let currentScale = 1;
let renderRequested = false;
const CANVAS_SIZE = 1080;

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
const uploadInput = document.getElementById('upload-input') as HTMLInputElement;
const placeholder = document.querySelector('.upload-placeholder') as HTMLElement;
const dropZone = document.getElementById('drop-zone') as HTMLElement;
const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
const changeBtn = document.getElementById('change-image-btn') as HTMLButtonElement;
const imgControls = document.getElementById('img-controls') as HTMLElement;
const btnFill = document.getElementById('btn-fill') as HTMLElement;
const btnFit = document.getElementById('btn-fit') as HTMLElement;
const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;

// Attach listeners
if (btnFill) btnFill.onclick = () => setFitMode('cover');
if (btnFit) btnFit.onclick = () => setFitMode('contain');
if (zoomSlider) zoomSlider.oninput = (e) => updateZoom((e.target as HTMLInputElement).value);
if (downloadBtn) downloadBtn.onclick = handleDownload;

// Preload func
function preloadFrames() {
    let loadedCount = 0;
    const framesData = (window as any).framesData;
    if (!framesData) return;
    framesData.forEach((src: string, index: number) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
            loadedFrameImages[index] = img;
            loadedCount++;
            if (loadedCount === framesData.length && uploadedImage) scheduleRender();
        };
        img.onerror = () => {
            console.warn("Could not load frame:", src);
        }
        loadedFrameImages[index] = img;
    });
}

// Interaction
function selectFrame(index: number) {
    currentFrameIndex = index;
    document.querySelectorAll('.frame-option').forEach((el, i) => {
        if (i === index) el.classList.add('selected');
        else el.classList.remove('selected');
    });
    if (uploadedImage) scheduleRender();
}

function setFitMode(mode: string) {
    fitMode = mode;
    currentScale = 1;
    if (zoomSlider) zoomSlider.value = '1';
    if (mode === 'cover') {
        btnFill.classList.add('active');
        btnFit.classList.remove('active');
    } else {
        btnFit.classList.add('active');
        btnFill.classList.remove('active');
    }
    if (uploadedImage) scheduleRender();
}

function updateZoom(val: string) {
    currentScale = parseFloat(val);
    if (uploadedImage) scheduleRender();
}

// Upload
if (uploadInput) uploadInput.addEventListener('change', (e) => handleFile((e.target as HTMLInputElement).files?.[0]));
if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFile(e.dataTransfer?.files[0]); });
}

function handleFile(file: File | undefined) {
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
            zoomSlider.value = '1';
            scheduleRender();
        };
        img.src = e.target?.result as string;
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
    if (!uploadedImage || !ctx) return;

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
    const brand = (window as any).currentBrand;
    const bId = (brand && (brand.id || brand._id)) || 'brand';
    link.download = `${bId}-frame-masterpiece.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
