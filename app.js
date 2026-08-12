// ==========================================================================
// MOHOR CLOTHINGS — app.js
// Core UI: language/i18n, product catalog loading + rendering, quick-view
// modal, nav interactions, toast notifications, scroll reveals.
// ==========================================================================

// --- GLOBAL FIX: Normalize Product IDs ---
// Ensures product.html / cart price verification never mismatch a URL
// string id ("1") against a database number id (1).
if (typeof window.productsData !== 'undefined') {
    window.productsData.forEach(p => p.id = String(p.id));
}

// --- LANGUAGE STATE ---
window.currentLang = localStorage.getItem('mohor_lang') || 'en';
document.documentElement.lang = window.currentLang;

window.uiTranslations = {
    en: {
        navShop: "Shop", navOrders: "Order History", navAbout: "About Us", navPolicy: "Policy", navAccount: "Account", navCart: "Cart",
        shopTitle: "Our Collection",
        shopSubtitle: "Handcrafted three-piece sets, kurtis and khadi wear — cut and stitched in small batches.",
        filterBtn: "Filters", closeFilters: "Close",
        sortDefault: "Sort by: Featured", sortLowHigh: "Price: Low to High", sortHighLow: "Price: High to Low",
        catTitle: "Category", catKurti: "Kurti", catThreePiece: "Three Piece", catKhadi: "Khadi", catFormal: "Formal Wear",
        priceTitle: "Price", price1: "Under ৳1500", price2: "৳1500 – ৳2500", price3: "Above ৳2500",
        clearFilters: "Clear all",
        noProducts: "No pieces match your filters just yet. Try clearing a few and searching again.",
        searchPlaceholder: "Search the collection…",
        sizeSelect: "Select Size", sizeWarning: "Please select a size", colorSelect: "Select Color", colorWarning: "Please select a color",
        descTitle: "Description", detailsTitle: "The Details",
        addToCart: "Add to Cart", buyNow: "Buy Now", selectOptions: "View Options", backBtn: "Back",
        addedToCart: "Added to your cart",
        cartTitle: "Your Cart", cartEmpty: "Your cart is empty.", cartEmptySub: "Pieces you add will appear here.",
        continueShopping: "Continue Shopping",
        cartSubtotal: "Subtotal", cartDelivery: "Delivery", cartTotal: "Total",
        btnConfirmOrder: "Confirm Order", btnWhatsApp: "Order via WhatsApp", orWhatsapp: "or",
        footerText: "© 2026 Mohor Clothings Bangladesh. All Rights Reserved.",
        footerTagline: "Handcrafted luxury fashion, stitched with tradition — from Sylhet to all of Bangladesh.",
        footerShopHeading: "Shop", footerHelpHeading: "Help", footerContactHeading: "Contact",
        footerDelivery: "Nationwide delivery across Bangladesh",
        footerMadeWith: "Handcrafted in Sylhet",
        checkoutName: "Full Name *", checkoutPhone: "Mobile Number *", checkoutAddress: "Complete Address *",
        deliveryAddressLabel: "Delivery Address *",
        policyAgreeText: "I agree to the", policyLink: "Delivery & Return Policy",
        selectDeliveryZone: "Select Delivery Zone *", zoneInside: "Inside Sylhet (৳80)", zoneOutside: "Outside Sylhet (৳150)",
        zoneDeliveryInside: "Inside Sylhet: estimated delivery in 1–3 business days. Our team will confirm by phone before dispatch.",
        zoneDeliveryOutside: "Outside Sylhet: estimated delivery in 3–5 business days via courier. Our team will confirm by phone before dispatch.",
        aboutEyebrow: "Est. in Sylhet",
        aboutTitle: "About Mohor Clothings",
        aboutText: "Welcome to Mohor Clothings, your premier destination for handcrafted luxury fashion in Bangladesh. From our breathable, premium soft cotton Three-Piece ensembles to our elegantly tailored Kurtis and authentic Khadi wear, every piece is designed with the modern woman in mind. Whether you are stepping into a university classroom, leading a corporate meeting, or celebrating a festive occasion, our collections offer the perfect fit. Proudly serving Sylhet and customers nationwide, we are dedicated to bringing you high-quality embroidery and timeless designs that empower your everyday wardrobe.",
        pillar1Title: "Handcrafted Detail", pillar1Text: "High-quality embroidery and finishing worked by hand into every piece.",
        pillar2Title: "Premium Fabric", pillar2Text: "Breathable, premium soft cotton and authentic khadi chosen for comfort.",
        pillar3Title: "Nationwide Delivery", pillar3Text: "Proudly serving Sylhet and shipping to customers all across Bangladesh.",

        accTitle: "Customer Account", accLoginTitle: "Login to Your Account",
        accEmailPlaceholder: "Email Address", accPassPlaceholder: "Password",
        accLoginBtn: "Log In", accNoAccount: "Don't have an account?", accSignUpLink: "Sign up",
        accSignupTitle: "Create an Account", accNamePlaceholder: "Full Name", accPassMinPlaceholder: "Password (min 6 characters)",
        accSignupBtn: "Sign Up", accHasAccount: "Already have an account?", accLoginLink: "Log in",
        accLoggedInAs: "Logged in as", accLogoutBtn: "Log Out",
        accSavedProfile: "Saved Profile", accProfileNamePlaceholder: "Your Name",
        accPhonePlaceholder: "Default Phone", accAddressPlaceholder: "Default Delivery Address",
        accSaveProfileBtn: "Save Profile", accOrderHistory: "My Order History",
        accLoadingOrders: "Loading orders…", accNoOrders: "No order history found yet.",

        policyPageTitle: "Delivery & Return Policy",
        policyEyebrow: "Please read before ordering",
        policy1Title: "Delivery Information",
        policy1Text: "We deliver nationwide across Bangladesh. For orders within Sylhet, the standard delivery time is 1–3 business days. For orders outside Sylhet, delivery typically takes 3–5 business days. Delivery charges are calculated by zone and shown at checkout.",
        policy2Title: "Order Confirmation",
        policy2Text: "Once you place an order via WhatsApp or the website, our team verifies product availability and sends you a confirmation message along with the final bill, including delivery charges, before processing.",
        policy3Title: "Return & Exchange Policy",
        policy3Text: "We take pride in the quality of our handcrafted clothing. However, if you receive a defective or incorrect item, please notify us within 24 hours of receiving the delivery. The item must be unused, unwashed, and in its original packaging with tags intact. Please record an unboxing video to claim any damages or defects.",
        policy4Title: "Color Disclaimer",
        policy4Text: "While we strive to ensure our images accurately represent the product, actual colors may slightly vary due to lighting during photography or your device's display settings. Exchanges will not be accommodated purely for slight color variations.",

        loginPageTitle: "Welcome to Mohor", loginPageSub: "Log in to save your details for faster checkout.",
        continueGuest: "Continue as Guest",
    },
    bn: {
        navShop: "শপ", navOrders: "অর্ডার হিস্ট্রি", navAbout: "আমাদের সম্পর্কে", navPolicy: "পলিসি", navAccount: "অ্যাকাউন্ট", navCart: "কার্ট",
        shopTitle: "আমাদের কালেকশন",
        shopSubtitle: "হাতে তৈরি থ্রি-পিস, কুর্তি ও খাদি — অল্প সংখ্যায় যত্নসহকারে তৈরি।",
        filterBtn: "ফিল্টার", closeFilters: "বন্ধ করুন",
        sortDefault: "সাজান: ফিচার্ড", sortLowHigh: "দাম: কম থেকে বেশি", sortHighLow: "দাম: বেশি থেকে কম",
        catTitle: "ক্যাটাগরি", catKurti: "কুর্তি", catThreePiece: "থ্রি-পিস", catKhadi: "খাদি", catFormal: "ফরমাল ওয়্যার",
        priceTitle: "মূল্য", price1: "৳১৫০০ এর নিচে", price2: "৳১৫০০ – ৳২৫০০", price3: "৳২৫০০ এর উপরে",
        clearFilters: "সব মুছুন",
        noProducts: "আপনার ফিল্টারের সাথে মিলছে এমন কিছু পাওয়া যায়নি। কিছু ফিল্টার মুছে আবার চেষ্টা করুন।",
        searchPlaceholder: "কালেকশনে খুঁজুন…",
        sizeSelect: "সাইজ নির্বাচন করুন", sizeWarning: "অনুগ্রহ করে একটি সাইজ নির্বাচন করুন", colorSelect: "রং নির্বাচন করুন", colorWarning: "অনুগ্রহ করে একটি রং নির্বাচন করুন",
        descTitle: "বিবরণ", detailsTitle: "বিস্তারিত",
        addToCart: "কার্টে যোগ করুন", buyNow: "এখনই কিনুন", selectOptions: "বিস্তারিত দেখুন", backBtn: "ফিরে যান",
        addedToCart: "কার্টে যোগ করা হয়েছে",
        cartTitle: "আপনার কার্ট", cartEmpty: "আপনার কার্ট খালি।", cartEmptySub: "আপনার যোগ করা পণ্য এখানে দেখা যাবে।",
        continueShopping: "কেনাকাটা চালিয়ে যান",
        cartSubtotal: "সাবটোটাল", cartDelivery: "ডেলিভারি", cartTotal: "সর্বমোট",
        btnConfirmOrder: "অর্ডার কনফার্ম করুন", btnWhatsApp: "হোয়াটসঅ্যাপে অর্ডার করুন", orWhatsapp: "অথবা",
        footerText: "© ২০২৬ মোহর ক্লথিংস বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।",
        footerTagline: "ঐতিহ্যের সুতোয় বোনা হাতে তৈরি বিলাসবহুল ফ্যাশন — সিলেট থেকে সারা বাংলাদেশে।",
        footerShopHeading: "শপ", footerHelpHeading: "সহায়তা", footerContactHeading: "যোগাযোগ",
        footerDelivery: "সারা বাংলাদেশে ডেলিভারি",
        footerMadeWith: "সিলেটে হাতে তৈরি",
        checkoutName: "পুরো নাম *", checkoutPhone: "মোবাইল নম্বর *", checkoutAddress: "সম্পূর্ণ ঠিকানা *",
        deliveryAddressLabel: "ডেলিভারি ঠিকানা *",
        policyAgreeText: "আমি সম্মত", policyLink: "ডেলিভারি ও রিটার্ন পলিসিতে",
        selectDeliveryZone: "ডেলিভারি জোন নির্বাচন করুন *", zoneInside: "সিলেটের ভিতরে (৳৮০)", zoneOutside: "সিলেটের বাইরে (৳১৫০)",
        zoneDeliveryInside: "সিলেটের ভিতরে: আনুমানিক ডেলিভারি সময় ১–৩ কর্মদিবস। পাঠানোর আগে আমাদের টিম ফোনে নিশ্চিত করবে।",
        zoneDeliveryOutside: "সিলেটের বাইরে: কুরিয়ারে আনুমানিক ডেলিভারি সময় ৩–৫ কর্মদিবস। পাঠানোর আগে আমাদের টিম ফোনে নিশ্চিত করবে।",
        aboutEyebrow: "সিলেটে প্রতিষ্ঠিত",
        aboutTitle: "মোহর ক্লথিংস সম্পর্কে",
        aboutText: "মোহর ক্লথিংসে আপনাকে স্বাগতম — বাংলাদেশে হাতে তৈরি বিলাসবহুল ফ্যাশনের জন্য আপনার প্রধান গন্তব্য। আমাদের নিঃশ্বাসযোগ্য, প্রিমিয়াম সফট কটন থ্রি-পিস থেকে শুরু করে মার্জিতভাবে তৈরি কুর্তি এবং প্রকৃত খাদি পোশাক — প্রতিটি পিস আধুনিক নারীর কথা মাথায় রেখে ডিজাইন করা হয়েছে। আপনি বিশ্ববিদ্যালয়ের ক্লাসে যান, কর্পোরেট মিটিং পরিচালনা করুন বা উৎসব উদযাপন করুন — আমাদের কালেকশনে রয়েছে উপযুক্ত পোশাক। সিলেট ও সারা দেশের গ্রাহকদের সেবা দিতে পেরে আমরা গর্বিত, এবং উচ্চমানের এমব্রয়ডারি ও কালজয়ী ডিজাইন আপনার নিত্যদিনের পোশাকে যোগ করতে আমরা প্রতিশ্রুতিবদ্ধ।",
        pillar1Title: "হস্তনির্মিত বিবরণ", pillar1Text: "প্রতিটি পিসে হাতে করা উচ্চমানের এমব্রয়ডারি ও ফিনিশিং।",
        pillar2Title: "প্রিমিয়াম ফেব্রিক", pillar2Text: "আরামের জন্য বেছে নেওয়া নিঃশ্বাসযোগ্য প্রিমিয়াম সফট কটন ও প্রকৃত খাদি।",
        pillar3Title: "সারাদেশে ডেলিভারি", pillar3Text: "সিলেট ও সারা বাংলাদেশের গ্রাহকদের কাছে গর্বের সাথে পৌঁছে দিচ্ছি।",

        accTitle: "কাস্টমার অ্যাকাউন্ট", accLoginTitle: "আপনার অ্যাকাউন্টে লগইন করুন",
        accEmailPlaceholder: "ইমেইল ঠিকানা", accPassPlaceholder: "পাসওয়ার্ড",
        accLoginBtn: "লগইন", accNoAccount: "অ্যাকাউন্ট নেই?", accSignUpLink: "সাইন আপ করুন",
        accSignupTitle: "একটি অ্যাকাউন্ট তৈরি করুন", accNamePlaceholder: "পুরো নাম", accPassMinPlaceholder: "পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)",
        accSignupBtn: "সাইন আপ", accHasAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?", accLoginLink: "লগইন করুন",
        accLoggedInAs: "লগইন করা আছে", accLogoutBtn: "লগ আউট",
        accSavedProfile: "সংরক্ষিত প্রোফাইল", accProfileNamePlaceholder: "আপনার নাম",
        accPhonePlaceholder: "ডিফল্ট ফোন নম্বর", accAddressPlaceholder: "ডিফল্ট ডেলিভারি ঠিকানা",
        accSaveProfileBtn: "প্রোফাইল সেভ করুন", accOrderHistory: "আমার অর্ডার হিস্ট্রি",
        accLoadingOrders: "অর্ডার লোড হচ্ছে…", accNoOrders: "কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি।",

        policyPageTitle: "ডেলিভারি ও রিটার্ন পলিসি",
        policyEyebrow: "অর্ডারের আগে পড়ুন",
        policy1Title: "ডেলিভারি তথ্য",
        policy1Text: "আমরা সারা বাংলাদেশে ডেলিভারি দিয়ে থাকি। সিলেটের ভিতরে অর্ডারের জন্য স্ট্যান্ডার্ড ডেলিভারি সময় ১–৩ কর্মদিবস। সিলেটের বাইরে সাধারণত ৩–৫ কর্মদিবস সময় লাগে। ডেলিভারি চার্জ জোন অনুযায়ী নির্ধারিত হয় এবং চেকআউটে দেখানো হয়।",
        policy2Title: "অর্ডার কনফার্মেশন",
        policy2Text: "হোয়াটসঅ্যাপ বা ওয়েবসাইটের মাধ্যমে অর্ডার করার পর, আমাদের টিম পণ্যের প্রাপ্যতা যাচাই করে এবং প্রসেসিং এর আগে ডেলিভারি চার্জসহ চূড়ান্ত বিল ও একটি কনফার্মেশন মেসেজ পাঠায়।",
        policy3Title: "রিটার্ন ও এক্সচেঞ্জ পলিসি",
        policy3Text: "আমরা আমাদের হাতে তৈরি পোশাকের মানের বিষয়ে গর্ববোধ করি। তবে, যদি আপনি কোনো ত্রুটিপূর্ণ বা ভুল পণ্য পান, অনুগ্রহ করে ডেলিভারি পাওয়ার ২৪ ঘণ্টার মধ্যে আমাদের জানান। পণ্যটি অবশ্যই অব্যবহৃত, অধোয়া এবং অরিজিনাল প্যাকেজিং ও ট্যাগসহ থাকতে হবে। কোনো ক্ষতি বা ত্রুটির দাবির জন্য অনুগ্রহ করে একটি আনবক্সিং ভিডিও রেকর্ড করুন।",
        policy4Title: "রঙের ডিসক্লেইমার",
        policy4Text: "যদিও আমরা নিশ্চিত করার চেষ্টা করি যে আমাদের ছবিগুলো পণ্যের সঠিক রং উপস্থাপন করে, ফটোগ্রাফির সময় আলোর কারণে বা আপনার ডিভাইসের ডিসপ্লে সেটিংসের কারণে প্রকৃত রং সামান্য ভিন্ন হতে পারে। শুধুমাত্র সামান্য রঙের পার্থক্যের কারণে কোনো এক্সচেঞ্জ গ্রহণযোগ্য হবে না।",

        loginPageTitle: "মোহর-এ স্বাগতম", loginPageSub: "দ্রুত চেকআউটের জন্য লগইন করে আপনার তথ্য সংরক্ষণ করুন।",
        continueGuest: "গেস্ট হিসেবে চালিয়ে যান",
    }
};

function getText(dataField) {
    if (!dataField) return "";
    if (typeof dataField === 'string') return dataField;
    return dataField[window.currentLang] || dataField['en'] || "";
}
window.getText = getText;

function t(key) {
    const dict = window.uiTranslations[window.currentLang] || window.uiTranslations.en;
    return dict[key] || window.uiTranslations.en[key] || '';
}
window.t = t;

function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = window.uiTranslations[window.currentLang] && window.uiTranslations[window.currentLang][key];
        if (val) {
            if (el.tagName === 'OPTION' || el.hasAttribute('data-i18n-text')) el.innerText = val;
            else el.innerHTML = val;
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = window.uiTranslations[window.currentLang] && window.uiTranslations[window.currentLang][key];
        if (val) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        const val = window.uiTranslations[window.currentLang] && window.uiTranslations[window.currentLang][key];
        if (val) el.setAttribute('aria-label', val);
    });

    if (document.getElementById('productGrid')) updateProducts();
    if (typeof window.updateCartUI === "function") window.updateCartUI();
    if (typeof window.updateDeliveryPolicyAndTotal === "function") window.updateDeliveryPolicyAndTotal();
}
window.updateUIText = updateUIText;

document.addEventListener('DOMContentLoaded', () => {
    const langToggleBtn = document.getElementById('langToggleBtn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            window.currentLang = (window.currentLang === 'en') ? 'bn' : 'en';
            localStorage.setItem('mohor_lang', window.currentLang);
            document.documentElement.lang = window.currentLang;
            updateUIText();
            window.dispatchEvent(new Event('languageChanged'));
        });
    }

    // Theme toggle: manual switch between light/dark. Stores pref in localStorage.
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    function applyTheme(theme) {
        if (!theme || theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('mohor_theme');
            if (themeToggleBtn) themeToggleBtn.innerText = '🌗';
            return;
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mohor_theme', theme);
        if (themeToggleBtn) themeToggleBtn.innerText = (theme === 'dark') ? '🌙' : '☀️';
    }

    // Initialize theme from storage or system
    const savedTheme = localStorage.getItem('mohor_theme') || 'system';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const cur = localStorage.getItem('mohor_theme') || 'system';
            // cycle: system -> dark -> light -> system
            let next = 'dark';
            if (cur === 'system') next = 'dark';
            else if (cur === 'dark') next = 'light';
            else if (cur === 'light') next = 'system';
            applyTheme(next);
        });
    }
});

// ==========================================================================
// Toast notifications (replaces blocking alert() calls site-wide)
// ==========================================================================
function ensureToastStack() {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'toast-stack';
        // Announce to assistive tech and ensure full text is read
        stack.setAttribute('aria-live', 'polite');
        stack.setAttribute('role', 'status');
        stack.setAttribute('aria-atomic', 'true');
        document.body.appendChild(stack);
    }
    return stack;
}
const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
};
window.showToast = function(message, type) {
    type = type || 'default';
    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = (TOAST_ICONS[type] || TOAST_ICONS.default) + '<span>' + message + '</span>';
    stack.appendChild(toast);
    const life = setTimeout(() => dismiss(), 3400);
    function dismiss() {
        clearTimeout(life);
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 280);
    }
    toast.addEventListener('click', dismiss);
    return dismiss;
};

// ==========================================================================
// Product catalog loading (Firestore, memoized so every page can safely
// call/await this without triggering duplicate reads)
// ==========================================================================
let _productsLoadPromise = null;
window.loadStoreProducts = function() {
    if (_productsLoadPromise) return _productsLoadPromise;
    _productsLoadPromise = (async () => {
        if (typeof window.db === 'undefined' || !window.db) return;
        try {
            const querySnapshot = await window.db.collection("products").get();
            const dynamicProducts = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                dynamicProducts.push({
                    id: doc.id,
                    title: data.title || "Dress",
                    category: data.category || "three-piece",
                    price: Number(data.price || 0),
                    images: data.images || [],
                    colors: data.colors || [],
                    sizes: data.sizes || [],
                    sizeMeasurements: data.sizeMeasurements || {},
                    measurementsGuide: data.measurementsGuide || "",
                    description: data.description || "",
                    details: data.details || []
                });
            });
            if (dynamicProducts.length > 0) window.firestoreProducts = dynamicProducts;
        } catch (err) {
            console.error("Error loading products from database:", err);
        } finally {
            if (typeof window.updateProducts === "function") window.updateProducts();
            window.dispatchEvent(new CustomEvent('productsLoaded'));
        }
    })();
    return _productsLoadPromise;
};

// ==========================================================================
// Product grid rendering, filter / sort / search
// ==========================================================================
function productCoverImage(product) {
    return (product.images && product.images.length > 0) ? product.images[0] : 'assets/image-placeholder.svg';
}

function renderSkeletonGrid(count) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="skeleton-card"><div class="sk-media"></div><div class="sk-line w60"></div><div class="sk-line w35"></div></div>`;
    }
    grid.innerHTML = html;
}

function renderProducts(productsToRender) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    // Apply view classes from saved preferences
    const viewMode = localStorage.getItem('mohor_view_mode') || 'grid';
    productGrid.classList.toggle('view-list', viewMode === 'list');

    productGrid.innerHTML = '';
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = `<p class="no-products">${t('noProducts')}</p>`;
        return;
    }

    productGrid.classList.add('reveal-stagger');
    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => {
            if (window.innerWidth <= 900) {
                window.location.href = `product.html?id=${String(product.id)}`;
            } else {
                openProductModal(product);
            }
        };

        const displayTitle = getText(product.title);
        const displayCategory = (product.category || "").replace('-', ' ');

        // If list view, render a row layout
        if (viewMode === 'list') {
            card.innerHTML = `
                <div class="card-media">
                    <img src="${productCoverImage(product)}" alt="${displayTitle}" loading="lazy" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">
                </div>
                <div class="card-body">
                    <div class="card-title">${displayTitle}</div>
                    <div class="card-price">৳ ${product.price}</div>
                    <div class="card-desc">${(getText(product.description) || '').slice(0,140)}</div>
                    <div style="margin-top:10px;"><button type="button" class="btn btn-outline btn-quickview">Quick View</button></div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="card-media">
                    <span class="card-cat">${displayCategory}</span>
                    <img src="${productCoverImage(product)}" alt="${displayTitle}" loading="lazy" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">
                    <div class="card-quick">Quick View</div>
                </div>
                <div class="card-body">
                    <div class="card-title">${displayTitle}</div>
                    <div class="card-price">৳ ${product.price}</div>
                    <button type="button" class="card-cta">${t('selectOptions')}</button>
                </div>
            `;
        }

        // Make card keyboard-focusable and accessible
        card.tabIndex = 0;
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (window.innerWidth <= 900) {
                    window.location.href = `product.html?id=${String(product.id)}`;
                } else {
                    openProductModal(product);
                }
            }
        });

        // Attach quick view handler for list mode or card-cta for grid
        const quickBtn = card.querySelector('.btn-quickview');
        if (quickBtn) {
            quickBtn.addEventListener('click', (ev) => { ev.stopPropagation(); if (window.innerWidth <= 900) { window.location.href = `product.html?id=${String(product.id)}`; } else { openProductModal(product); } });
        }
        const ctaBtn = card.querySelector('.card-cta');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openProductModal(product); });
        }

        productGrid.appendChild(card);
    });
    requestAnimationFrame(() => productGrid.classList.add('in-view'));
}
window.renderProducts = renderProducts;

// Helpers for view controls
function initViewControls() {
    const btnGrid = document.getElementById('btnViewGrid');
    const btnList = document.getElementById('btnViewList');
    const productGrid = document.getElementById('productGrid');

    const apply = () => {
        const mode = localStorage.getItem('mohor_view_mode') || 'grid';
        if (productGrid) productGrid.classList.toggle('view-list', mode === 'list');
        // re-render current products to apply layout
        if (window._lastRenderedProducts) renderProducts(window._lastRenderedProducts);
    };

    if (btnGrid) btnGrid.addEventListener('click', () => { localStorage.setItem('mohor_view_mode','grid'); apply(); });
    if (btnList) btnList.addEventListener('click', () => { localStorage.setItem('mohor_view_mode','list'); apply(); });

    apply();
}

// Ensure updateProducts stores last rendered for re-render
const origUpdateProducts = updateProducts;
window.updateProducts = function() {
    origUpdateProducts();
    const grid = document.getElementById('productGrid');
    // capture last rendered source for view re-renders
    window._lastRenderedProducts = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length>0) ? window.firestoreProducts : (window.productsData || []);
};

document.addEventListener('DOMContentLoaded', () => { initViewControls(); });

// Escape helper used in renderProducts inline JSON
function escapeHtml(json) { return String(json).replace(/\\/g,'\\\\').replace(/'/g, "\\'").replace(/\"/g,'\\\"'); }

function updateProducts() {
    let sourceData = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
        ? window.firestoreProducts
        : (window.productsData || []);

    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchInput');
    if (!sortSelect) return;

    if (sourceData.length === 0) {
        if (window._catalogPending !== false) renderSkeletonGrid(8);
        return;
    }
    window._catalogPending = false;

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

        // Smart broad search: expand category-adjacent words so a search for
        // "office" still surfaces "formal" pieces, etc.
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

    if (sortValue === 'low-high') filtered.sort((a, b) => a.price - b.price);
    else if (sortValue === 'high-low') filtered.sort((a, b) => b.price - a.price);

    renderProducts(filtered);
}
window.updateProducts = updateProducts;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.addEventListener('change', updateProducts));

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', updateProducts);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateProducts, 180);
        });
    }

    if (document.getElementById('productGrid')) {
        renderSkeletonGrid(8);
    }
});

// ==========================================================================
// Quick-view modal (desktop)
// ==========================================================================
let currentViewingProduct = null;
let selectedSize = null;
let selectedColor = null;
// Track last focused element so focus can be restored when dialogs close
let _lastFocusedElement = null;

// Simple focus trap for dialogs/modals (keyboard-only, small footprint)
function trapFocus(container) {
    const selector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(container.querySelectorAll(selector)).filter(n => n.offsetParent !== null || n === document.activeElement);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    const handler = function(e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    };
    // store handler so it can be removed
    container._trapKeyHandler = handler;
    container.addEventListener('keydown', handler);
}

function releaseFocus(container) {
    if (!container) return;
    if (container._trapKeyHandler) {
        container.removeEventListener('keydown', container._trapKeyHandler);
        delete container._trapKeyHandler;
    }
}

function buildOptButton(container, value, type) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt-btn ' + type + '-btn';
    btn.innerText = value;
    btn.onclick = () => selectOption(btn, value, type);
    container.appendChild(btn);
    return btn;
}

function openProductModal(product) {
    const productModal = document.getElementById('productModal');
    if (!productModal) return;

    currentViewingProduct = product;
    selectedSize = null;
    selectedColor = null;

    const sizeWarn = document.getElementById('sizeWarning');
    const colorWarn = document.getElementById('colorWarning');
    if (sizeWarn) sizeWarn.classList.remove('show');
    if (colorWarn) colorWarn.classList.remove('show');
    const sizeGuideDisplay = document.getElementById('sizeGuideDisplay');
    if (sizeGuideDisplay) { sizeGuideDisplay.innerHTML = ""; sizeGuideDisplay.classList.remove('show'); }

    document.getElementById('modalTitle').innerText = getText(product.title);
    document.getElementById('modalPrice').innerText = `৳ ${product.price}`;
    document.getElementById('modalDesc').innerText = getText(product.description);
    const catLabel = document.getElementById('modalCategory');
    if (catLabel) catLabel.innerText = (product.category || '').replace('-', ' ');

    const mainImage = document.getElementById('modalMainImage');
    const thumbContainer = document.getElementById('modalThumbnails');
    thumbContainer.innerHTML = '';

    const images = (product.images && product.images.length > 0) ? product.images : ['assets/image-placeholder.svg'];
    mainImage.innerHTML = `<img src="${images[0]}" alt="${getText(product.title)}" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">`;
    images.forEach((imgSrc, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail' + (index === 0 ? ' active' : '');
        thumb.innerHTML = `<img src="${imgSrc}" alt="" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">`;
        thumb.onclick = () => {
            mainImage.innerHTML = `<img src="${imgSrc}" alt="${getText(product.title)}">`;
            thumbContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        };
        thumbContainer.appendChild(thumb);
    });

    const colorsContainer = document.getElementById('modalColors');
    const colorSection = document.getElementById('colorSection');
    colorsContainer.innerHTML = '';
    let colorArray = [];
    if (product.colors) colorArray = Array.isArray(product.colors) ? product.colors : (product.colors[window.currentLang] || product.colors['en'] || []);

    if (colorArray.length > 0) {
        colorSection.style.display = 'block';
        colorArray.forEach(color => buildOptButton(colorsContainer, color, 'color'));
    } else {
        colorSection.style.display = 'none';
        selectedColor = "Default";
    }

    const sizesContainer = document.getElementById('modalSizes');
    sizesContainer.innerHTML = '';
    if (product.sizes) product.sizes.forEach(size => buildOptButton(sizesContainer, size, 'size'));

    const detailsList = document.getElementById('modalDetails');
    detailsList.innerHTML = '';
    let detailsArray = [];
    if (product.details) detailsArray = Array.isArray(product.details) ? product.details : (product.details[window.currentLang] || product.details['en'] || []);
    detailsArray.forEach(detail => {
        const li = document.createElement('li');
        li.innerText = detail;
        detailsList.appendChild(li);
    });
    const detailsSection = document.getElementById('modalDetailsSection');
    if (detailsSection) detailsSection.style.display = detailsArray.length ? 'block' : 'none';

    // open modal visiblity and accessibility
    _lastFocusedElement = document.activeElement;
    productModal.classList.add('active');
    productModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Trap keyboard focus and move focus into the modal for screen reader users
    trapFocus(productModal);
    const preferFocus = productModal.querySelector('#closeModalBtn') || productModal.querySelector('[tabindex]') || productModal.querySelector('button, a, input');
    if (preferFocus) preferFocus.focus();
}
window.openProductModal = openProductModal;

function selectOption(clickedBtn, value, type) {
    const isAlreadySelected = clickedBtn.classList.contains('selected');
    if (type === 'size') {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        selectedSize = isAlreadySelected ? null : value;
        const warn = document.getElementById('sizeWarning');
        if (warn) warn.classList.remove('show');

        const sizeGuideDisplay = document.getElementById('sizeGuideDisplay');
        if (sizeGuideDisplay) {
            if (selectedSize && currentViewingProduct && currentViewingProduct.sizeMeasurements && currentViewingProduct.sizeMeasurements[selectedSize]) {
                const md = currentViewingProduct.sizeMeasurements[selectedSize];
                sizeGuideDisplay.innerHTML = (typeof md === 'string') ? md : (md[window.currentLang] || md['en'] || "");
                sizeGuideDisplay.classList.add('show');
            } else {
                sizeGuideDisplay.innerHTML = "";
                sizeGuideDisplay.classList.remove('show');
            }
        }
    } else if (type === 'color') {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        selectedColor = isAlreadySelected ? null : value;
        const warn = document.getElementById('colorWarning');
        if (warn) warn.classList.remove('show');
    }
    if (!isAlreadySelected) clickedBtn.classList.add('selected');
}

function closeProductModal() {
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.classList.remove('active');
        productModal.setAttribute('aria-hidden', 'true');
        releaseFocus(productModal);
    }
    document.body.style.overflow = '';
    // restore prior focus so keyboard/screenreader users return to a sensible place
    try { if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') setTimeout(() => _lastFocusedElement.focus(), 0); } catch (e) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);

    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', (e) => { if (e.target === productModal) closeProductModal(); });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (productModal && productModal.classList.contains('active')) closeProductModal();
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar && cartSidebar.classList.contains('active') && typeof window.closeCartSidebar === 'function') window.closeCartSidebar();
        const accountSidebar = document.getElementById('accountSidebar');
        if (accountSidebar && accountSidebar.classList.contains('active') && typeof window.closeAccountSidebar === 'function') window.closeAccountSidebar();
        const filters = document.getElementById('sidebar');
        if (filters && filters.classList.contains('active')) filters.classList.remove('active');
    });

    const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
    if (modalAddToCartBtn) {
        modalAddToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let valid = true;
            if (!selectedSize && currentViewingProduct && currentViewingProduct.sizes && currentViewingProduct.sizes.length > 0) {
                const warn = document.getElementById('sizeWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (!selectedColor) {
                const warn = document.getElementById('colorWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (!valid) return;

            if (typeof window.addToCart === "function") {
                window.addToCart(currentViewingProduct, selectedSize || 'Standard', selectedColor);
            }
            closeProductModal();
        });
    }

    // Buy Now from quick-view modal: add then navigate to cart
    const modalBuyNowBtn = document.getElementById('modalBuyNowBtn');
    if (modalBuyNowBtn) {
        modalBuyNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let valid = true;
            if (!selectedSize && currentViewingProduct && currentViewingProduct.sizes && currentViewingProduct.sizes.length > 0) {
                const warn = document.getElementById('sizeWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (!selectedColor) {
                const warn = document.getElementById('colorWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (!valid) return;

            if (typeof window.addToCart === "function") {
                window.addToCart(currentViewingProduct, selectedSize || 'Standard', selectedColor);
            }
            closeProductModal();
            window.location.href = 'cart.html';
        });
    }
});

// ==========================================================================
// Nav interactions: mobile menu, sticky shadow, filter drawer, cart routing
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('siteHeader');
    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isActive = navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(isActive));
        });
    }

    const sidebar = document.getElementById('sidebar');
    const filtersOverlay = document.getElementById('filtersOverlay');
    const mobileFilterBtn = document.getElementById('mobileFilterBtn');
    const closeFiltersBtn = document.getElementById('closeFiltersBtn');
    const openFilters = () => { if (sidebar) sidebar.classList.add('active'); if (filtersOverlay) filtersOverlay.classList.add('active'); };
    const closeFilters = () => { if (sidebar) sidebar.classList.remove('active'); if (filtersOverlay) filtersOverlay.classList.remove('active'); };
    if (mobileFilterBtn) mobileFilterBtn.addEventListener('click', openFilters);
    if (closeFiltersBtn) closeFiltersBtn.addEventListener('click', closeFilters);
    if (filtersOverlay) filtersOverlay.addEventListener('click', closeFilters);

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
            updateProducts();
        });
    }

    // Hybrid responsive routing: on mobile, the cart icon goes to cart.html
    // instead of opening the slide-over (captures before cart.js's own listener).
    const topNavCartBtn = document.getElementById('openCartBtn');
    if (topNavCartBtn) {
        topNavCartBtn.addEventListener('click', (e) => {
            if (window.innerWidth <= 900 && !window.location.pathname.endsWith('cart.html')) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'cart.html';
            }
        }, true);
    }
});

// ==========================================================================
// Scroll reveal (IntersectionObserver) — applies to .reveal / .reveal-stagger
// / .thread-draw elements already in the DOM at load time.
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal, .reveal-stagger, .thread-draw').forEach(el => el.classList.add('in-view'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger, .thread-draw').forEach(el => io.observe(el));

    // Product grid is populated asynchronously — watch for it too.
    const grid = document.getElementById('productGrid');
    if (grid) {
        const gridObserver = new MutationObserver(() => { if (!grid.classList.contains('in-view')) grid.classList.add('in-view'); });
        gridObserver.observe(grid, { childList: true });
    }

    document.body.classList.add('is-ready');
});

// Fallback: ensure the page fades in even if DOMContentLoaded already fired.
if (document.readyState !== 'loading') document.body.classList.add('is-ready');
