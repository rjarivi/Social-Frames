/// <reference types="vite/client" />

declare const lucide: any;

declare global {
    interface Window {
        brands: any[];
        convexBrands: any[];
        openModal: () => void;
        closeModal: () => void;
    }
}

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { brands as localBrands } from "./data.js";

// Initialize global brands with local data immediately
window.brands = localBrands;

// Initialize Icons
lucide.createIcons();

const grid = document.getElementById('brands-grid');
const searchBox = document.getElementById('search-box');
const modal = document.getElementById('add-modal');

// Connection Logic
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://greedy-puffin-630.convex.cloud";
console.log("🚀 Home: Initializing Convex client with URL:", convexUrl);
const convex = new ConvexHttpClient(convexUrl);

// Modal Logic
if (modal) {
    window.openModal = function () { modal.classList.add('open'); }
    window.closeModal = function () { modal.classList.remove('open'); }
    modal.addEventListener('click', (e) => { if (e.target === modal) window.closeModal(); });
}

// Main Init Function
async function init() {
    // 1. Show hardcoded brands immediately
    renderCards();

    try {
        console.log("Fetching brands from Convex...");
        const convexBrands = await convex.query(api.brands.getBrands);
        console.log("✅ Received brands:", convexBrands);

        if (convexBrands) {
            let allBrands = window.brands || [];
            // Merge: Prepend Convex brands
            allBrands = [...convexBrands, ...allBrands];

            // Deduplicate by name
            const unique = new Map();
            allBrands.forEach(b => unique.set(b.name, b));
            allBrands = Array.from(unique.values());

            window.brands = allBrands; // Update global

            // 2. Re-render with new data
            renderCards();
        }
    } catch (e) {
        console.error("❌ Convex connection error:", e);
    }
}

function renderCards(filter = '') {
    if (!grid) return;
    grid.innerHTML = '';
    const brandsData = window.brands || [];
    const filtered = brandsData.filter((b: any) => b.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach((brand: any) => {
        const card = document.createElement('a');
        card.className = 'brand-card';
        // Use _id if available (Convex), otherwise id (Local)
        card.href = `editor.html?brand=${brand.id || brand._id}`;

        // Create Image
        const img = document.createElement('img');
        img.src = brand.logo;
        img.alt = `${brand.name} Logo`;
        img.className = 'brand-logo';
        // Fix for Google Drive links or missing images
        img.onerror = function () {
            (this as HTMLImageElement).src = './assets/brands/parti/logo.png';
            console.warn("Image failed, using fallback for", brand.name);
        };
        card.appendChild(img);

        // Create Title
        const title = document.createElement('h2');
        title.className = 'brand-name';
        title.textContent = brand.name;
        card.appendChild(title);

        // Create Description
        const desc = document.createElement('p');
        desc.className = 'brand-desc';
        desc.textContent = brand.description || 'Custom Frames';
        card.appendChild(desc);

        // Create Arrow
        const arrow = document.createElement('div');
        arrow.className = 'card-arrow';
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'arrow-right');
        arrow.appendChild(icon);
        card.appendChild(arrow);

        grid.appendChild(card);
    });

    // ALWAYS Append "Add New" Card
    const addCard = document.createElement('div');
    addCard.className = 'brand-card add-new';
    addCard.onclick = window.openModal;

    const iconContainer = document.createElement('div');
    iconContainer.className = 'brand-logo';
    Object.assign(iconContainer.style, {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)', borderRadius: '50%'
    });

    const plusIcon = document.createElement('i');
    plusIcon.setAttribute('data-lucide', 'plus');
    plusIcon.setAttribute('size', '40');
    plusIcon.setAttribute('color', 'var(--neon-green)');
    iconContainer.appendChild(plusIcon);
    addCard.appendChild(iconContainer);

    const addTitle = document.createElement('h2');
    addTitle.className = 'brand-name';
    addTitle.textContent = 'Add Yours';
    addCard.appendChild(addTitle);

    const addDesc = document.createElement('p');
    addDesc.className = 'brand-desc';
    addDesc.textContent = 'Submit your own community frames';
    addCard.appendChild(addDesc);

    grid.appendChild(addCard);

    // Re-run icons
    lucide.createIcons();
}

// Search Listener
if (searchBox) {
    searchBox.addEventListener('input', (e) => {
        renderCards((e.target as HTMLInputElement).value);
    });
}

// Start
init();
