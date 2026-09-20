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
        catTitle: "Category", catKurti: "Kurti", catThreePiece: "Three Piece", catKhadi: "Khadi", catFormal: "Formal Wear", catOnSale: "🔥 On Sale",
        priceTitle: "Price", price1: "Under ৳1500", price2: "৳1500 – ৳2500", price3: "Above ৳2500",
        clearFilters: "Clear all",
        noProducts: "No pieces match your filters just yet. Try clearing a few and searching again.",
        searchPlaceholder: "Search the collection…",
        sizeSelect: "Select Size", sizeWarning: "Please select a size", colorSelect: "Select Color", colorWarning: "Please select a color",
        descTitle: "Description", detailsTitle: "The Details",
        addToCart: "Add to Cart", buyNow: "Buy Now", backBtn: "Back",
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
        selectDeliveryZone: "Select Delivery Zone *", zoneInside: "Inside Sylhet (৳70)", zoneOutside: "Outside Sylhet (৳140)",
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
        policy1Text: "We deliver nationwide across Bangladesh. Delivery inside Sylhet costs ৳70 and usually takes 1–3 business days. Delivery outside Sylhet costs ৳140 and usually takes 3–5 business days. The applicable charge is shown at checkout.",
        policy2Title: "Order Confirmation",
        policy2Text: "Once you place an order via WhatsApp or the website, our team verifies product availability and sends you a confirmation message along with the final bill, including delivery charges, before processing.",
        policy3Title: "Return & Exchange Policy",
        policy3Text: "We take pride in the quality of our handcrafted clothing. However, if you receive a defective or incorrect item, please notify us within 24 hours of receiving the delivery. The item must be unused, unwashed, and in its original packaging with tags intact. Please record an unboxing video to claim any damages or defects.",
        policy4Title: "Color Disclaimer",
        policy4Text: "While we strive to ensure our images accurately represent the product, actual colors may slightly vary due to lighting during photography or your device's display settings. Exchanges will not be accommodated purely for slight color variations.",

        loginPageTitle: "Welcome to Mohor", loginPageSub: "Log in to save your details for faster checkout.",
        continueGuest: "Continue as Guest",
        
        // Blueprint Additions
        promoEndsIn: "Ends in:",
        relatedProductsTitle: "You May Also Like",
        relatedProductsSub: "Handpicked matching items from our collection",
        cartSavingsText: "You are saving",
        cartSavingsOrder: "on this order!"
    },
    bn: {
        navShop: "শপ", navOrders: "অর্ডার হিস্ট্রি", navAbout: "আমাদের সম্পর্কে", navPolicy: "পলিসি", navAccount: "অ্যাকাউন্ট", navCart: "কার্ট",
        shopTitle: "আমাদের কালেকশন",
        shopSubtitle: "হাতে তৈরি থ্রি-পিস, কুর্তি ও খাদি — অল্প সংখ্যায় যত্নসহকারে তৈরি।",
        filterBtn: "ফিল্টার", closeFilters: "বন্ধ করুন",
        sortDefault: "সাজান: ফিচার্ড", sortLowHigh: "দাম: কম থেকে বেশি", sortHighLow: "দাম: বেশি থেকে কম",
        catTitle: "ক্যাটাগরি", catKurti: "কুর্তি", catThreePiece: "থ্রি-পিস", catKhadi: "খাদি", catFormal: "ফরমাল ওয়্যার", catOnSale: "🔥 ছাড়ের পণ্য",
        priceTitle: "মূল্য", price1: "৳১৫০০ এর নিচে", price2: "৳১৫০০ – ৳২৫০০", price3: "৳২৫০০ এর উপরে",
        clearFilters: "সব মুছুন",
        noProducts: "আপনার ফিল্টারের সাথে মিলছে এমন কিছু পাওয়া যায়নি। কিছু ফিল্টার মুছে আবার চেষ্টা করুন।",
        searchPlaceholder: "কালেকশনে খুঁজুন…",
        sizeSelect: "সাইজ নির্বাচন করুন", sizeWarning: "অনুগ্রহ করে একটি সাইজ নির্বাচন করুন", colorSelect: "রং নির্বাচন করুন", colorWarning: "অনুগ্রহ করে একটি রং নির্বাচন করুন",
        descTitle: "বিবরণ", detailsTitle: "বিস্তারিত",
        addToCart: "কার্টে যোগ করুন", buyNow: "এখনই কিনুন", backBtn: "ফিরে যান",
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
        selectDeliveryZone: "ডেলিভারি জোন নির্বাচন করুন *", zoneInside: "সিলেটের ভিতরে (৳৭০)", zoneOutside: "সিলেটের বাইরে (৳১৪০)",
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
        policy1Text: "আমরা সারা বাংলাদেশে ডেলিভারি দিয়ে থাকি। সিলেটের ভিতরে ডেলিভারি চার্জ ৳৭০ এবং সাধারণত ১–৩ কর্মদিবস সময় লাগে। সিলেটের বাইরে ডেলিভারি চার্জ ৳১৪০ এবং সাধারণত ৩–৫ কর্মদিবস সময় লাগে। প্রযোজ্য চার্জ চেকআউটে দেখানো হবে।",
        policy2Title: "অর্ডার কনফার্মেশন",
        policy2Text: "হোয়াটসঅ্যাপ বা ওয়েবসাইটের মাধ্যমে অর্ডার করার পর, আমাদের টিম পণ্যের প্রাপ্যতা যাচাই করে এবং প্রসেসিং এর আগে ডেলিভারি চার্জসহ চূড়ান্ত বিল ও একটি কনফার্মেশন মেসেজ পাঠায়।",
        policy3Title: "রিটার্ন ও এক্সচেঞ্জ পলিসি",
        policy3Text: "আমরা আমাদের হাতে তৈরি পোশাকের মানের বিষয়ে গর্ববোধ করি। তবে, যদি আপনি কোনো ত্রুটিপূর্ণ বা ভুল পণ্য পান, অনুগ্রহ করে ডেলিভারি পাওয়ার ২৪ ঘণ্টার মধ্যে আমাদের জানান। পণ্যটি অবশ্যই অব্যবহৃত, অধোয়া এবং অরিজিনাল প্যাকেজিং ও ট্যাগসহ থাকতে হবে। কোনো ক্ষতি বা ত্রুটির দাবির জন্য অনুগ্রহ করে একটি আনবক্সিং ভিডিও রেকর্ড করুন।",
        policy4Title: "রঙের ডিসক্লেইমার",
        policy4Text: "যদিও আমরা নিশ্চিত করার চেষ্টা করি যে আমাদের ছবিগুলো পণ্যের সঠিক রং উপস্থাপন করে, ফটোগ্রাফির সময় আলোর কারণে বা আপনার ডিভাইসের ডিসপ্লে সেটিংসের কারণে প্রকৃত রং সামান্য ভিন্ন হতে পারে। শুধুমাত্র সামান্য রঙের পার্থক্যের কারণে কোনো এক্সচেঞ্জ গ্রহণযোগ্য হবে না।",

        loginPageTitle: "মোহর-এ স্বাগতম", loginPageSub: "দ্রুত চেকআউটের জন্য লগইন করে আপনার তথ্য সংরক্ষণ করুন।",
        continueGuest: "গেস্ট হিসেবে চালিয়ে যান",

        // Blueprint Additions
        promoEndsIn: "শেষ হতে বাকি:",
        relatedProductsTitle: "আপনার পছন্দ হতে পারে",
        relatedProductsSub: "আমাদের কালেকশন থেকে আপনার জন্য বিশেষ নির্বাচন",
        cartSavingsText: "আপনি সেভ করছেন",
        cartSavingsOrder: "এই অর্ডারে!"
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

    if (document.getElementById('productGrid')) window.updateProducts();
    if (typeof window.updateCartUI === "function") window.updateCartUI();
    if (typeof window.updateDeliveryPolicyAndTotal === "function") window.updateDeliveryPolicyAndTotal();
    if (typeof window.updateCartSavingsSummary === "function") window.updateCartSavingsSummary();
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
            let next = 'dark';
            if (cur === 'system') next = 'dark';
            else if (cur === 'dark') next = 'light';
            else if (cur === 'light') next = 'system';
            applyTheme(next);
        });
    }
});

// ==========================================================================
// Meta Conversions API (CAPI) & Pixel Unified Event Tracking
// ==========================================================================
window.trackMetaEvent = async function(eventName, userData = {}, customData = {}) {
    const eventId = "evt_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);

    // 1. Browser Track (Meta Pixel)
    if (typeof window.fbq === "function") {
        window.fbq("track", eventName, customData, { eventID: eventId });
    }

    // 2. Server Track (Cloudflare CAPI Worker routed via custom domain)
    try {
        await fetch("https://capi.mohor.me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        event_id: eventId, // Deduplication Key
                        action_source: "website",
                        event_source_url: window.location.href,
                        user_data: userData,
                        custom_data: customData
                    }
                ]
            })
        });
    } catch (err) {
        console.error("Meta CAPI dispatch error:", err);
    }
};
window.sendMetaCapiEvent = window.trackMetaEvent;

// Trigger PageView automatically on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.trackMetaEvent("PageView");
});

// ==========================================================================
// Toast notifications (replaces blocking alert() calls site-wide)
// ==========================================================================
function ensureToastStack() {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'toast-stack';
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
// Telegram Notification Function (Global)
// ==========================================================================
window.sendTelegramNotification = async function(orderData) {
    // Telegram credentials must stay on a server-side proxy. Define this
    // public endpoint before loading app.js in the deployment environment.
    const endpoint = typeof window.MOHOR_TELEGRAM_ENDPOINT === 'string'
        ? window.MOHOR_TELEGRAM_ENDPOINT.trim()
        : '';
    if (!endpoint) {
        console.warn('Telegram notifications are disabled: MOHOR_TELEGRAM_ENDPOINT is not configured.');
        return false;
    }

    const itemsText = Array.isArray(orderData.items)
        ? orderData.items.map(item => `• ${item.name || item.title || 'Item'} (x${item.qty}) - ৳${item.price}`).join('\n')
        : 'No items detailed';

    const message = `
<b>🛍️ NEW ORDER PLACED!</b>

👤 <b>Customer:</b> ${orderData.customerName || 'N/A'}
📞 <b>Phone:</b> ${orderData.customerPhone || 'N/A'}
📍 <b>Address:</b> ${orderData.deliveryAddress || 'N/A'}

<b>Order Items:</b>
${itemsText}

💵 <b>Subtotal:</b> ৳${orderData.subtotal || 0}
💰 <b>Total Amount:</b> ৳${orderData.totalAmount || 0}
📌 <b>Status:</b> ${orderData.status || 'pending'}
    `;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: orderData, message, parse_mode: 'HTML' })
        });
        if (!response.ok) throw new Error(`Telegram proxy returned HTTP ${response.status}`);
        return true;
    } catch (error) {
        console.error('Telegram notification error:', error);
        return false;
    }
};

// ==========================================================================
// FEATURE 1: PROMOTIONAL & DISCOUNT ENGINE (PRICING & BANNER COUNTDOWN)
// ==========================================================================
window.getProductPricing = function(product) {
    const price = Number(product.price || 0);
    const regularPrice = Number(product.regularPrice || product.originalPrice || 0);
    const isOnSale = (regularPrice > price) || !!product.onSale;
    let savingsAmt = 0;
    let discountPercent = 0;

    if (regularPrice > price) {
        savingsAmt = regularPrice - price;
        discountPercent = Math.round((savingsAmt / regularPrice) * 100);
    }

    return { price, regularPrice, isOnSale, savingsAmt, discountPercent };
};

// Inventory is stored per size. Older products only have `quantity`, so treat
// that product-level value as the availability of every listed size.
window.getProductSizeQuantity = function(product, size, color) {
    if (!product) return 0;
    const sizeKey = String(size || 'Standard');
    const colorKey = color && color !== 'Default' ? String(color) : '';
    const variants = product.variantStock || product.stockByVariant;
    if (variants && colorKey && variants[`${colorKey}::${sizeKey}`] !== undefined) {
        return Math.max(0, Number(variants[`${colorKey}::${sizeKey}`]) || 0);
    }
    if (variants && colorKey && variants[colorKey] && variants[colorKey][sizeKey] !== undefined) {
        return Math.max(0, Number(variants[colorKey][sizeKey]) || 0);
    }
    if (product.sizeQuantities && product.sizeQuantities[sizeKey] !== undefined) {
        return Math.max(0, Number(product.sizeQuantities[sizeKey]) || 0);
    }
    return Math.max(0, Number(product.quantity) || 0);
};

window.productHasStock = function(product) {
    const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ['Standard'];
    const colors = getProductColorsForStock(product);
    return colors.some(color => sizes.some(size => window.getProductSizeQuantity(product, size, color) > 0));
};

function getProductColorsForStock(product) {
    const colorName = color => typeof color === 'string'
        ? color
        : (color?.name?.en || color?.name?.bn || color?.name || color?.label || color?.title || '');
    const colors = product && product.colors;
    if (Array.isArray(colors)) return colors.map(colorName).filter(Boolean);
    if (colors && typeof colors === 'object') {
        const values = colors.en || colors.bn || [];
        return Array.isArray(values) ? values.map(colorName).filter(Boolean) : [];
    }
    return ['Default'];
}

window.productSizeIsAvailable = function(product, size, color) {
    return window.getProductSizeQuantity(product, size, color) > 0;
};

let promoCountdownTimer = null;
function initPromoBannerAndCountdown() {
    const banner = document.getElementById('topPromoBanner');
    const badge = document.getElementById('promoBadge');
    const text = document.getElementById('promoBannerText');
    const countdownWrap = document.getElementById('promoCountdown');
    const timerDisplay = document.getElementById('promoTimer');
    const closeBtn = document.getElementById('closePromoBannerBtn');

    if (!banner) return;

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            banner.style.display = 'none';
            sessionStorage.setItem('mohor_promo_closed', 'true');
        });
    }

    if (sessionStorage.getItem('mohor_promo_closed') === 'true') {
        banner.style.display = 'none';
        return;
    }

    if (typeof window.db === 'undefined' || !window.db) return;

    // Same short-lived cache idea as the product catalog: the banner rarely
    // changes minute-to-minute, so re-fetching it on every single page
    // navigation is a Firestore round trip this site doesn't need to make.
    const PROMO_CACHE_KEY = 'mohor_promo_cache_v1';
    const PROMO_CACHE_TTL_MS = 3 * 60 * 1000;
    let cachedPromo = null;
    try {
        const raw = sessionStorage.getItem(PROMO_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.savedAt && (Date.now() - parsed.savedAt < PROMO_CACHE_TTL_MS)) {
                cachedPromo = parsed.data;
            }
        }
    } catch (err) { /* ignore — falls through to a live fetch */ }

    const settingsPromise = cachedPromo
        ? Promise.resolve({ exists: true, data: () => cachedPromo })
        : window.db.collection("settings").doc("storefront").get().then(doc => {
            if (doc.exists) {
                try { sessionStorage.setItem(PROMO_CACHE_KEY, JSON.stringify({ data: doc.data(), savedAt: Date.now() })); }
                catch (err) { /* non-fatal */ }
            }
            return doc;
        });

    settingsPromise.then(doc => {
        if (!doc.exists) return;
        const data = doc.data();

        if (data.saleActive && data.bannerText) {
            banner.style.display = 'block';
            if (badge && data.bannerBadge) badge.innerText = data.bannerBadge;
            if (text) text.innerText = data.bannerText;

            if (data.saleEndTime) {
                const expiryMs = new Date(data.saleEndTime).getTime();
                if (expiryMs > Date.now()) {
                    if (countdownWrap) countdownWrap.style.display = 'inline-flex';
                    if (promoCountdownTimer) clearInterval(promoCountdownTimer);

                    promoCountdownTimer = setInterval(() => {
                        const now = Date.now();
                        const diff = expiryMs - now;

                        if (diff <= 0) {
                            clearInterval(promoCountdownTimer);
                            banner.style.display = 'none';
                        } else {
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const secs = Math.floor((diff % (1000 * 60)) / 1000);
                            if (timerDisplay) {
                                timerDisplay.innerText = `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
                            }
                        }
                    }, 1000);
                } else {
                    if (countdownWrap) countdownWrap.style.display = 'none';
                }
            } else if (countdownWrap) {
                countdownWrap.style.display = 'none';
            }
        } else {
            banner.style.display = 'none';
        }
    }).catch(err => console.warn("Promo banner fetch error:", err));
}

// Cart Savings Indicator Helper
window.updateCartSavingsSummary = function() {
    const banner = document.getElementById('cartSavingsBanner');
    const amountSpan = document.getElementById('cartSavingsAmount');
    if (!banner || !amountSpan) return;

    try {
        const rawCart = localStorage.getItem('mohor_cart');
        if (!rawCart) { banner.style.display = 'none'; return; }
        const cart = JSON.parse(rawCart);
        if (!Array.isArray(cart) || cart.length === 0) { banner.style.display = 'none'; return; }

        let totalSavings = 0;
        cart.forEach(item => {
            const pricing = window.getProductPricing(item);
            if (pricing.isOnSale) {
                totalSavings += pricing.savingsAmt * (item.qty || 1);
            }
        });

        if (totalSavings > 0) {
            amountSpan.innerText = `৳ ${totalSavings.toLocaleString()}`;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    } catch (e) {
        banner.style.display = 'none';
    }
};

// ==========================================================================
// Product catalog loading (Firestore, memoized so every page can safely
// call/await this without triggering duplicate reads)
// ==========================================================================
let _productsLoadPromise = null;
window._catalogPending = true;
function normalizeProductSnapshot(doc) {
    const data = doc.data() || {};
    return {
        id: String(doc.id),
        title: data.title || "Dress",
        category: data.category || "three-piece",
        price: Number(data.price || 0),
        regularPrice: Number(data.regularPrice || data.originalPrice || 0),
        salePrice: data.salePrice != null ? Number(data.salePrice) : null,
        originalPrice: data.originalPrice != null ? Number(data.originalPrice) : null,
        onSale: !!data.onSale,
        images: Array.isArray(data.images) ? data.images : [],
        colors: data.colors || [],
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
        sizeMeasurements: data.sizeMeasurements || {},
        sizeQuantities: data.sizeQuantities || {},
        variantStock: data.variantStock || data.stockByVariant || {},
        quantity: Number(data.quantity || 0),
        measurementsGuide: data.measurementsGuide || "",
        description: data.description || "",
        details: data.details || [],
        materials: data.materials || [],
        care: data.care || []
    };
}

// Cross-page catalog cache: the storefront is a multi-page site, so without
// this every single navigation (home -> product -> cart) re-downloads the
// entire product collection from Firestore. sessionStorage survives across
// page loads (but not tabs/sessions), so we use it as a short-lived,
// stale-while-revalidate cache: a fresh visit within the same browsing
// session renders instantly from cache while a real fetch quietly confirms
// (and corrects, if anything changed) in the background.
const PRODUCTS_CACHE_KEY = 'mohor_products_cache_v1';
const PRODUCTS_CACHE_TTL_MS = 3 * 60 * 1000;

function readProductsCache() {
    try {
        const raw = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.products) || !parsed.savedAt) return null;
        return parsed;
    } catch (err) {
        return null;
    }
}

function writeProductsCache(products) {
    try {
        sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ products, savedAt: Date.now() }));
    } catch (err) {
        // sessionStorage can be unavailable (private browsing, quota, etc.) —
        // caching is a pure optimization, so failing silently here is safe.
    }
}

window.loadStoreProducts = function() {
    if (_productsLoadPromise) return _productsLoadPromise;

    const cached = readProductsCache();
    const cacheIsFresh = !!cached && (Date.now() - cached.savedAt < PRODUCTS_CACHE_TTL_MS);

    if (cached && cached.products.length > 0) {
        // Serve the cached catalog immediately so the grid never has to sit on
        // a skeleton while a page that already fetched this data recently
        // waits on the network again.
        window.firestoreProducts = cached.products;
        window._catalogPending = false;
    }

    if (cacheIsFresh) {
        if (typeof window.updateProducts === "function") window.updateProducts();
        window.dispatchEvent(new CustomEvent('productsLoaded'));
        _productsLoadPromise = Promise.resolve();
        return _productsLoadPromise;
    }

    _productsLoadPromise = (async () => {
        try {
            if (typeof window.db === 'undefined' || !window.db) {
                return;
            }
            const querySnapshot = await window.db.collection("products").get();
            const dynamicProducts = [];
            querySnapshot.forEach((doc) => {
                dynamicProducts.push(normalizeProductSnapshot(doc));
            });
            if (dynamicProducts.length > 0) {
                window.firestoreProducts = dynamicProducts;
                writeProductsCache(dynamicProducts);
            }
        } catch (err) {
            console.error("Error loading products from database:", err);
        } finally {
            window._catalogPending = false;
            if (typeof window.updateProducts === "function") window.updateProducts();
            window.dispatchEvent(new CustomEvent('productsLoaded'));
        }
    })();
    return _productsLoadPromise;
};

// Product pages can still resolve a product when a collection read is empty
// or temporarily fails, provided the document itself is readable.
window.loadStoreProduct = async function(productId) {
    if (!productId) return null;

    await window.loadStoreProducts();
    const catalog = Array.isArray(window.firestoreProducts) ? window.firestoreProducts : [];
    const fromCatalog = catalog.find(product => String(product.id) === String(productId));
    if (fromCatalog) return fromCatalog;

    if (!window.db || typeof window.db.collection !== "function") return null;

    try {
        const snapshot = await window.db.collection("products").doc(String(productId)).get();
        return snapshot.exists ? normalizeProductSnapshot(snapshot) : null;
    } catch (err) {
        console.error("Error loading product from database:", err);
        return null;
    }
};

// ==========================================================================
// Product grid rendering, filter / sort / search
// ==========================================================================
function productCoverImage(product) {
    return (product.images && product.images.length > 0) ? product.images[0] : 'assets/image-placeholder.svg';
}

function productPageUrl(product) {
    return `/product/?id=${encodeURIComponent(String(product.id))}`;
}

const WISHLIST_KEY = 'mohor_wishlist';
window.getWishlistIds = function() {
    try {
        const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (_) {
        return [];
    }
};
window.isWishlisted = function(id) {
    return window.getWishlistIds().includes(String(id));
};
window.toggleWishlist = function(id) {
    const key = String(id);
    const ids = window.getWishlistIds();
    const next = ids.includes(key) ? ids.filter(value => value !== key) : [...ids, key];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('wishlistChanged', { detail: { id: key, active: next.includes(key) } }));
    return next.includes(key);
};

function getProductColors(product) {
    if (!product || !product.colors) return [];
    const normalizeColors = value => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(color => color.trim()).filter(Boolean);
        return [];
    };
    if (Array.isArray(product.colors) || typeof product.colors === 'string') return normalizeColors(product.colors);
    if (typeof product.colors === 'object') {
        return normalizeColors(product.colors[window.currentLang] || product.colors.en || product.colors.bn);
    }
    return [];
}

function getColorName(color) {
    if (typeof color === 'string') return color;
    if (!color || typeof color !== 'object') return '';
    const rawName = color.name || color.label || color.title || color.color || '';
    if (typeof rawName === 'string') return rawName;
    if (rawName && typeof rawName === 'object') {
        return rawName[window.currentLang] || rawName.en || rawName.bn || '';
    }
    return '';
}

function getColorValue(color) {
    return color && typeof color === 'object'
        ? (color.hex || color.value || color.colorCode || '')
        : '';
}

function colorSwatchesHtml(product) {
    const colors = getProductColors(product);
    if (colors.length === 0) return '';

    const colorMap = {
        black: '#1f1c1b', white: '#fff', ivory: '#f5f0df', cream: '#f3e7cf',
        beige: '#d8c3a5', brown: '#754c35', maroon: '#7d2631', red: '#b92b36',
        pink: '#e6a7b5', 'blush pink': '#e6a7b5', peach: '#efad93',
        orange: '#d97845', yellow: '#e4bd4f', olive: '#7b8150', green: '#5d805f',
        sage: '#a9bca0', blue: '#4d77a8', navy: '#263b68', purple: '#76588f',
        grey: '#969696', gray: '#969696', gold: '#c9a14a', mustard: '#c59b39'
    };

    return `<div class="card-colors" aria-label="${window.currentLang === 'bn' ? 'উপলব্ধ রং' : 'Available colors'}">` +
        colors.slice(0, 6).map(color => {
            const label = getColorName(color);
            if (!label) return '';
            const swatch = getColorValue(color) || colorMap[label.toLowerCase()] || '#c9a14a';
            return `<span class="card-color-option"><span class="card-color-swatch" style="--swatch-color:${swatch}" aria-hidden="true"></span><span>${label}</span></span>`;
        }).join('') +
        (colors.length > 6 ? `<span class="card-color-more">+${colors.length - 6}</span>` : '') +
        `</div>`;
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
    const productGrid = document.getElementById('productGrid') || document.getElementById('wishlistGrid');
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
    productsToRender.forEach((product, productIndex) => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const displayTitle = getText(product.title);
        const displayCategory = (product.category || "").replace('-', ' ');
        const pricing = window.getProductPricing(product);
        const productUrl = productPageUrl(product);
        const colorOptionsHtml = colorSwatchesHtml(product);

        const images = (product.images && product.images.length > 0) ? product.images : ['assets/image-placeholder.svg'];
        const hasMultipleImages = images.length > 1;

        // FEATURE 1: Sale Badge HTML
        const hasStock = window.productHasStock(product);
        const saleBadgeHtml = pricing.isOnSale
            ? `<span class="card-badge-sale">SALE -${pricing.discountPercent}%</span>`
            : '';
        const stockBadgeHtml = hasStock ? '' :
            `<span class="card-stock-badge card-stock-badge-out" aria-label="Sold out">SOLD OUT</span>`;

        // FEATURE 1: Strikethrough Pricing HTML
        const priceDisplayHtml = pricing.isOnSale
            ? `<div class="card-price"><span class="sale-price">৳ ${pricing.price}</span> <del class="old-price">৳ ${pricing.regularPrice}</del> <span class="card-discount">-${pricing.discountPercent}%</span></div>`
            : `<div class="card-price">৳ ${pricing.price}</div>`;

        // FEATURE 2: In-Card Image Slideshow HTML
        let mediaContentHtml = '';
        if (hasMultipleImages && viewMode !== 'list') {
            const dotsHtml = images.map((_, idx) => `<span class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`).join('');
            const slidesHtml = images.map((imgSrc, idx) => `
                <img src="${imgSrc}" class="card-slide-img ${idx === 0 ? 'active' : ''}" alt="${displayTitle} - Mohor Clothings Mohor Dress Image ${idx + 1}" loading="${productIndex === 0 && idx === 0 ? 'eager' : 'lazy'}" ${productIndex === 0 && idx === 0 ? 'fetchpriority="high"' : ''} decoding="async" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">
            `).join('');

            mediaContentHtml = `
                <div class="card-slider-container">
                    ${slidesHtml}
                    <div class="card-slider-dots">${dotsHtml}</div>
                </div>
            `;
        } else {
            mediaContentHtml = `<img src="${productCoverImage(product)}" alt="${displayTitle} - Mohor Clothings Mohor Dress" loading="${productIndex < 2 ? 'eager' : 'lazy'}" ${productIndex === 0 ? 'fetchpriority="high"' : ''} decoding="async" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">`;
        }

        if (viewMode === 'list') {
            card.innerHTML = `
                <div class="card-media">
                    <button type="button" class="wishlist-toggle ${window.isWishlisted(product.id) ? 'is-active' : ''}" data-wishlist-id="${String(product.id)}" aria-label="${window.isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${window.isWishlisted(product.id)}">${window.isWishlisted(product.id) ? '♥' : '♡'}</button>
                    ${saleBadgeHtml}
                    ${stockBadgeHtml}
                    <a class="card-media-link" href="${productUrl}" aria-label="${displayTitle}">${mediaContentHtml}</a>
                </div>
                <div class="card-body">
                    <div class="card-title"><a href="${productUrl}">${displayTitle}</a></div>
                    ${priceDisplayHtml}
                    ${colorOptionsHtml}
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="card-media">
                    <button type="button" class="wishlist-toggle ${window.isWishlisted(product.id) ? 'is-active' : ''}" data-wishlist-id="${String(product.id)}" aria-label="${window.isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${window.isWishlisted(product.id)}">${window.isWishlisted(product.id) ? '♥' : '♡'}</button>
                    ${saleBadgeHtml}
                    ${stockBadgeHtml}
                    <span class="card-cat">${displayCategory}</span>
                    <a class="card-media-link" href="${productUrl}" aria-label="${displayTitle}">${mediaContentHtml}</a>
                </div>
                <div class="card-body">
                    <div class="card-title"><a href="${productUrl}">${displayTitle}</a></div>
                    ${priceDisplayHtml}
                    ${colorOptionsHtml}
                </div>
            `;
        }

        // FEATURE 2: Attach slider dot click handlers
        if (hasMultipleImages && viewMode !== 'list') {
            const dots = card.querySelectorAll('.slider-dot');
            const slides = card.querySelectorAll('.card-slide-img');
            let activeSlide = 0;
            const showSlide = (index) => {
                const nextSlide = (index + slides.length) % slides.length;
                if (nextSlide === activeSlide) return;
                const previousSlide = slides[activeSlide];
                activeSlide = nextSlide;
                previousSlide.classList.remove('active');
                previousSlide.classList.add('slide-out-left');
                slides[activeSlide].classList.add('active');
                window.setTimeout(() => previousSlide.classList.remove('slide-out-left'), 560);
                dots.forEach((dot, i) => dot.classList.toggle('active', i === activeSlide));
            };
            dots.forEach(dot => {
                dot.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    showSlide(Number(dot.getAttribute('data-index')));
                });
            });
            let slideTimer = window.setInterval(() => showSlide(activeSlide + 1), 5000);
            card.addEventListener('mouseenter', () => window.clearInterval(slideTimer));
            card.addEventListener('mouseleave', () => {
                window.clearInterval(slideTimer);
                slideTimer = window.setInterval(() => showSlide(activeSlide + 1), 5000);
            });
        }

        productGrid.appendChild(card);
    });
    productGrid.querySelectorAll('[data-wishlist-id]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const active = window.toggleWishlist(button.dataset.wishlistId);
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
            button.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
            button.textContent = active ? '♥' : '♡';
        });
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
    window._lastRenderedProducts = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length>0) ? window.firestoreProducts : (window.productsData || []);
};

document.addEventListener('DOMContentLoaded', () => { initViewControls(); });

// Escape helper used in renderProducts inline JSON
function escapeHtml(json) { return String(json).replace(/\\/g,'\\\\').replace(/'/g, "\\'").replace(/\"/g,'\\\"'); }

function updateProducts() {
    if (window._catalogPending) {
        renderSkeletonGrid(8);
        return;
    }

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
    const customMin = Number(document.getElementById('customPriceMin')?.value);
    const customMax = Number(document.getElementById('customPriceMax')?.value);
    const hasCustomMin = Number.isFinite(customMin) && customMin >= 0 && document.getElementById('customPriceMin')?.value !== '';
    const hasCustomMax = Number.isFinite(customMax) && customMax >= 0 && document.getElementById('customPriceMax')?.value !== '';
    const sortValue = sortSelect.value;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = sourceData.filter(product => {
        const pricing = window.getProductPricing(product);
        
        // FEATURE 1: "On Sale" Quick Filter Matching
        let catMatch = activeCategories.length === 0;
        if (activeCategories.length > 0) {
            if (activeCategories.includes('on-sale') && pricing.isOnSale) catMatch = true;
            if (activeCategories.includes(product.category)) catMatch = true;
        }

        let priceMatch = activePrices.length === 0;

        if (!priceMatch) {
            if (activePrices.includes('under-1500') && product.price < 1500) priceMatch = true;
            if (activePrices.includes('1500-2500') && product.price >= 1500 && product.price <= 2500) priceMatch = true;
            if (activePrices.includes('above-2500') && product.price > 2500) priceMatch = true;
        }
        if (hasCustomMin && product.price < customMin) priceMatch = false;
        if (hasCustomMax && product.price > customMax) priceMatch = false;

        // Smart broad search
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
    ['customPriceMin', 'customPriceMax'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', updateProducts);
    });

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

    initPromoBannerAndCountdown();
    window.updateCartSavingsSummary();
});

// ==========================================================================
// FEATURE 3: RELATED PRODUCTS RECOMMENDATION ENGINE (SMART FALLBACK LOGIC)
// ==========================================================================
function renderRelatedProducts(currentProduct) {
    const container = document.getElementById('modalRelatedProducts');
    if (!container) return;

    container.innerHTML = '';
    let sourceData = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
        ? window.firestoreProducts
        : (window.productsData || []);

    const allOtherProducts = sourceData.filter(p => String(p.id) !== String(currentProduct.id));
    if (allOtherProducts.length === 0) return;

    // Smart Category Matching
    const sameCategoryItems = allOtherProducts.filter(p => p.category === currentProduct.category);
    const otherCategoryItems = allOtherProducts.filter(p => p.category !== currentProduct.category);

    // Dynamic Fallback Logic: ensure at least 3-4 recommendations
    let recommendations = [...sameCategoryItems];
    if (recommendations.length < 4) {
        recommendations = recommendations.concat(otherCategoryItems.slice(0, 4 - recommendations.length));
    }
    recommendations = recommendations.slice(0, 4);

    recommendations.forEach(relProduct => {
        const pricing = window.getProductPricing(relProduct);
        const card = document.createElement('div');
        card.className = 'related-product-card';
        card.onclick = () => openProductModal(relProduct);

        card.innerHTML = `
            <div class="rel-card-media">
                ${pricing.isOnSale ? `<span class="rel-sale-badge">-${pricing.discountPercent}%</span>` : ''}
                <img src="${productCoverImage(relProduct)}" alt="${getText(relProduct.title)} - Mohor Dress" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">
            </div>
            <div class="rel-card-info">
                <div class="rel-card-title">${getText(relProduct.title)}</div>
                <div class="rel-card-price">
                    <span class="rel-price">৳ ${pricing.price}</span>
                    ${pricing.isOnSale ? `<del class="rel-old-price">৳ ${pricing.regularPrice}</del>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================================================
// Quick-view modal (desktop)
// ==========================================================================
let currentViewingProduct = null;
let selectedSize = null;
let selectedColor = null;
let currentModalImageIndex = 0;
let _lastFocusedElement = null;

function trapFocus(container) {
    const selector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(container.querySelectorAll(selector)).filter(n => !n.hasAttribute('disabled') && n.getAttribute('tabindex') !== '-1');
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

    // Track ViewContent event in Meta Pixel + CAPI
    if (typeof window.trackMetaEvent === "function") {
        window.trackMetaEvent("ViewContent", {}, {
            content_name: getText(product.title),
            content_ids: [String(product.id)],
            content_type: 'product',
            value: product.price,
            currency: 'BDT'
        });
    }

    const sizeWarn = document.getElementById('sizeWarning');
    const colorWarn = document.getElementById('colorWarning');
    if (sizeWarn) sizeWarn.classList.remove('show');
    if (colorWarn) colorWarn.classList.remove('show');
    const sizeGuideDisplay = document.getElementById('sizeGuideDisplay');
    if (sizeGuideDisplay) { sizeGuideDisplay.innerHTML = ""; sizeGuideDisplay.classList.remove('show'); }

    const pricing = window.getProductPricing(product);

    // FEATURE 1: Modal Price & Badges
    document.getElementById('modalTitle').innerText = getText(product.title);
    document.getElementById('modalPrice').innerText = `৳ ${pricing.price}`;
    const modalColorSummary = document.getElementById('modalColorSummary');
    if (modalColorSummary) {
        let summaryColors = product.colors;
        if (!Array.isArray(summaryColors) && summaryColors && typeof summaryColors === 'object') {
            summaryColors = summaryColors[window.currentLang] || summaryColors.en || [];
        }
        modalColorSummary.textContent = Array.isArray(summaryColors) && summaryColors.length
            ? `${window.currentLang === 'bn' ? 'রং' : 'Color'}: ${summaryColors.join(', ')}`
            : '';
    }

    const origPriceEl = document.getElementById('modalOriginalPrice');
    const savingsTagEl = document.getElementById('modalSavingsTag');
    const discountBadgeEl = document.getElementById('modalDiscountBadge');

    if (pricing.isOnSale) {
        if (origPriceEl) { origPriceEl.innerText = `৳ ${pricing.regularPrice}`; origPriceEl.style.display = 'inline-block'; }
        if (savingsTagEl) { savingsTagEl.innerText = `-${pricing.discountPercent}% OFF`; savingsTagEl.style.display = 'inline-block'; }
        if (discountBadgeEl) { discountBadgeEl.innerText = `-${pricing.discountPercent}% OFF`; discountBadgeEl.style.display = 'inline-block'; }
    } else {
        if (origPriceEl) origPriceEl.style.display = 'none';
        if (savingsTagEl) savingsTagEl.style.display = 'none';
        if (discountBadgeEl) discountBadgeEl.style.display = 'none';
    }

    document.getElementById('modalDesc').innerText = getText(product.description);
    const catLabel = document.getElementById('modalCategory');
    if (catLabel) catLabel.innerText = (product.category || '').replace('-', ' ');

    const mainImage = document.getElementById('modalMainImage');
    const thumbContainer = document.getElementById('modalThumbnails');
    thumbContainer.innerHTML = '';

    const images = (product.images && product.images.length > 0) ? product.images : ['assets/image-placeholder.svg'];
    currentModalImageIndex = 0;

    images.forEach((imgSrc, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail' + (index === 0 ? ' active' : '');
        thumb.innerHTML = `<img src="${imgSrc}" alt="${getText(product.title)} Mohor Dress - Image ${index + 1}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">`;
        thumb.onclick = () => {
            setModalImage(index);
        };
        thumbContainer.appendChild(thumb);
    });
    setModalImage(0);

    const colorsContainer = document.getElementById('modalColors');
    const colorSection = document.getElementById('colorSection');
    colorsContainer.innerHTML = '';
    let colorArray = [];
    if (product.colors) colorArray = Array.isArray(product.colors) ? product.colors : (product.colors[window.currentLang] || product.colors['en'] || []);

    if (colorArray.length > 0) {
        colorSection.style.display = 'block';
        colorArray.forEach(color => {
            const button = buildOptButton(colorsContainer, color, 'color');
            const colorName = typeof color === 'string' ? color : (color.name?.[window.currentLang] || color.name?.en || color.label || '');
            const available = (product.sizes || ['Standard']).some(size => window.productSizeIsAvailable(product, size, colorName));
            button.disabled = !available;
            button.classList.toggle('is-sold-out', !available);
        });
    } else {
        colorSection.style.display = 'none';
        selectedColor = "Default";
    }

    const sizesContainer = document.getElementById('modalSizes');
    sizesContainer.innerHTML = '';
    if (product.sizes) product.sizes.forEach(size => {
        const button = buildOptButton(sizesContainer, size, 'size');
        const available = window.productSizeIsAvailable(product, size);
        button.disabled = !available;
        button.classList.toggle('is-sold-out', !available);
        button.setAttribute('aria-label', available ? `${size} available` : `${size} sold out`);
    });

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

    // FEATURE 3: Render Related Products Inside Modal
    renderRelatedProducts(product);

    // open modal visibility and accessibility
    _lastFocusedElement = document.activeElement;
    productModal.classList.add('active');
    productModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    trapFocus(productModal);
    const preferFocus = productModal.querySelector('#closeModalBtn') || productModal.querySelector('[tabindex]') || productModal.querySelector('button, a, input');
    if (preferFocus) preferFocus.focus();
}
window.openProductModal = openProductModal;

function setModalImage(index) {
    if (!currentViewingProduct) return;
    const images = (currentViewingProduct.images && currentViewingProduct.images.length > 0)
        ? currentViewingProduct.images : ['assets/image-placeholder.svg'];
    currentModalImageIndex = (index + images.length) % images.length;
    const pricing = window.getProductPricing(currentViewingProduct);
    const title = getText(currentViewingProduct.title);
    const mainImage = document.getElementById('modalMainImage');
    if (!mainImage) return;
    mainImage.innerHTML = `
        ${pricing.isOnSale ? `<span class="modal-discount-badge">-${pricing.discountPercent}% OFF</span>` : ''}
        <img src="${images[currentModalImageIndex]}" alt="${title} - Mohor Clothings Mohor Dress" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/image-placeholder.svg';">
    `;
    document.querySelectorAll('#modalThumbnails .thumbnail').forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('active', thumbIndex === currentModalImageIndex);
    });
}

function selectOption(clickedBtn, value, type) {
    const isAlreadySelected = clickedBtn.classList.contains('selected');
    if (type === 'size') {
        if (clickedBtn.disabled) return;
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
        if (clickedBtn.disabled) return;
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
    try { if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') setTimeout(() => _lastFocusedElement.focus(), 0); } catch (e) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);

    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', (e) => { if (e.target === productModal) closeProductModal(); });
    }

    const modalMainImage = document.getElementById('modalMainImage');
    if (modalMainImage) {
        let touchStartX = 0;
        modalMainImage.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        modalMainImage.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(deltaX) < 40) return;
            setModalImage(currentModalImageIndex + (deltaX < 0 ? 1 : -1));
        }, { passive: true });
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
            if (selectedSize && !window.productSizeIsAvailable(currentViewingProduct, selectedSize, selectedColor)) {
                const warn = document.getElementById('sizeWarning'); if (warn) { warn.textContent = 'This size is out of stock'; warn.classList.add('show'); }
                valid = false;
            }
            if (!selectedColor) {
                const warn = document.getElementById('colorWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (!valid) return;

            // AddToCart is tracked once, globally, by the wrapped window.addToCart
            // installed below (see "Intercept cart.js addToCart calls globally") —
            // tracking it again here would double-count the event in Meta Ads Manager.
            if (typeof window.addToCart === "function") {
                window.addToCart(currentViewingProduct, selectedSize || 'Standard', selectedColor);
            }

            closeProductModal();
        });
    }

    const modalBuyNowBtn = document.getElementById('modalBuyNowBtn');
    if (modalBuyNowBtn) {
        modalBuyNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let valid = true;
            if (!selectedSize && currentViewingProduct && currentViewingProduct.sizes && currentViewingProduct.sizes.length > 0) {
                const warn = document.getElementById('sizeWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (selectedSize && !window.productSizeIsAvailable(currentViewingProduct, selectedSize, selectedColor)) {
                const warn = document.getElementById('sizeWarning'); if (warn) { warn.textContent = 'This size is out of stock'; warn.classList.add('show'); }
                valid = false;
            }
            if (!selectedColor) {
                const warn = document.getElementById('colorWarning'); if (warn) warn.classList.add('show');
                valid = false;
            }
            if (!valid) return;

            // Same note as Add to Cart above: AddToCart itself is tracked once,
            // globally, by the wrapped window.addToCart. Only InitiateCheckout
            // is specific to the Buy Now action, so only that fires here.
            if (typeof window.addToCart === "function") {
                window.addToCart(currentViewingProduct, selectedSize || 'Standard', selectedColor);
            }

            if (typeof window.trackMetaEvent === "function" && currentViewingProduct) {
                window.trackMetaEvent("InitiateCheckout", {}, {
                    content_name: getText(currentViewingProduct.title),
                    content_ids: [String(currentViewingProduct.id)],
                    content_type: 'product',
                    value: currentViewingProduct.price,
                    currency: 'BDT'
                });
            }

            closeProductModal();
            window.location.href = '/cart/';
        });
    }
});

// ==========================================================================
// Nav interactions: mobile menu, sticky shadow, filter drawer, cart routing
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('siteHeader');
    if (header) {
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    header.classList.toggle('scrolled', window.scrollY > 8);
                    ticking = false;
                });
                ticking = true;
            }
        };
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
    if (mobileFilterBtn) mobileFilterBtn.addEventListener('click', () => mobileFilterBtn.setAttribute('aria-expanded', 'true'));
    if (closeFiltersBtn) closeFiltersBtn.addEventListener('click', () => {
        closeFilters();
        if (mobileFilterBtn) mobileFilterBtn.setAttribute('aria-expanded', 'false');
    });
    if (filtersOverlay) filtersOverlay.addEventListener('click', () => {
        closeFilters();
        if (mobileFilterBtn) mobileFilterBtn.setAttribute('aria-expanded', 'false');
    });

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
            ['customPriceMin', 'customPriceMax'].forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
            updateProducts();
        });
    }

    const topNavCartBtn = document.getElementById('openCartBtn');
    if (topNavCartBtn) {
        topNavCartBtn.addEventListener('click', (e) => {
            if (window.innerWidth <= 900 && !window.location.pathname.endsWith('/cart/')) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = '/cart/';
            }
        }, true);
    }
});

// ==========================================================================
// Scroll reveal (IntersectionObserver)
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

    const grid = document.getElementById('productGrid');
    if (grid) {
        const gridObserver = new MutationObserver(() => { if (!grid.classList.contains('in-view')) grid.classList.add('in-view'); });
        gridObserver.observe(grid, { childList: true });
    }

    document.body.classList.add('is-ready');
});

// Intercept cart.js addToCart calls globally across all standalone pages
window.addEventListener('load', () => {
    if (typeof window.addToCart === 'function' && !window._capiHooked) {
        window._capiHooked = true;
        const originalAddToCart = window.addToCart;
        window.addToCart = function(product, size, color) {
            originalAddToCart(product, size, color);
            if (typeof window.updateCartSavingsSummary === 'function') {
                window.updateCartSavingsSummary();
            }
            if (product && typeof window.trackMetaEvent === 'function') {
                window.trackMetaEvent("AddToCart", {}, {
                    content_name: window.getText ? window.getText(product.title) : (product.title || 'Product'),
                    content_ids: [String(product.id)],
                    content_type: 'product',
                    value: product.price || 0,
                    currency: 'BDT'
                });
            }
        };
    }
});

if (document.readyState !== 'loading') document.body.classList.add('is-ready');
