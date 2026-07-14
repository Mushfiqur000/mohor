// --- LANGUAGE DICTIONARY ---
let currentLang = 'en';

const uiTranslations = {
    en: {
        navShop: "Shop", navAbout: "About Us", navPolicy: "Policy", navCart: "Cart", shopTitle: "Our Collection", filterBtn: "Filters",
        sortDefault: "Sort by: Default", sortLowHigh: "Price: Low to High", sortHighLow: "Price: High to Low",
        catTitle: "Categories", catKurti: "Kurti", catThreePiece: "Three Piece", catKhadi: "Khadi", catFormal: "Formal Wear",
        priceTitle: "Price", price1: "Under ৳1500", price2: "৳1500 - ৳2500", price3: "Above ৳2500",
        noProducts: "No products match your filters.", sizeSelect: "Select Size", sizeWarning: "*Please select a size",
        colorSelect: "Select Color", colorWarning: "*Please select a color", descTitle: "Description",
        detailsTitle: "Product Details", addToCart: "Add to Cart", cartTitle: "Your Cart", cartEmpty: "Your cart is empty.",
        cartSubtotal: "Subtotal:", cartDelivery: "Delivery Charge:", cartTotal: "Final Total:",
        orderWhatsapp: "Confirm Order", footerText: "© 2026 Mohor Clothings Bangladesh. All Rights Reserved.",
        selectOptions: "Select Size & Add to Cart",
        aboutTitle: "About Mohor Clothings",
        aboutText: "Welcome to Mohor Clothings, your premier destination for handcrafted luxury fashion in Bangladesh. From our breathable, premium soft cotton Three-Piece ensembles to our elegantly tailored Kurtis and authentic Khadi wear, every piece is designed with the modern woman in mind. Whether you are stepping into a university classroom, leading a corporate meeting, or celebrating a festive occasion, our collections offer the perfect fit. Proudly serving Sylhet and customers nationwide, we are dedicated to bringing you high-quality embroidery and timeless designs that empower your everyday wardrobe.",
        policyAgreeText: "I agree to the", policyLink: "Delivery & Order Confirmation Policy",
        selectDeliveryZone: "Select Delivery Zone *", zoneInside: "Inside Sylhet (৳80)", zoneOutside: "Outside Sylhet (৳150)",
        
        // POLICY TRANSLATIONS (Reused for the cart dropdown)
        policyPageTitle: "Mohor Delivery & Order Confirmation Policy",
        policy1Title: "Inside Sylhet (Delivery Charge: ৳80)",
        policy1Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>Estimated delivery time: 1–2 business days.</li><li>Delivery time may vary due to weather or courier delays.</li><li>Our delivery partner will contact you before delivery.</li></ul>",
        policy2Title: "Outside Sylhet (Delivery Charge: ৳150)",
        policy2Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>Estimated delivery time: 2–5 business days.</li><li>Delivery time may be longer during national holidays.</li><li>Our courier partner may contact you before delivery.</li></ul>",
        policy3Title: "Order Confirmation Terms",
        policy3Text: "By clicking “Confirm Order”, you acknowledge and agree that:<ul><li>The delivery information you provided is accurate.</li><li>Delivery charges are added to your order total.</li><li>Mohor reserves the right to contact you for order verification before dispatch.</li><li>Orders cannot be modified after they have been packed or shipped.</li><li>If delivery fails due to an incorrect address or unreachable phone number, additional re-delivery charges may apply.</li></ul><br><p style='text-align:center; font-style:italic;'>Thank you for choosing Mohor. We appreciate your trust and look forward to delivering a beautiful shopping experience.</p>"
    },
    bn: {
        navShop: "শপ", navAbout: "আমাদের সম্পর্কে", navPolicy: "পলিসি", navCart: "কার্ট", shopTitle: "আমাদের কালেকশন", filterBtn: "ফিল্টার",
        sortDefault: "সর্ট: ডিফল্ট", sortLowHigh: "দাম: কম থেকে বেশি", sortHighLow: "দাম: বেশি থেকে কম",
        catTitle: "ক্যাটাগরি", catKurti: "কুর্তি", catThreePiece: "থ্রি-পিস", catKhadi: "খাদি", catFormal: "ফরমাল ওয়্যার",
        priceTitle: "দাম", price1: "৳১৫০০ এর নিচে", price2: "৳১৫০০ - ৳২৫০০", price3: "৳২৫০০ এর উপরে",
        noProducts: "আপনার ফিল্টারের সাথে মিলে এমন কোনো পণ্য নেই।", sizeSelect: "সাইজ নির্বাচন করুন", sizeWarning: "*দয়া করে একটি সাইজ নির্বাচন করুন",
        colorSelect: "রং নির্বাচন করুন", colorWarning: "*দয়া করে একটি রং নির্বাচন করুন", descTitle: "বিবরণ",
        detailsTitle: "পণ্যের বিস্তারিত", addToCart: "কার্টে যোগ করুন", cartTitle: "আপনার কার্ট", cartEmpty: "আপনার কার্ট খালি।",
        cartSubtotal: "সাবটোটাল:", cartDelivery: "ডেলিভারি চার্জ:", cartTotal: "মোট মূল্য:",
        orderWhatsapp: "কনফার্ম অর্ডার", footerText: "© ২০২৬ মোহর ক্লথিংস বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
        selectOptions: "সাইজ নির্বাচন করুন",
        aboutTitle: "মোহর ক্লথিংস সম্পর্কে",
        aboutText: "মোহর ক্লথিংস-এ আপনাকে স্বাগতম, বাংলাদেশে হাতে তৈরি লাক্সারি ফ্যাশনের অন্যতম বিশ্বস্ত নাম। আমাদের আরামদায়ক প্রিমিয়াম সফট কটন থ্রি-পিস থেকে শুরু করে আকর্ষণীয় কুর্তি এবং ঐতিহ্যবাহী খাদি পোশাক—প্রতিটি ডিজাইন তৈরি করা হয়েছে আধুনিক নারীদের কথা মাথায় রেখে। আপনি ইউনিভার্সিটির ক্লাসে যান, কর্পোরেট মিটিং পরিচালনা করুন বা কোনো উৎসব উদযাপন করুন, আমাদের কালেকশনে আপনার জন্য মানানসই পোশাক রয়েছে। সিলেট থেকে শুরু করে সারা দেশের গ্রাহকদের জন্য উচ্চমানের এমব্রয়ডারি এবং মানসম্মত ডিজাইনের পোশাক পৌঁছে দিতে আমরা প্রতিশ্রুতিবদ্ধ।",
        policyAgreeText: "আমি সম্মত হচ্ছি", policyLink: "ডেলিভারি ও অর্ডার কনফার্মেশন পলিসিতে",
        selectDeliveryZone: "ডেলিভারি জোন নির্বাচন করুন *", zoneInside: "সিলেটের ভেতরে (৳৮০)", zoneOutside: "সিলেটের বাইরে (৳১৫০)",
        
        // POLICY TRANSLATIONS (Reused for the cart dropdown)
        policyPageTitle: "মোহর ডেলিভারি ও অর্ডার কনফার্মেশন পলিসি",
        policy1Title: "সিলেটের ভেতরে (ডেলিভারি চার্জ: ৳৮০)",
        policy1Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>আনুমানিক ডেলিভারি সময়: ১-২ কর্মদিবস।</li><li>আবহাওয়া বা কুরিয়ার বিলম্বের কারণে সময় পরিবর্তিত হতে পারে।</li><li>ডেলিভারির আগে আমাদের পার্টনার যোগাযোগ করবে।</li></ul>",
        policy2Title: "সিলেটের বাইরে (ডেলিভারি চার্জ: ৳১৫০)",
        policy2Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>আনুমানিক ডেলিভারি সময়: ২-৫ কর্মদিবস।</li><li>জাতীয় ছুটির দিনে সময় দীর্ঘ হতে পারে।</li><li>আমাদের কুরিয়ার পার্টনার যোগাযোগ করতে পারে।</li></ul>",
        policy3Title: "অর্ডার কনফার্মেশন শর্তাবলী",
        policy3Text: "“কনফার্ম অর্ডার” এ ক্লিক করার মাধ্যমে আপনি স্বীকার এবং সম্মত হচ্ছেন যে:<ul><li>আপনার দেওয়া ডেলিভারি তথ্য নির্ভুল।</li><li>ডেলিভারি চার্জ আপনার অর্ডারের মোট মূল্যের সাথে যোগ করা হবে।</li><li>পণ্য পাঠানোর আগে অর্ডার ভেরিফিকেশনের জন্য মোহর আপনার সাথে যোগাযোগ করার অধিকার রাখে।</li><li>প্যাক বা শিপ করার পর অর্ডারে কোনো পরিবর্তন করা যাবে লালন।</li><li>ভুল ঠিকানা বা পৌঁছানো যায় না এমন ফোন নম্বরের কারণে ডেলিভারি ব্যর্থ হলে, পুনরায় ডেলিভারি চার্জ প্রযোজ্য হতে পারে।</li></ul><br><p style='text-align:center; font-style:italic;'>মোহর বেছে নেওয়ার জন্য ধন্যবাদ। আমরা আপনার আস্থার মূল্যায়ন করি এবং একটি চমৎকার শপিং অভিজ্ঞতা প্রদানে মুখিয়ে আছি।</p>"
    }
};

function getText(dataField) {
    if (!dataField) return "";
    if (typeof dataField === 'string') return dataField; 
    return dataField[currentLang] || dataField['en'] || "";
}

function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (uiTranslations[currentLang][key]) {
            if (el.tagName === 'OPTION') {
                el.innerText = uiTranslations[currentLang][key];
            } else {
                el.innerHTML = uiTranslations[currentLang][key];
            }
        }
    });
    
    if (document.getElementById('productGrid')) { updateProducts(); }
    updateCartUI(); 
    updateDeliveryPolicyAndTotal();  // Refresh policy text on language change
}

document.getElementById('langToggleBtn').addEventListener('click', () => {
    currentLang = (currentLang === 'en') ? 'bn' : 'en';
    updateUIText();
});


// --- PRODUCT RENDERING & FILTERING ---
function renderProducts(productsToRender) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return; 
    
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
        const displayTitle = getText(product.title);
        const displayCategory = product.category.replace('-', ' ');

        card.innerHTML = `
            <div class="image-container">
                <img src="${coverImage}" alt="${displayTitle}" class="product-image" onerror="this.src='https://via.placeholder.com/300x400/f9f9f9/666?text=Mohor'">
            </div>
            <div class="product-details-card">
                <span class="product-category-label">${displayCategory}</span>
                <h3>${displayTitle}</h3>
                <p class="product-price">৳ ${product.price}</p>
                <button class="add-to-cart-btn" style="padding: 10px; margin-top: 10px; font-size: 11px; width: 100%; border-radius: 4px;">${uiTranslations[currentLang].selectOptions}</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

function updateProducts() {
    if (typeof productsData === 'undefined') return;
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return; 

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

    if (sortValue === 'low-high') { filtered.sort((a, b) => a.price - b.price); } 
    else if (sortValue === 'high-low') { filtered.sort((a, b) => b.price - a.price); }

    renderProducts(filtered);
}

const checkboxes = document.querySelectorAll('.filter-checkbox');
checkboxes.forEach(cb => cb.addEventListener('change', updateProducts));
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) { sortSelect.addEventListener('change', updateProducts); }

// --- MODAL LOGIC ---
let currentViewingProduct = null;
let selectedSize = null;
let selectedColor = null;

function openProductModal(product) {
    const productModal = document.getElementById('productModal');
    if (!productModal) return;

    currentViewingProduct = product;
    selectedSize = null;
    selectedColor = null;
    document.getElementById('sizeWarning').style.display = 'none';
    document.getElementById('colorWarning').style.display = 'none';
    if(document.getElementById('sizeGuideDisplay')) { document.getElementById('sizeGuideDisplay').innerHTML = ""; }

    document.getElementById('modalTitle').innerText = getText(product.title);
    document.getElementById('modalPrice').innerText = `৳ ${product.price}`;
    document.getElementById('modalDesc').innerText = getText(product.description);
    
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
    
    let colorArray = [];
    if (product.colors) { colorArray = Array.isArray(product.colors) ? product.colors : (product.colors[currentLang] || product.colors['en'] || []); }

    if (colorArray.length > 0) {
        colorSection.style.display = 'block';
        colorArray.forEach((color) => {
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
    if(product.sizes) {
        product.sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.className = 'select-btn size-btn';
            btn.innerText = size;
            btn.onclick = () => selectOption(btn, size, 'size');
            sizesContainer.appendChild(btn);
        });
    }

    const detailsList = document.getElementById('modalDetails');
    detailsList.innerHTML = '';
    let detailsArray = [];
    if (product.details) { detailsArray = Array.isArray(product.details) ? product.details : (product.details[currentLang] || product.details['en'] || []); }
    
    detailsArray.forEach(detail => {
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
        
        const sizeGuideDisplay = document.getElementById('sizeGuideDisplay');
        if (sizeGuideDisplay) {
            if (currentViewingProduct.sizeMeasurements && currentViewingProduct.sizeMeasurements[value]) {
                sizeGuideDisplay.innerHTML = currentViewingProduct.sizeMeasurements[value][currentLang] || currentViewingProduct.sizeMeasurements[value]['en'];
            } else {
                sizeGuideDisplay.innerHTML = "";
            }
        }
    } else if (type === 'color') {
        selectedColor = value;
        document.getElementById('colorWarning').style.display = 'none';
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    }
    clickedBtn.classList.add('selected');
}

const closeModalBtn = document.getElementById('closeModalBtn');
if (closeModalBtn) { closeModalBtn.addEventListener('click', () => { document.getElementById('productModal').classList.remove('active'); }); }
const productModal = document.getElementById('productModal');
if (productModal) { productModal.addEventListener('click', (e) => { if (e.target === productModal) productModal.classList.remove('active'); }); }

const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', () => {
        let valid = true;
        if (!selectedSize) { document.getElementById('sizeWarning').style.display = 'inline'; valid = false; }
        if (!selectedColor) { document.getElementById('colorWarning').style.display = 'inline'; valid = false; }
        if (!valid) return;

        let displayName = typeof currentViewingProduct.title === 'string' ? currentViewingProduct.title : currentViewingProduct.title.en;
        if(selectedColor !== "Default") displayName += ` (${selectedColor})`;

        addToCart(displayName, currentViewingProduct.price, selectedSize);
        document.getElementById('productModal').classList.remove('active');
    });
}

// --- CART, QUANTITY & WHATSAPP LOGIC ---
let cart = [];
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsContainer = document.getElementById('cartItemsContainer');

document.getElementById('openCartBtn').addEventListener('click', () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); });
const closeCart = () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); };
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// NEW: Group items by name and size, add quantity tracking
function addToCart(name, price, size) {
    let existingItem = cart.find(item => item.name === name && item.size === size);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ name: name, price: price, size: size, qty: 1 });
    }
    
    updateCartUI();
    cartSidebar.classList.add('active'); cartOverlay.classList.add('active');
}

// NEW: Plus / Minus quantity controls
window.changeQty = function(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

// NEW: Dynamic Policy Display Logic
window.updateDeliveryPolicyAndTotal = function() {
    const zoneSelect = document.getElementById('deliveryZone');
    const policyDisplay = document.getElementById('dynamicPolicyDisplay');
    
    if (zoneSelect && policyDisplay) {
        if (zoneSelect.value === "80") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = uiTranslations[currentLang].policy1Text;
        } else if (zoneSelect.value === "150") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = uiTranslations[currentLang].policy2Text;
        } else {
            policyDisplay.style.display = "none";
        }
    }
    updateCartUI(); 
}

window.updateCartUI = function() {
    cartItemsContainer.innerHTML = ''; 
    let subtotal = 0;
    let totalItems = 0;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;">${uiTranslations[currentLang].cartEmpty}</p>`;
    } else {
        cart.forEach((item, index) => {
            let itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            totalItems += item.qty;
            
            // UPDATED UI: Includes + and - buttons
            cartItemsContainer.innerHTML += `
                <div class="cart-item" style="align-items: center;">
                    <div class="cart-item-info" style="flex: 1;">
                        <strong style="display: block; margin-bottom: 3px;">${item.name}</strong>
                        <span style="font-size: 11px; color: var(--text-light); text-transform: uppercase;">Size: ${item.size}</span>
                        
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <button onclick="changeQty(${index}, -1)" style="border: 1px solid var(--border-color); background: var(--soft-gray); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">-</button>
                            <span style="font-size: 13px; font-weight: 600;">${item.qty}</span>
                            <button onclick="changeQty(${index}, 1)" style="border: 1px solid var(--border-color); background: var(--soft-gray); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">+</button>
                        </div>
                    </div>
                    
                    <div style="text-align: right;">
                        <div style="font-weight:600; color:var(--primary-gold); margin-bottom: 5px;">৳${itemTotal}</div>
                        <button class="remove-item" onclick="changeQty(${index}, -${item.qty})" style="font-size: 10px;">Remove</button>
                    </div>
                </div>`;
        });
    }
    
    // Summary Calculations
    const zoneSelect = document.getElementById('deliveryZone');
    let deliveryFee = 0;
    if (zoneSelect && zoneSelect.value && cart.length > 0) {
        deliveryFee = parseInt(zoneSelect.value);
    }
    
    const finalTotal = subtotal + deliveryFee;
    
    if(document.getElementById('cartSubtotalValue')) document.getElementById('cartSubtotalValue').innerText = subtotal;
    if(document.getElementById('cartDeliveryValue')) document.getElementById('cartDeliveryValue').innerText = deliveryFee;
    if(document.getElementById('cartTotalValue')) document.getElementById('cartTotalValue').innerText = finalTotal;
    
    const cartBadge = document.getElementById('cartBadge');
    if(cartBadge) cartBadge.innerText = totalItems;
}

window.checkoutToWhatsApp = function() {
    if (cart.length === 0) { 
        alert(currentLang === 'en' ? "Your cart is empty." : "আপনার কার্ট খালি।"); 
        return; 
    }
    
    const nameInput = document.getElementById('custName') ? document.getElementById('custName').value.trim() : "";
    const phoneInput = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim() : "";
    const addressInput = document.getElementById('deliveryAddress') ? document.getElementById('deliveryAddress').value.trim() : "";
    const zoneSelect = document.getElementById('deliveryZone');
    const policyAgree = document.getElementById('policyAgree') ? document.getElementById('policyAgree').checked : false;

    if (!nameInput) { alert(currentLang === 'en' ? "Please enter your Full Name." : "অনুগ্রহ করে আপনার পুরো নাম দিন।"); return; }
    if (!phoneInput) { alert(currentLang === 'en' ? "Please enter your Mobile Number." : "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।"); return; }
    if (!addressInput) { alert(currentLang === 'en' ? "Please enter your delivery address." : "অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা দিন।"); return; }
    if (!zoneSelect || !zoneSelect.value) { alert(currentLang === 'en' ? "Please select a Delivery Zone." : "অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন।"); return; }
    if (!policyAgree) { alert(currentLang === 'en' ? "Please agree to the Delivery Policy." : "অনুগ্রহ করে ডেলিভারি পলিসিতে সম্মত হোন।"); return; }

    const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text;
    const deliveryFee = parseInt(zoneSelect.value);
    
    const WHATSAPP_NUMBER = "8801330113027"; 
    let message = "Hello Mohor Clothings! I would like to confirm my order:%0A%0A";
    let subtotal = 0;
    
    cart.forEach((item, index) => { 
        let itemTotal = item.price * item.qty;
        message += `${index + 1}. ${item.name} (Size: ${item.size}) | Qty: ${item.qty} - ৳${itemTotal}%0A`; 
        subtotal += itemTotal; 
    });
    
    message += `%0A*Subtotal: ৳${subtotal}*`;
    message += `%0A*Delivery (${zoneText}): ৳${deliveryFee}*`;
    message += `%0A*FINAL TOTAL: ৳${subtotal + deliveryFee}*%0A`;
    
    message += `%0A*CUSTOMER DETAILS:*%0AName: ${nameInput}%0APhone: ${phoneInput}%0AAddress: ${addressInput}`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

// Mobile Menu
document.getElementById('menuToggle').addEventListener('click', () => { document.getElementById('navLinks').classList.toggle('active'); });
const mobileFilterBtn = document.getElementById('mobileFilterBtn');
if(mobileFilterBtn) {
    mobileFilterBtn.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
        this.innerText = uiTranslations[currentLang].filterBtn;
    });
}

setTimeout(() => { updateUIText(); updateCartUI(); }, 100);
