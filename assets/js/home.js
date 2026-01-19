// Initialize Icons
lucide.createIcons();

const grid = document.getElementById('brands-grid');
const searchBox = document.getElementById('search-box');
const modal = document.getElementById('add-modal');

// Modal Logic
function openModal() { modal.classList.add('open'); }
function closeModal() { modal.classList.remove('open'); }
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function renderCards(filter = '') {
    grid.innerHTML = '';
    const brandsData = window.brands || []; // Access global window object
    const filtered = brandsData.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(brand => {
        const card = document.createElement('a');
        card.className = 'brand-card';
        card.href = `editor.html?brand=${brand.id || brand._id}`;

        // Create Image
        const img = document.createElement('img');
        img.src = brand.logo;
        img.alt = `${brand.name} Logo`;
        img.className = 'brand-logo';
        img.onerror = function () { this.src = './assets/brands/parti/logo.png'; };
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

        // Note: We still need to create the icon element, but we can't use innerHTML easily for the lucide data attribs
        // unless we rely on lucide.createIcons() to re-parse.
        // Lucide replaces elements with data-lucide attributes.
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'arrow-right');
        arrow.appendChild(icon);

        card.appendChild(arrow);

        grid.appendChild(card);
    });

    // ALWAYS Append "Add New" Card
    const addCard = document.createElement('div');
    addCard.className = 'brand-card add-new';
    addCard.onclick = openModal;

    // Create Plus Icon Container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'brand-logo';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.background = 'rgba(255,255,255,0.05)';
    iconContainer.style.borderRadius = '50%';

    const plusIcon = document.createElement('i');
    plusIcon.setAttribute('data-lucide', 'plus');
    plusIcon.setAttribute('size', '40');
    plusIcon.setAttribute('color', 'var(--neon-green)');
    iconContainer.appendChild(plusIcon);

    addCard.appendChild(iconContainer);

    // Create Title
    const addTitle = document.createElement('h2');
    addTitle.className = 'brand-name';
    addTitle.textContent = 'Add Yours';
    addCard.appendChild(addTitle);

    // Create Desc
    const addDesc = document.createElement('p');
    addDesc.className = 'brand-desc';
    addDesc.textContent = 'Submit your own community frames';
    addCard.appendChild(addDesc);

    grid.appendChild(addCard);

    lucide.createIcons();
}

// Initial Render
if (window.brands) {
    renderCards();
} else {
    console.error("Brands data not loaded");
    const errorMsg = document.createElement('p');
    errorMsg.style.color = 'white';
    errorMsg.textContent = 'Failed to load brand data.';
    grid.appendChild(errorMsg);
}

// Search Listener
searchBox.addEventListener('input', (e) => {
    renderCards(e.target.value);
});
