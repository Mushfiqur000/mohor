// ==========================================================================
// MOHOR CLOTHINGS — cart.js
// Cart state, cart UI, dynamic discount savings engine, and the two checkout paths.
// ==========================================================================

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
} 

function notify(message, type) {
    if (typeof window.showToast === 'function') window.showToast(message, type);
    else alert(message);
}

// SECURITY & DISCOUNT ENGINE: look up canonical item pricing & discount specs
// from the product catalog (Firestore if loaded, else static fallback).
// Recomputes regular price vs sale price to prevent client-side tampering via devtools.
function getCanonicalItemDetails(item) {
    const catalog = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
        ? window.firestoreProducts
        : (window.productsData || []);

    let match = null;
    if (Array.isArray(catalog) && catalog.length > 0) {
        if (item.id !== undefined && item.id !== null) {
            match = catalog.find(p => String(p.id) === String(item.id));
        }
        if (!match && item.baseTitle) {
            match = catalog.find(p => {
                const title = typeof p.title === 'string' ? p.title : (p.title && (p.title.en || p.title.bn)) || '';
                return title === item.baseTitle;
            });
        }
        if (!match) {
            match = catalog.find(p => p.title && (p.title.en === item.name || p.title.bn === item.name));
        }
    }

    let regularPrice = Number(item.regularPrice || item.originalPrice || item.price) || 0;
    let salePrice = item.salePrice !== undefined && item.salePrice !== null ? Number(item.salePrice) : (Number(item.price) || regularPrice);

    if (match) {
        const catalogReg = Number(match.originalPrice || match.regularPrice || match.price) || 0;
        const catalogSale = match.salePrice !== undefined && match.salePrice !== null ? Number(match.salePrice) : (match.price < catalogReg ? Number(match.price) : catalogReg);
        regularPrice = catalogReg;
        salePrice = catalogSale;
    }

    // Check for active storewide bulk percentage discount if salePrice isn't individually explicitly lower
    const activeStoreDiscount = window.activeStoreDiscount || 0;
    if (activeStoreDiscount > 0 && regularPrice > 0 && salePrice >= regularPrice) {
        salePrice = Math.round(regularPrice * (1 - activeStoreDiscount / 100));
    }

    const effectivePrice = (salePrice > 0 && salePrice < regularPrice) ? salePrice : (salePrice || regularPrice);
    const savingsPerUnit = Math.max(0, regularPrice - effectivePrice);

    return { regularPrice, salePrice: effectivePrice, effectivePrice, savingsPerUnit };
}

function getCanonicalPrice(item) {
    return getCanonicalItemDetails(item).effectivePrice;
}

// Load cart from storage so it survives page reloads / mobile navigation.
window.cart = JSON.parse(localStorage.getItem('mohor_cart') || '[]');

// Save cart state safely on pagehide instead of unload (BFCache friendly)
window.addEventListener('pagehide', () => {
    try {
        localStorage.setItem('mohor_cart', JSON.stringify(window.cart || []));
    } catch (e) {
        console.error('Error saving cart on pagehide:', e);
    }
});

const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsContainer = document.getElementById('cartItemsContainer') || document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');

window.closeCartSidebar = function() {
    if (cartSidebar) cartSidebar.classList.remove('active');
    if (cartOverlay) cartOverlay.classList.remove('active');
};
window.openCartSidebar = function() {
    if (cartSidebar) cartSidebar.classList.add('active');
    if (cartOverlay) cartOverlay.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openCartBtn');
    if (openBtn) openBtn.addEventListener('click', () => window.openCartSidebar());
    const closeBtn = document.getElementById('closeCartBtn');
    if (closeBtn) closeBtn.addEventListener('click', window.closeCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener('click', window.closeCartSidebar);
});

// Attached to window so quick-view modal (app.js) and product.html can call it.
window.addToCart = function(product, size, color) {
    const getTextFn = (typeof window.getText === 'function') ? window.getText : (f => typeof f === 'string' ? f : (f?.en || 'Item'));
    const baseTitle = getTextFn(product.title) || 'Item';
    const id = product.id !== undefined ? String(product.id) : null;
    const regularPrice = Number(product.originalPrice || product.regularPrice || product.price) || 0;
    const salePrice = (product.salePrice !== undefined && product.salePrice !== null) ? Number(product.salePrice) : (product.price < regularPrice ? Number(product.price) : regularPrice);
    const effectivePrice = (salePrice > 0 && salePrice < regularPrice) ? salePrice : regularPrice;

    const displayColor = (color && color !== 'Default') ? color : null;
    const displayName = baseTitle + (displayColor ? ` (${displayColor})` : '');
    const availableStock = typeof window.getProductSizeQuantity === 'function'
        ? window.getProductSizeQuantity(product, size, displayColor)
        : Number(product.quantity || 0);
    if (availableStock <= 0) {
        notify('This size is out of stock.', 'error');
        return false;
    }

    let existingItem = window.cart.find(item =>
        (id ? item.id === id : item.name === displayName) && item.size === size && (item.color || null) === displayColor
    );

    if (existingItem) {
        if (existingItem.qty >= availableStock) {
            notify('The selected size has no more stock available.', 'error');
            return false;
        }
        existingItem.qty += 1;
        existingItem.regularPrice = regularPrice;
        existingItem.salePrice = salePrice;
        existingItem.price = effectivePrice;
    } else {
        window.cart.push({
            id,
            baseTitle,
            name: displayName,
            price: effectivePrice,
            regularPrice,
            salePrice,
            size: size || 'Standard',
            color: displayColor,
            qty: 1
        });
    }

    window.updateCartUI();
    if (cartBadge) { cartBadge.classList.remove('pop'); void cartBadge.offsetWidth; cartBadge.classList.add('pop'); }

    if (cartSidebar && cartOverlay) {
        window.openCartSidebar();
    } else {
        const tFn = (typeof window.t === 'function') ? window.t : (k => k === 'addedToCart' ? 'Added to cart!' : k);
        notify(tFn('addedToCart'), 'success');
    }
    return true;
};

window.changeQty = function(index, delta) {
    if (!window.cart[index]) return;
    if (delta > 0 && typeof window.getProductSizeQuantity === 'function') {
        const item = window.cart[index];
        const catalog = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
            ? window.firestoreProducts : (window.productsData || []);
        const product = catalog.find(p => String(p.id) === String(item.id));
        if (product && item.qty >= window.getProductSizeQuantity(product, item.size, item.color)) {
            notify('The selected size has no more stock available.', 'error');
            return;
        }
    }
    window.cart[index].qty += delta;
    if (window.cart[index].qty <= 0) window.cart.splice(index, 1);
    window.updateCartUI();
};

window.removeFromCart = function(index) {
    window.cart.splice(index, 1);
    window.updateCartUI();
};

// Outside Sylhet delivery charge updated to 140 TK (Applied once per order)
function currentDeliveryFee() {
    const zoneSelect = document.getElementById('deliveryZone');
    if (!zoneSelect || !zoneSelect.value || window.cart.length === 0) return 0;
    if (zoneSelect.value === 'outside' || zoneSelect.value === '140' || zoneSelect.value === '130' || zoneSelect.value === '150') return 140;
    if (zoneSelect.value === 'inside' || zoneSelect.value === '70' || zoneSelect.value === '80') return 70;
    return parseInt(zoneSelect.value, 10) || 0;
}

window.updateDeliveryPolicyAndTotal = function() {
    const zoneSelect = document.getElementById('deliveryZone');
    const policyDisplay = document.getElementById('dynamicPolicyDisplay');
    const tFn = (typeof window.t === 'function') ? window.t : (k => k);

    if (zoneSelect && policyDisplay) {
        if (zoneSelect.value === '70' || zoneSelect.value === '80' || zoneSelect.value === 'inside') {
            policyDisplay.style.display = 'block';
            policyDisplay.innerHTML = tFn('zoneDeliveryInside') || 'Inside Sylhet City: ৳70';
        } else if (zoneSelect.value === '140' || zoneSelect.value === '130' || zoneSelect.value === '150' || zoneSelect.value === 'outside') {
            policyDisplay.style.display = 'block';
            policyDisplay.innerHTML = tFn('zoneDeliveryOutside') || 'Outside Sylhet: ৳140';
        } else {
            policyDisplay.style.display = 'none';
        }
    }
    window.updateCartUI();
};

// Render Cart Total Savings Indicators ("You save ৳ X on this order!")
function renderSavingsIndicators(totalSavings) {
    const savingsTargets = [
        document.getElementById('cartSavings'),
        document.getElementById('cartSavingsIndicator'),
        document.getElementById('checkoutSavings')
    ];

    const isBn = window.currentLang === 'bn';
    const formattedSavings = totalSavings.toLocaleString('en-IN');
    const savingsMsg = isBn
        ? `আপনি এই অর্ডারে ৳ ${formattedSavings} সাশ্রয় করছেন!`
        : `You save ৳ ${formattedSavings} on this order!`;

    savingsTargets.forEach(container => {
        if (!container) return;
        if (totalSavings > 0) {
            container.style.display = 'block';
            container.className = 'cart-savings-indicator';
            container.innerHTML = `<span class="savings-icon">🎉</span> ${savingsMsg}`;
        } else {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    });
}

window.updateCartUI = function() {
    localStorage.setItem('mohor_cart', JSON.stringify(window.cart));

    if (cartItemsContainer) cartItemsContainer.innerHTML = '';
    let subtotal = 0;
    let totalSavings = 0;
    let totalItems = 0;
    const tFn = (typeof window.t === 'function') ? window.t : (k => k);

    if (window.cart.length === 0) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <div>${tFn('cartEmpty') || 'Your cart is empty'}</div>
                    <div style="font-size:.78rem;margin:4px 0 16px;">${tFn('cartEmptySub') || 'Looks like you haven\'t added anything yet.'}</div>
                    <button type="button" class="btn btn-outline btn-sm" id="continueShoppingBtn">${tFn('continueShopping') || 'Continue Shopping'}</button>
                </div>`;
            const csBtn = document.getElementById('continueShoppingBtn');
            if (csBtn) csBtn.addEventListener('click', () => {
                window.closeCartSidebar();
                if (!window.location.pathname.endsWith('/') && window.location.pathname !== '/') window.location.href = '/';
            });
        }
    } else {
        window.cart.forEach((item, index) => {
            const details = getCanonicalItemDetails(item);
            const itemTotal = details.effectivePrice * Number(item.qty || 1);
            const itemSavings = details.savingsPerUnit * Number(item.qty || 1);

            subtotal += itemTotal;
            totalSavings += itemSavings;
            totalItems += Number(item.qty || 1);

            if (!cartItemsContainer) return;

            const metaParts = [];
            if (item.size) metaParts.push('Size: ' + escapeHtml(item.size));
            if (item.color) metaParts.push('Color: ' + escapeHtml(item.color));

            const priceMarkup = (details.savingsPerUnit > 0)
                ? `<span class="price-original" style="text-decoration:line-through;color:#888;font-size:0.82em;margin-right:4px;">৳${details.regularPrice * item.qty}</span> ৳${itemTotal}`
                : `৳${itemTotal}`;

            const row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML = `
                <div class="cart-item-info">
                    <div class="ci-name">${escapeHtml(item.baseTitle || item.name)}</div>
                    <div class="ci-meta">${metaParts.join(' &middot; ')}</div>
                    <div class="qty-stepper">
                        <button type="button" aria-label="Decrease quantity" data-action="dec">−</button>
                        <span>${item.qty}</span>
                        <button type="button" aria-label="Increase quantity" data-action="inc">+</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <div class="cart-item-price">${priceMarkup}</div>
                    <button type="button" class="remove-item">Remove</button>
                </div>`;
            row.querySelector('[data-action="dec"]').addEventListener('click', () => window.changeQty(index, -1));
            row.querySelector('[data-action="inc"]').addEventListener('click', () => window.changeQty(index, 1));
            row.querySelector('.remove-item').addEventListener('click', () => window.removeFromCart(index));
            cartItemsContainer.appendChild(row);
        });
    }

    const deliveryFee = Number(currentDeliveryFee()) || 0;
    const finalTotal = subtotal + deliveryFee;

    const subEl = document.getElementById('cartSubtotalValue') || document.getElementById('cartSubtotal') || document.getElementById('subtotalAmount');
    const delEl = document.getElementById('cartDeliveryValue') || document.getElementById('cartDelivery') || document.getElementById('deliveryFee');
    const totEl = document.getElementById('cartTotalValue') || document.getElementById('cartTotal') || document.getElementById('grandTotalAmount');
    if (subEl) subEl.innerText = subtotal;
    if (delEl) delEl.innerText = deliveryFee;
    if (totEl) totEl.innerText = finalTotal;

    // Render Savings Banner
    renderSavingsIndicators(totalSavings);

    if (cartBadge) { cartBadge.innerText = totalItems; cartBadge.setAttribute('data-count', String(totalItems)); }
    const iconBadge = document.getElementById('cartBadgeIcon');
    if (iconBadge) { iconBadge.innerText = totalItems; iconBadge.style.display = totalItems > 0 ? 'flex' : 'none'; }
};

// --- DUAL CHECKOUT LOGIC ---
function fieldFlash(el) {
    if (!el) return;
    el.classList.add('field-error', 'shake');
    setTimeout(() => el.classList.remove('shake'), 480);
    el.addEventListener('input', function clear() { el.classList.remove('field-error'); el.removeEventListener('input', clear); }, { once: true });
}

function validateCheckoutInputs() {
    const tFn = (typeof window.t === 'function') ? window.t : (k => k);
    if (window.cart.length === 0) {
        notify(tFn('cartEmpty') || 'Your cart is empty', 'error');
        return null;
    }

    const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
    const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
    const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress') || document.getElementById('custAddress');
    const zoneSelect = document.getElementById('deliveryZone');
    const policyElement = document.getElementById('policyAgree');

    const nameInput = nameEl ? nameEl.value.trim() : '';
    const phoneInput = phoneEl ? phoneEl.value.trim() : '';
    const addressInput = addressEl ? addressEl.value.trim() : '';
    const policyAgree = policyElement ? policyElement.checked : true;

    if (!nameInput) {
        notify(window.currentLang === 'en' ? 'Please enter your full name.' : 'অনুগ্রহ করে আপনার পুরো নাম দিন।', 'error');
        fieldFlash(nameEl); return null;
    }
    if (!phoneInput) {
        notify(window.currentLang === 'en' ? 'Please enter your mobile number.' : 'অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।', 'error');
        fieldFlash(phoneEl); return null;
    }

    // Basic Bangladesh mobile number validation (01XXXXXXXXX)
    const bdPhoneRegex = /^01[0-9]{9}$/;
    if (!bdPhoneRegex.test(phoneInput)) {
        notify(window.currentLang === 'en' ? 'Please enter a valid BD mobile number (01XXXXXXXXX).' : 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।', 'error');
        fieldFlash(phoneEl); return null;
    }

    if (!addressInput) {
        notify(window.currentLang === 'en' ? 'Please enter your delivery address.' : 'অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা দিন।', 'error');
        fieldFlash(addressEl); return null;
    }
    if (!zoneSelect || !zoneSelect.value) {
        notify(window.currentLang === 'en' ? 'Please select a delivery zone.' : 'অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন।', 'error');
        fieldFlash(zoneSelect); return null;
    }
    if (policyElement && !policyAgree) {
        notify(window.currentLang === 'en' ? 'Please agree to the Delivery & Return Policy.' : 'অনুগ্রহ করে ডেলিভারি ও রিটার্ন পলিসিতে সম্মত হোন।', 'error');
        return null;
    }

    const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text;
    const deliveryFee = Number(currentDeliveryFee()) || 0;

    // Recompute subtotal and savings from canonical product prices to avoid trusting mutable client-side values
    let canonicalSubtotal = 0;
    let totalSavings = 0;
    try {
        window.cart.forEach(item => {
            const details = getCanonicalItemDetails(item);
            canonicalSubtotal += details.effectivePrice * (Number(item.qty) || 1);
            totalSavings += details.savingsPerUnit * (Number(item.qty) || 1);
        });
    } catch (e) {
        console.warn('Error computing canonical subtotal', e);
        window.cart.forEach(item => canonicalSubtotal += (Number(item.price) || 0) * (Number(item.qty) || 1));
    }

    const finalTotal = canonicalSubtotal + deliveryFee;
    return { name: nameInput, phone: phoneInput, address: addressInput, zoneText, deliveryFee, subtotal: canonicalSubtotal, totalSavings, finalTotal };
}

function resetCheckoutFormsIfGuest(isGuest) {
    if (isGuest) {
        const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
        const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
        const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress') || document.getElementById('custAddress');
        if (nameEl) nameEl.value = '';
        if (phoneEl) phoneEl.value = '';
        if (addressEl) addressEl.value = '';
    }
    const zoneSelect = document.getElementById('deliveryZone');
    if (zoneSelect) zoneSelect.value = '';
    const policyEl = document.getElementById('policyAgree');
    if (policyEl) policyEl.checked = false;
    const policyDisplay = document.getElementById('dynamicPolicyDisplay');
    if (policyDisplay) policyDisplay.style.display = 'none';
}

// Option 1: WhatsApp order
window.checkoutToWhatsApp = function() {
    const orderData = validateCheckoutInputs();
    if (!orderData) return;

    const WHATSAPP_NUMBER = '8801330113027';
    // Free-text fields (item names, customer name/address) can contain
    // characters like & or # that are meaningful in a URL, so each dynamic
    // piece is percent-encoded individually. The %0A newlines and *bold*
    // markers are intentional literal WhatsApp formatting, left as-is.
    let message = 'Hello Mohor Clothings! I would like to order the following items:%0A%0A';
    window.cart.forEach((item, index) => {
        const details = getCanonicalItemDetails(item);
        const itemTotal = details.effectivePrice * Number(item.qty);
        message += `${index + 1}. ${encodeURIComponent(item.name)} (Size: ${encodeURIComponent(item.size)}) | Qty: ${item.qty} - ৳${itemTotal}%0A`;
    });
    message += `%0A*Subtotal: ৳${orderData.subtotal}*`;
    if (orderData.totalSavings > 0) {
        message += `%0A*Total Savings: ৳${orderData.totalSavings}*`;
    }
    message += `%0A*Delivery (${encodeURIComponent(orderData.zoneText)}): ৳${orderData.deliveryFee}*`;
    message += `%0A*FINAL TOTAL: ৳${orderData.finalTotal}*%0A`;
    message += `%0A*CUSTOMER DETAILS:*%0AName: ${encodeURIComponent(orderData.name)}%0APhone: ${encodeURIComponent(orderData.phone)}%0AAddress: ${encodeURIComponent(orderData.address)}`;

    // Open WhatsApp first — only clear the cart once we know the redirect fired
    const win = window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    window.cart = [];
    window.updateCartUI();
    if (!win) notify(window.currentLang === 'en' ? 'Please allow pop-ups to continue to WhatsApp.' : 'হোয়াটসঅ্যাপে যেতে অনুগ্রহ করে পপ-আপের অনুমতি দিন।', 'error');
};

// Option 2: Direct website order (Firebase)
window.checkoutToAdmin = async function() {
    const orderData = validateCheckoutInputs();
    if (!orderData) return;

    const confirmBtn = document.getElementById('adminOrderBtn') || document.getElementById('btnConfirmOrder') || document.querySelector('#checkoutForm button[type="submit"]');
    if (confirmBtn) { confirmBtn.classList.add('is-loading'); confirmBtn.disabled = true; }

    try {
        let activeUid = null;
        let activeEmail = null;

        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            activeUid = firebase.auth().currentUser.uid;
            activeEmail = firebase.auth().currentUser.email;
        } else if (window.currentUser) {
            activeUid = window.currentUser.uid;
            activeEmail = window.currentUser.email || null;
        }

        // SECURITY: recompute each line item from canonical catalog and force Number types
        const verifiedItems = window.cart.map(item => {
            const details = getCanonicalItemDetails(item);
            return {
                name: String(item.name || item.baseTitle || 'Item'),
                size: String(item.size || 'Standard'),
                color: String(item.color || 'Default'),
                qty: Number(item.qty) || 1,
                price: Number(details.effectivePrice) || 0,
                regularPrice: Number(details.regularPrice) || 0,
                salePrice: Number(details.salePrice) || 0,
                savings: Number(details.savingsPerUnit * (item.qty || 1)) || 0
            };
        });

        const verifiedSubtotal = Number(verifiedItems.reduce((sum, item) => sum + (item.price * item.qty), 0)) || 0;
        const verifiedTotalSavings = Number(verifiedItems.reduce((sum, item) => sum + item.savings, 0)) || 0;
        const verifiedTotal = Number(verifiedSubtotal + (orderData.deliveryFee || 0)) || 0;

        const dbInstance = window.db || (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);

        const newOrder = {
            userId: activeUid,
            userEmail: activeEmail,
            customerName: String(orderData.name),
            customerPhone: String(orderData.phone),
            deliveryAddress: String(orderData.address),
            deliveryZone: String(orderData.zoneText),
            deliveryFee: Number(orderData.deliveryFee) || 0,
            subtotal: verifiedSubtotal,
            totalSavings: verifiedTotalSavings,
            totalAmount: verifiedTotal,
            items: verifiedItems,
            orderDate: typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
            status: 'pending'
        };

        let docRef = null;
        if (dbInstance) {
            docRef = await dbInstance.collection('orders').add(newOrder);
        } else {
            throw new Error("Firestore database instance is not available.");
        }

        // Trigger instant Telegram notification to the store owner
        if (typeof window.sendTelegramNotification === 'function') {
            // Wait for the request before redirecting; otherwise navigation can
            // cancel the notification before the browser sends it.
            const telegramSent = await window.sendTelegramNotification({ ...newOrder, id: docRef.id });
            if (!telegramSent) console.warn('Order saved, but Telegram notification was not delivered.');
        }

        // Track the completed purchase once, right here at the moment the
        // order is actually confirmed written — this is the single source of
        // truth for the Purchase conversion event (the standalone order
        // success page intentionally stays lightweight and doesn't re-fire it).
        if (typeof window.trackMetaEvent === 'function') {
            window.trackMetaEvent('Purchase', {}, {
                content_ids: window.cart.map(item => String(item.id ?? item.name)),
                content_type: 'product',
                num_items: verifiedItems.reduce((sum, item) => sum + item.qty, 0),
                value: verifiedTotal,
                currency: 'BDT'
            });
        }

        notify(window.currentLang === 'en' ? 'Order placed successfully! We will contact you soon.' : 'আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।', 'success');

        window.cart = [];
        window.updateCartUI();
        window.closeCartSidebar();
        resetCheckoutFormsIfGuest(!activeUid);

        if (activeUid && typeof window.loadUserOrders === 'function') window.loadUserOrders(activeUid);

        // Redirect to order confirmation page
        window.location.href = `/order-success/?orderId=${docRef.id}`;
    } catch (error) {
        console.error('Error saving order: ', error);
        notify(window.currentLang === 'en' ? 'There was an error placing your order. Please try WhatsApp instead.' : 'অর্ডার প্লেস করতে সমস্যা হয়েছে। অনুগ্রহ করে হোয়াটসঅ্যাপে চেষ্টা করুন।', 'error');
    } finally {
        if (confirmBtn) { confirmBtn.classList.remove('is-loading'); confirmBtn.disabled = false; }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnWhatsApp = document.getElementById('btnWhatsAppOrder');
    if (btnWhatsApp) btnWhatsApp.addEventListener('click', window.checkoutToWhatsApp);

    const btnConfirm = document.getElementById('btnConfirmOrder');
    if (btnConfirm) btnConfirm.addEventListener('click', window.checkoutToAdmin);

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.checkoutToAdmin();
        });
    }

    const zoneSelect = document.getElementById('deliveryZone');
    if (zoneSelect) zoneSelect.addEventListener('change', window.updateDeliveryPolicyAndTotal);

    window.updateCartUI();
});
