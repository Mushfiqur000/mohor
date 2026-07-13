// --- LANGUAGE DICTIONARY ---
let currentLang = 'en';

const uiTranslations = {
    en: {
        navShop: "Shop", navCart: "Cart", shopTitle: "Our Collection", filterBtn: "Filters",
        sortDefault: "Sort by: Default", sortLowHigh: "Price: Low to High", sortHighLow: "Price: High to Low",
        catTitle: "Categories", catKurti: "Kurti", catThreePiece: "Three Piece", catKhadi: "Khadi", catFormal: "Formal Wear",
        priceTitle: "Price", price1: "Under ৳1500", price2: "৳1500 - ৳2500", price3: "Above ৳2500",
        noProducts: "No products match your filters.", sizeSelect: "Select Size", sizeWarning: "*Please select a size",
        colorSelect: "Select Color", colorWarning: "*Please select a color", descTitle: "Description",
        detailsTitle: "Product Details", addToCart: "Add to Cart", cartTitle: "Your Cart", cartEmpty: "Your cart is empty.",
        cartTotal: "Total:", orderWhatsapp: "Order via WhatsApp", footerText: "© 2026 Mohor Clothings Bangladesh. All Rights Reserved."
    },
    bn: {
        navShop: "শপ", navCart: "কার্ট", shopTitle: "আমাদের কালেকশন", filterBtn: "ফিল্টার",
        sortDefault: "সর্ট: ডিফল্ট", sortLowHigh: "দাম: কম থেকে বেশি", sortHighLow: "দাম: বেশি থেকে কম",
        catTitle: "ক্যাটাগরি", catKurti: "কুর্তি", catThreePiece: "থ্রি-পিস", catKhadi: "খাদি", catFormal: "ফরমাল ওয়্যার",
        priceTitle: "দাম", price1: "৳১৫০০ এর নিচে", price2: "৳১৫০০ - ৳২৫০০", price3: "৳২৫০০ এর উপরে",
        noProducts: "আপনার ফিল্টারের সাথে মিলে এমন কোনো পণ্য নেই।", sizeSelect: "সাইজ নির্বাচন করুন", sizeWarning: "*দয়া করে একটি সাইজ নির্বাচন করুন",
        colorSelect: "রং নির্বাচন করুন", colorWarning: "*দয়া করে একটি রং নির্বাচন করুন", descTitle: "বিবরণ",
        detailsTitle: "পণ্যের বিস্তারিত", addToCart: "কার্টে যোগ করুন", cartTitle: "আপনার কার্ট", cartEmpty: "আপনার কার্ট খালি।",
        cartTotal: "মোট:", orderWhatsapp: "হোয়াটসঅ্যাপে অর্ডার করুন", footerText: "© ২০২৬ মোহর ক্লথিংস বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।"
    }
};

function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (uiTranslations[currentLang][key]) {
            el.innerText = uiTranslations[currentLang][key];
        }
    });
    updateProducts(); // Re-render grid in new language
    updateCartUI();   // Re-render cart in new language
}

document.getElementById('langToggleBtn').addEventListener('click', () => {
    currentLang = (currentLang === 'en') ? 'bn' : 'en';
    updateUIText();
});


// --- PRODUCT RENDERING & FILTERING ---
const productGrid = document.getElementById('productGrid');
const checkboxes = document.querySelectorAll('.filter-checkbox');
const sortSelect = document.getElementById('sortSelect');

function renderProducts(productsToRender) {
    productGrid.innerHTML = '';
    
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: #666;">${uiTranslations[currentLang].noProducts}</p>`;
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductModal(product);
        
        const coverImage = product.images && product.images.length > 0 ? product.images[0] : '';
        const displayTitle = product.title[currentLang];
        
        // Match English category text for UI label display safely
        const displayCategory = product.category.replace('-', ' ');

        card.innerHTML = `
            <div class="image-container">
                <img src="${coverImage}" alt="${displayTitle}" class="product-image" onerror="this.src='https://via.placeholder.com/300x400/f9f9f9/666?text=Mohor'">
            </div>
            <div class="product-details-card">
                <span class="product-category-label">${displayCategory}</span>
                <h3>${displayTitle}</h3>
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


// --- MODAL LOGIC ---
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

    document.getElementById('modalTitle').innerText = product.title[currentLang];
    document.getElementById('modalPrice').innerText = `৳ ${product.price}`;
    document.getElementById('modalDesc').innerText = product.description[currentLang];
    
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
    if (product.colors && product.colors[currentLang].length > 0) {
        colorSection.style.display = 'block';
        product.colors[currentLang].forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = 'select-btn color-btn';
            btn.innerText = color;
            // Map the selection back to English for cart backend if needed, or just keep display language
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
    product.details[currentLang].forEach(detail => {
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

    // Use english name for backend order consistency
    let displayName = currentViewingProduct.title.en;
    if(selectedColor !== "Default") displayName += ` (${selectedColor})`;

    addToCart(displayName, currentViewingProduct.price, selectedSize);
    productModal.classList.remove('active');
});


// --- CART & WHATSAPP LOGIC ---
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
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;">${uiTranslations[currentLang].cartEmpty}</p>`;
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
    if (cart.length === 0) { alert(uiTranslations[currentLang].cartEmpty); return; }
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
    this.innerText = uiTranslations[currentLang].filterBtn;
});

// Initialize on Load
setTimeout(() => {
    updateUIText();
}, 100);
