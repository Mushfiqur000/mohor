// --- GLOBAL FIX: Normalize Product IDs ---
// This ensures product.html doesn't freeze when comparing URL string IDs ("1") to database number IDs (1)
if (typeof window.productsData !== 'undefined') {
    window.productsData.forEach(p => p.id = String(p.id));
}

// --- LANGUAGE DICTIONARY & LOCAL STORAGE FIX ---
// This saves the language so it doesn't reset when opening product pages
window.currentLang = localStorage.getItem('mohor_lang') || 'en';

window.uiTranslations = {
    en: {
        navShop: "Shop", 
        navAbout: "About Us", 
        navPolicy: "Policy", 
        navAccount: "Account",
        navCart: "Cart", 
        shopTitle: "Our Collection", 
        filterBtn: "Filters",
        sortDefault: "Sort by: Default", 
        sortLowHigh: "Price: Low to High", 
        sortHighLow: "Price: High to Low",
        catTitle: "Categories", 
        catKurti: "Kurti", 
        catThreePiece: "Three Piece", 
        catKhadi: "Khadi", 
        catFormal: "Formal Wear",
        priceTitle: "Price", 
        price1: "Under ৳1500", 
        price2: "৳1500 - ৳2500", 
        price3: "Above ৳2500",
        noProducts: "No products match your filters.", 
        sizeSelect: "Select Size", 
        sizeWarning: "*Please select a size",
        colorSelect: "Select Color", 
        colorWarning: "*Please select a color", 
        descTitle: "Description",
        detailsTitle: "Product Details", 
        addToCart: "Add to Cart", 
        buyNow: "Buy Now",
        backBtn: "&#8592; Back",
        cartTitle: "Your Cart", 
        cartEmpty: "Your cart is empty.",
        cartSubtotal: "Subtotal:", 
        cartDelivery: "Delivery Charge:", 
        cartTotal: "Final Total:",
        btnConfirmOrder: "Confirm Order (Website)",
        btnWhatsApp: "Order by WhatsApp",
        footerText: "© 2026 Mohor Clothings Bangladesh. All Rights Reserved.",
        selectOptions: "Select Size & Add to Cart", 
        searchPlaceholder: "Search dresses, formal, khadi...",
        checkoutName: "Full Name *",
        checkoutPhone: "Mobile Number *",
        checkoutAddress: "Complete Delivery Address *",
        deliveryAddressLabel: "Delivery Address *", 
        policyAgreeText: "I agree to the", 
        policyLink: "Delivery & Return Policy",
        selectDeliveryZone: "Select Delivery Zone *", 
        zoneInside: "Inside Sylhet (৳80)", 
        zoneOutside: "Outside Sylhet (৳150)",
        aboutTitle: "About Mohor Clothings",
        aboutText: "Welcome to Mohor Clothings, your premier destination for handcrafted luxury fashion in Bangladesh. From our breathable, premium soft cotton Three-Piece ensembles to our elegantly tailored Kurtis and authentic Khadi wear, every piece is designed with the modern woman in mind. Whether you are stepping into a university classroom, leading a corporate meeting, or celebrating a festive occasion, our collections offer the perfect fit. Proudly serving Sylhet and customers nationwide, we are dedicated to bringing you high-quality embroidery and timeless designs that empower your everyday wardrobe.",
        
        // ACCOUNT & PROFILE TRANSLATIONS
        accTitle: "Customer Account",
        accLoginTitle: "Login to Your Account",
        accEmailPlaceholder: "Email Address",
        accPassPlaceholder: "Password",
        accLoginBtn: "LOG IN",
        accNoAccount: "Don't have an account?",
        accSignUpLink: "Sign up",
        accSignupTitle: "Create an Account",
        accNamePlaceholder: "Full Name",
        accPassMinPlaceholder: "Password (min 6 chars)",
        accSignupBtn: "SIGN UP",
        accHasAccount: "Already have an account?",
        accLoginLink: "Log in",
        accLoggedInAs: "Logged in as:",
        accLogoutBtn: "LOG OUT",
        accSavedProfile: "Saved Profile",
        accPhonePlaceholder: "Default Phone",
        accAddressPlaceholder: "Default Delivery Address",
        accSaveProfileBtn: "Save Profile",
        accOrderHistory: "My Order History",
        accLoadingOrders: "Loading orders...",

        // POLICY PAGE TRANSLATIONS
        policyPageTitle: "Delivery & Return Policy",
        policy1Title: "1. Delivery Information",
        policy1Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>Estimated delivery time: 1–2 business days.</li><li>Delivery time may vary due to weather or courier delays.</li><li>Our delivery partner will contact you before delivery.</li></ul>",
        policy2Title: "2. Order Confirmation",
        policy2Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>Estimated delivery time: 2–5 business days.</li><li>Delivery time may be longer during national holidays.</li><li>Our courier partner may contact you before delivery.</li></ul>",
        policy3Title: "3. Return & Exchange Policy",
        policy3Text: "We take pride in the quality of our handcrafted clothing. However, if you receive a defective or incorrect item, please notify us within 24 hours of receiving the delivery. The item must be unused, unwashed, and in its original packaging with tags intact. Please record an unboxing video to claim any damages or defects.",
        policy4Title: "4. Color Disclaimer",
        policy4Text: "While we strive to ensure our images accurately represent the product, actual colors may slightly vary due to lighting during photography or your device's display settings. Exchanges will not be accommodated purely for slight color variations."
    },
    bn: {
        navShop: "শপ", 
        navAbout: "আমাদের সম্পর্কে", 
        navPolicy: "পলিসি", 
        navAccount: "অ্যাকাউন্ট",
        navCart: "কার্ট", 
        shopTitle: "আমাদের কালেকশন", 
        filterBtn: "ফিল্টার",
        sortDefault: "সর্ট: ডিফল্ট", 
        sortLowHigh: "দাম: কম থেকে বেশি", 
        sortHighLow: "দাম: বেশি থেকে কম",
        catTitle: "ক্যাটাগরি", 
        catKurti: "কুর্তি", 
        catThreePiece: "থ্রি-পিস", 
        catKhadi: "খাদি", 
        catFormal: "ফরমাল ওয়্যার",
        priceTitle: "দাম", 
        price1: "৳১৫০০ এর নিচে", 
        price2: "৳১৫০০ - ৳২৫০০", 
        price3: "৳২৫০০ এর উপরে",
        noProducts: "আপনার ফিল্টারের সাথে মিলে এমন কোনো পণ্য নেই।", 
        sizeSelect: "সাইজ নির্বাচন করুন", 
        sizeWarning: "*দয়া করে একটি সাইজ নির্বাচন করুন",
        colorSelect: "রং নির্বাচন করুন", 
        colorWarning: "*দয়া করে একটি রং নির্বাচন করুন", 
        descTitle: "বিবরণ",
        detailsTitle: "পণ্যের বিস্তারিত", 
        addToCart: "কার্টে যোগ করুন", 
        buyNow: "এখনি কিনুন",
        backBtn: "&#8592; ফিরে যান",
        cartTitle: "আপনার কার্ট", 
        cartEmpty: "আপনার কার্ট খালি।",
        cartSubtotal: "সাবটোটাল:", 
        cartDelivery: "ডেলিভারি চার্জ:", 
        cartTotal: "মোট মূল্য:",
        btnConfirmOrder: "অর্ডার কনফার্ম করুন (ওয়েবসাইট)",
        btnWhatsApp: "হোয়াটসঅ্যাপে অর্ডার করুন",
        footerText: "© ২০২৬ মোহর ক্লথিংস বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
        selectOptions: "সাইজ নির্বাচন করুন", 
        searchPlaceholder: "ড্রেস, ফরমাল, খাদি খুঁজুন...",
        checkoutName: "সম্পূর্ণ নাম *",
        checkoutPhone: "মোবাইল নম্বর *",
        checkoutAddress: "সম্পূর্ণ ডেলিভারি ঠিকানা *",
        deliveryAddressLabel: "ডেলিভারি ঠিকানা *", 
        policyAgreeText: "আমি সম্মত হচ্ছি", 
        policyLink: "ডেলিভারি ও রিটার্ন পলিসিতে",
        selectDeliveryZone: "ডেলিভারি জোন নির্বাচন করুন *", 
        zoneInside: "সিলেটের ভেতরে (৳৮০)", 
        zoneOutside: "সিলেটের বাইরে (৳১৫০)",
        aboutTitle: "মোহর ক্লথিংস সম্পর্কে",
        aboutText: "মোহর ক্লথিংস-এ আপনাকে স্বাগতম, বাংলাদেশে হাতে তৈরি লাক্সারি ফ্যাশনের অন্যতম বিশ্বস্ত নাম। আমাদের আরামদায়ক প্রিমিয়াম সফট কটন থ্রি-পিস থেকে শুরু করে আকর্ষণীয় কুর্তি এবং ঐতিহ্যবাহী খাদি পোশাক—প্রতিটি ডিজাইন তৈরি করা হয়েছে আধুনিক নারীদের কথা মাথায় রেখে। আপনি ইউনিভার্সিটির ক্লাসে যান, কর্পোরেট মিটিং পরিচালনা করুন বা কোনো উৎসব উদযাপন করুন, আমাদের কালেকশনে আপনার জন্য মানানসই পোশাক রয়েছে। সিলেট থেকে শুরু করে সারা দেশের গ্রাহকদের জন্য উচ্চমানের এমব্রয়ডারি এবং মানসম্মত ডিজাইনের পোশাক পৌঁছে দিতে আমরা প্রতিশ্রুতিবদ্ধ।",
        
        // ACCOUNT & PROFILE TRANSLATIONS
        accTitle: "গ্রাহক অ্যাকাউন্ট",
        accLoginTitle: "আপনার অ্যাকাউন্টে লগইন করুন",
        accEmailPlaceholder: "ইমেইল ঠিকানা",
        accPassPlaceholder: "পাসওয়ার্ড",
        accLoginBtn: "লগইন করুন",
        accNoAccount: "অ্যাকাউন্ট নেই?",
        accSignUpLink: "সাইন আপ করুন",
        accSignupTitle: "নতুন অ্যাকাউন্ট তৈরি করুন",
        accNamePlaceholder: "সম্পূর্ণ নাম",
        accPassMinPlaceholder: "পাসওয়ার্ড (সর্বনিম্ন ৬ অক্ষর)",
        accSignupBtn: "সাইন আপ করুন",
        accHasAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",
        accLoginLink: "লগইন করুন",
        accLoggedInAs: "লগইন করা আছে:",
        accLogoutBtn: "লগ আউট",
        accSavedProfile: "সংরক্ষিত প্রোফাইল",
        accPhonePlaceholder: "ডিফল্ট ফোন নম্বর",
        accAddressPlaceholder: "ডিফল্ট ডেলিভারি ঠিকানা",
        accSaveProfileBtn: "প্রোফাইল সেভ করুন",
        accOrderHistory: "আমার অর্ডার হিস্ট্রি",
        accLoadingOrders: "অর্ডার লোড হচ্ছে...",

        // POLICY PAGE TRANSLATIONS
        policyPageTitle: "ডেলিভারি ও রিটার্ন পলিসি",
        policy1Title: "১. ডেলিভারি তথ্য",
        policy1Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>আনুমানিক ডেলিভারি সময়: ১-২ কর্মদিবস।</li><li>আবহাওয়া বা কুরিয়ার বিলম্বের কারণে সময় পরিবর্তিত হতে পারে।</li><li>ডেলিভারির আগে আমাদের পার্টনার যোগাযোগ করবে।</li></ul>",
        policy2Title: "২. অর্ডার কনফার্মেশন",
        policy2Text: "<ul style='margin-left: 15px; margin-top: 5px;'><li>আনুমানিক ডেলিভারি সময়: ২-৫ কর্মদিবস।</li><li>জাতীয় ছুটির দিনে সময় দীর্ঘ হতে পারে।</li><li>আমাদের কুরিয়ার পার্টনার যোগাযোগ করতে পারে।</li></ul>",
        policy3Title: "৩. রিটার্ন ও এক্সচেঞ্জ পলিসি",
        policy3Text: "আমরা আমাদের হাতে তৈরি পোশাকের মানের বিষয়ে গর্ববোধ করি। তবে, যদি আপনি কোনো ত্রুটিপূর্ণ বা ভুল পণ্য পান, অনুগ্রহ করে ডেলিভারি পাওয়ার ২৪ ঘণ্টার মধ্যে আমাদের জানান। পণ্যটি অবশ্যই অব্যবহৃত, ধোয়া হয়নি এমন, এবং অরিজিনাল প্যাকেজিং ও ট্যাগযুক্ত থাকতেരുവ। কোনো ক্ষতি বা ত্রুটি দাবি করার জন্য অনুগ্রহ করে একটি আনবক্সিং ভিডিও রেকর্ড করুন।",
        policy4Title: "৪. রঙের ডিসক্লেইমার",
        policy4Text: "যদিও আমরা নিশ্চিত করার চেষ্টা করি যে আমাদের ছবিগুলো পণ্যের সঠিক রং উপস্থাপন করে, ফটোগ্রাফির সময় আলোর কারণে বা আপনার ডিভাইসের ডিসপ্লে সেটিংসের কারণে আসল রং সামান্য ভিন্ন হতে পারে। শুধুমাত্র সামান্য রঙের পার্থক্যের কারণে কোনো এক্সচেঞ্জ গ্রহণ করা হবে কাম্য।"
    }
};

function getText(dataField) {
    if (!dataField) return "";
    if (typeof dataField === 'string') return dataField; 
    return dataField[window.currentLang] || dataField['en'] || "";
}

function updateUIText() {
    // Translate plain text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (window.uiTranslations[window.currentLang] && window.uiTranslations[window.currentLang][key]) {
            if (el.tagName === 'OPTION') {
                el.innerText = window.uiTranslations[window.currentLang][key];
            } else {
                el.innerHTML = window.uiTranslations[window.currentLang][key];
            }
        }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (window.uiTranslations[window.currentLang] && window.uiTranslations[window.currentLang][key]) {
            el.placeholder = window.uiTranslations[window.currentLang][key];
        }
    });
    
    // Refresh product grid if exists
    if (document.getElementById('productGrid')) { 
        updateProducts(); 
    }
    
    // Call external UI update functions safely
    if (typeof window.updateCartUI === "function") window.updateCartUI();
    if (typeof window.updateDeliveryPolicyAndTotal === "function") window.updateDeliveryPolicyAndTotal();
}

const langToggleBtn = document.getElementById('langToggleBtn');
if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
        window.currentLang = (window.currentLang === 'en') ? 'bn' : 'en';
        // UPGRADE: Save to local storage so memory persists
        localStorage.setItem('mohor_lang', window.currentLang);
        updateUIText();
        
        // Dispatch custom event to notify product.html to re-render dynamic text
        window.dispatchEvent(new Event('languageChanged'));

        // Safely reloads only the product page to translate dynamic database content
        if (window.location.pathname.includes('product.html')) {
            window.location.reload();
        }
    });
}


// --- PRODUCT RENDERING & FILTERING ---
function renderProducts(productsToRender) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return; 
    
    productGrid.innerHTML = '';
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: #666;">${window.uiTranslations[window.currentLang].noProducts}</p>`;
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // --- HYBRID RESPONSIVE VIEW LOGIC ---
        card.onclick = () => {
            if (window.innerWidth <= 900) {
                // Mobile: Navigate to dedicated product page (Ensuring ID is a string)
                window.location.href = `product.html?id=${String(product.id)}`;
            } else {
                // Desktop: Open Modal
                if (typeof window.openQuickView === "function") {
                    window.openQuickView(String(product.id));
                } else {
                    openProductModal(product);
                }
            }
        };
        
        const coverImage = product.images && product.images.length > 0 ? product.images[0] : '';
        const displayTitle = getText(product.title);
        const displayCategory = (product.category || "").replace('-', ' ');

        card.innerHTML = `
            <div class="image-container">
                <img src="${coverImage}" alt="${displayTitle}" class="product-image" onerror="this.src='https://via.placeholder.com/300x400/f9f9f9/666?text=Mohor'">
            </div>
            <div class="product-details-card">
                <div>
                    <span class="product-category-label">${displayCategory}</span>
                    <h3>${displayTitle}</h3>
                    <div class="product-price">৳ ${product.price}</div>
                </div>
                <button class="quick-view-btn">${window.uiTranslations[window.currentLang].selectOptions}</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

function updateProducts() {
    // FIX: Safely pull from window.productsData to prevent cross-file referencing errors on other pages
    let sourceData = (typeof window.firestoreProducts !== 'undefined' && window.firestoreProducts.length > 0) 
        ? window.firestoreProducts 
        : (window.productsData || []);

    if (sourceData.length === 0) return;

    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput'); 
    if (!sortSelect) return; 

    const activeCategories = Array.from(document.querySelectorAll('input[id^="cat-"]:checked')).map(cb => cb.value);
    const activePrices = Array.from(document.querySelectorAll('.price-filter:checked')).map(cb => cb.value);
    const sortValue = sortSelect.value;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : ''; 

    let filtered = sourceData.filter(product => {
        let catMatch = activeCategories.length === 0 || activeCategories.includes(product.category);
        let priceMatch = activePrices.length === 0;
        
        if (!priceMatch) {
            if (activePrices.includes('under-1500') && product.price < 1500) priceMatch = true;
            if (activePrices.includes('1500-2500') && product.price >= 1500 && product.price <= 2500) priceMatch = true;
            if (activePrices.includes('above-2500') && product.price > 2500) priceMatch = true;
        }

        // --- SMART BROAD SEARCH LOGIC ---
        let searchMatch = true;
        if (searchTerm !== '') {
            let productText = `${getText(product.title)} ${product.category || ''} ${getText(product.description) || ''}`.toLowerCase();
            
            if (productText.includes('formal')) productText += ' dress outfit wear office professional corporate';
            if (productText.includes('kurti')) productText += ' dress outfit single shirt top casual';
            if (productText.includes('three-piece') || productText.includes('three piece')) productText += ' dress outfit suit salwar kameez set';
            if (productText.includes('khadi')) productText += ' dress outfit traditional cotton ethnic authentic';

            let searchKeywords = searchTerm.split(/\s+/);
            searchMatch = searchKeywords.every(word => productText.includes(word));
        }

        return catMatch && priceMatch && searchMatch;
    });

    if (sortValue === 'low-high') { filtered.sort((a, b) => a.price - b.price); } 
    else if (sortValue === 'high-low') { filtered.sort((a, b) => b.price - a.price); }

    renderProducts(filtered);
}

// Attach event listeners for filters & search
const checkboxes = document.querySelectorAll('.filter-checkbox');
checkboxes.forEach(cb => cb.addEventListener('change', updateProducts));

const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
    sortSelect.addEventListener('change', updateProducts);
}

const searchInput = document.getElementById('searchInput');
if (searchInput) { 
    searchInput.addEventListener('input', updateProducts); 
}


// --- MODAL LOGIC (FALLBACK) ---
let currentViewingProduct = null;
let selectedSize = null;
let selectedColor = null;

function openProductModal(product) {
    const productModal = document.getElementById('productModal');
    if (!productModal) return;

    currentViewingProduct = product;
    selectedSize = null;
    selectedColor = null;
    
    if (document.getElementById('sizeWarning')) document.getElementById('sizeWarning').style.display = 'none';
    if (document.getElementById('colorWarning')) document.getElementById('colorWarning').style.display = 'none';
    if (document.getElementById('sizeGuideDisplay')) document.getElementById('sizeGuideDisplay').innerHTML = ""; 

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
    if (product.colors) { colorArray = Array.isArray(product.colors) ? product.colors : (product.colors[window.currentLang] || product.colors['en'] || []); }

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
    if (product.details) { detailsArray = Array.isArray(product.details) ? product.details : (product.details[window.currentLang] || product.details['en'] || []); }
    
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
        if(document.getElementById('sizeWarning')) document.getElementById('sizeWarning').style.display = 'none';
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        
        const sizeGuideDisplay = document.getElementById('sizeGuideDisplay');
        if (sizeGuideDisplay && currentViewingProduct) {
            if (currentViewingProduct.sizeMeasurements && currentViewingProduct.sizeMeasurements[value]) {
                sizeGuideDisplay.innerHTML = currentViewingProduct.sizeMeasurements[value][window.currentLang] || currentViewingProduct.sizeMeasurements[value]['en'];
            } else {
                sizeGuideDisplay.innerHTML = "";
            }
        }
    } else if (type === 'color') {
        selectedColor = value;
        if(document.getElementById('colorWarning')) document.getElementById('colorWarning').style.display = 'none';
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    }
    clickedBtn.classList.add('selected');
}

const closeModalBtn = document.getElementById('closeModalBtn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => { document.getElementById('productModal').classList.remove('active'); });
}

const productModal = document.getElementById('productModal');
if (productModal) {
    productModal.addEventListener('click', (e) => { if (e.target === productModal) productModal.classList.remove('active'); });
}

const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
if (modalAddToCartBtn) {
    modalAddToCartBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        let valid = true;
        if (!selectedSize) { if(document.getElementById('sizeWarning')) document.getElementById('sizeWarning').style.display = 'inline'; valid = false; }
        if (!selectedColor) { if(document.getElementById('colorWarning')) document.getElementById('colorWarning').style.display = 'inline'; valid = false; }
        if (!valid) return;

        let displayName = typeof currentViewingProduct.title === 'string' ? currentViewingProduct.title : currentViewingProduct.title.en;
        if(selectedColor !== "Default") displayName += ` (${selectedColor})`;

        if(typeof window.addToCart === "function") {
            window.addToCart(displayName, currentViewingProduct.price, selectedSize);
        }
        document.getElementById('productModal').classList.remove('active');
    });
}

// Mobile Menu Navigation
const menuToggle = document.getElementById('menuToggle');
if (menuToggle) {
    menuToggle.addEventListener('click', () => { 
        const navLinks = document.getElementById('navLinks');
        if (navLinks) navLinks.classList.toggle('active'); 
    });
}

const mobileFilterBtn = document.getElementById('mobileFilterBtn');
if(mobileFilterBtn) {
    mobileFilterBtn.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('active');
        this.innerText = window.uiTranslations[window.currentLang].filterBtn;
    });
}

// --- HYBRID RESPONSIVE ROUTING FOR CART ---
// This safely intercepts the Cart button click on mobile devices
const topNavCartBtn = document.getElementById('openCartBtn');
if (topNavCartBtn) {
    topNavCartBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) {
            // Stop cart.js from opening the sidebar on mobile and redirect instead
            e.preventDefault();
            e.stopPropagation(); 
            window.location.href = 'cart.html';
        } else {
            // On desktop, safely ensure the cart sidebar opens
            const cartOverlay = document.getElementById('cartOverlay');
            const cartSidebar = document.getElementById('cartSidebar');
            if(cartOverlay && cartSidebar) {
                cartOverlay.classList.add('active');
                cartSidebar.classList.add('active');
            }
        }
    }, true); // We use 'true' to capture the event before cart.js can trigger
}

// Initialize Translations on Page Load
setTimeout(() => { updateUIText(); }, 100);
