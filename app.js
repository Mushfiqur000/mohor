// --- Language Switching Logic ---
let currentLang = 'en';

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    document.getElementById('langToggle').innerText = currentLang === 'en' ? 'বাংলা' : 'EN';
    applyTranslations();
    // Re-render products to update any dynamic text if needed
    renderProducts(typeof productsData !== 'undefined' ? productsData : []);
    updateCartUI();
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
}

document.getElementById('langToggle').addEventListener('click', toggleLanguage);

// --- Product & Filter Logic ---
const productGrid = document.getElementById('productGrid');
const checkboxes = document.querySelectorAll('.filter-checkbox');
const sortSelect = document.getElementById('sortSelect');

function renderProducts(productsToRender) {
    productGrid.innerHTML = '';
    
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: #666;">No products match your filters.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductModal(product);
        
        const coverImage = product.images && product.images.length > 0 ? product.images[0] : '';

        card.innerHTML = `
            <div class="image-container">
                <img src="${coverImage}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/300x400/f9f9f9/666?text=Mohor'">
            </div>
            <div class="product-details-card">
                <span class="product-category-label">${product.category.replace('-', ' ')}</span>
                <h3>${product.title}</h3>
                <p class="product-price">৳ ${product.price}</p>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

function updateProducts() {
    if (typeof productsData === 'undefined') return;
    const activeCategories = Array.from(document.querySelectorAll('input[id^="cat-"]:checked')).map(cb => cb.value);
    const activePrices = Array.from(document.querySelectorAll('.price-filter:checked')).map(cb => cb.value);
    const sortValue = sortSelect.value;

    let filtered = productsData.filter(product => {
        let catMatch = activeCategories.length === 0 || activeCategories.includes(product.category);
        let priceMatch = activePrices.length === 0;
        
        if (!priceMatch) {
            if (activePrices.includes('under-1500') && product.price < 1500) priceMatch = true;
            if (activePrices.includes('1500-2500') && product.price >= 1500 && product.price <= 2500) priceMatch = true;
            if (activePrices.includes('above-2500') && product.price > 2500) priceMatch = true;
        }
        return catMatch && priceMatch;
    });

    if (sortValue === 'low-high') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'high-low') {
        filtered.sort((a, b) => b.price - a.price);
    }

    renderProducts(filtered);
}

checkboxes.forEach(cb => cb.addEventListener('change', updateProducts));
sortSelect.addEventListener('change', updateProducts);
setTimeout(() => {
    applyTranslations(); // Apply initial English text
    renderProducts(typeof productsData !== 'undefined' ? productsData : []);
}, 100);

// --- Product Modal Logic ---
const productModal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModalBtn');
let currentViewingProduct = null;
let selectedSize = null;
let selectedColor = null;

function openProductModal(product) {
    currentViewingProduct = product;
    selectedSize = null;
    selectedColor = null;
    document.getElementById('sizeWarning').style.display = 'none';
    document.getElementById('colorWarning').style.display = 'none';

    document.getElementById('modalTitle').innerText = product.title;
    document.getElementById('modalPrice').innerText = `৳ ${product.price}`;
    document.getElementById('modalDesc').innerText = product.description;
    
    const mainImage = document.getElementById('modalMainImage');
    const thumbContainer = document.getElementById('modalThumbnails');
    thumbContainer.innerHTML = '';
    
    if (product.images && product.images.length > 0) {
        mainImage.src = product.images[0]; 
        
        product.images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = 'thumbnail' + (index === 0 ? ' active' : '');
            
            thumb.onclick = () => {
                mainImage.src = imgSrc;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbContainer.appendChild(thumb);
        });
    }

    const colorsContainer = document.getElementById('modalColors');
    const colorSection = document.getElementById('colorSection');
    colorsContainer.innerHTML = '';
    if (product.colors && product.colors.length > 0) {
        colorSection.style.display = 'block';
        product.colors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'select-btn color-btn';
            btn.innerText = color;
            btn.onclick = () => selectOption(btn, color, 'color');
            colorsContainer.appendChild(btn);
        });
    } else {
        colorSection.style.display = 'none';
        selectedColor = "Default"; 
    }

    const sizesContainer = document.getElementById('modalSizes');
    sizesContainer.innerHTML = '';
    product.sizes.forEach(size => {
        const btn = document.createElement('button');
        btn.className = 'select-btn size-btn';
        btn.innerText = size;
        btn.onclick = () => selectOption(btn, size, 'size');
        sizesContainer.appendChild(btn);
    });

    const detailsList = document.getElementById('modalDetails');
    detailsList.innerHTML = '';
    product.details.forEach(detail => {
        const li = document.createElement('li');
        li.innerText = detail;
        detailsList.appendChild(li);
    });

    productModal.classList.add('active');
}

function selectOption(clickedBtn, value, type) {
    if (type === 'size') {
        selectedSize = value;
        document.getElementById('sizeWarning').style.display = 'none';
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    } else if (type === 'color') {
        selectedColor = value;
        document.getElementById('colorWarning').style.display = 'none';
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    }
    clickedBtn.classList.add('selected');
}

closeModalBtn.addEventListener('click', () => { productModal.classList.remove('active'); });
productModal.addEventListener('click', (e) => { if (e.target === productModal) productModal.classList.remove('active'); });

document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
    let valid = true;
    if (!selectedSize) { document.getElementById('sizeWarning').style.display = 'inline'; valid = false; }
    if (!selectedColor) { document.getElementById('colorWarning').style.display = 'inline'; valid = false; }
    if (!valid) return;

    let displayName = currentViewingProduct.title;
    if(selectedColor !== "Default") displayName += ` (${selectedColor})`;

    addToCart(displayName, currentViewingProduct.price, selectedSize);
    productModal.classList.remove('active');
});

// --- Cart & WhatsApp Logic ---
let cart = [];
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalValue = document.getElementById('cartTotalValue');
const cartBadge = document.getElementById('cartBadge');

document.getElementById('openCartBtn').addEventListener('click', () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); });
const closeCart = () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); };
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function addToCart(name, price, size) {
    cart.push({ name: name, price: price, size: size });
    updateCartUI();
    cartSidebar.classList.add('active'); cartOverlay.classList.add('active');
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    cartItemsContainer.innerHTML = ''; 
    let total = 0;
    if (cart.length === 0) {
        // Translation applied here for empty state
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;" data-i18n="empty_cart">${translations[currentLang].empty_cart}</p>`;
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <strong>${item.name}</strong>
                        <span>Size: ${item.size}</span>
                        <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                    <div style="font-weight:600; color:var(--primary-gold);">৳${item.price}</div>
                </div>`;
        });
    }
    cartTotalValue.innerText = total;
    cartBadge.innerText = cart.length;
}

window.checkoutToWhatsApp = function() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    const WHATSAPP_NUMBER = "8801330113027"; 
    let message = "Hello Mohor Clothings! I would like to order the following items:%0A%0A";
    let total = 0;
    cart.forEach((item, index) => { 
        message += `${index + 1}. ${item.name} (Size: ${item.size}) - ৳${item.price}%0A`; 
        total += item.price; 
    });
    message += `%0A*Total: ৳${total}*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

// Mobile Menu
document.getElementById('menuToggle').addEventListener('click', () => { document.getElementById('navLinks').classList.toggle('active'); });
document.getElementById('mobileFilterBtn').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    this.innerHTML = sidebar.classList.contains('active') ? 'Hide Filters' : translations[currentLang].filters;
});
