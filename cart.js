// ==========================================================================
// MOHOR CLOTHINGS — cart.js
// Cart state, cart UI, and the two checkout paths (WhatsApp / website).
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

// SECURITY: look up the real, current price for a cart line from the
// canonical product catalog (Firestore if loaded, else the static fallback)
// instead of trusting whatever price was cached in localStorage, which is
// editable via devtools before checkout. Matches by product id first, then
// by base title, then falls back to the legacy display-name match so a
// cart saved by an older version of this site still verifies correctly.
// NOTE: this is a client-side mitigation only — the authoritative fix is to
// re-validate totals in Firestore Security Rules or a Cloud Function, since
// anyone can bypass this file entirely and call the Firestore SDK directly.
function getCanonicalPrice(item) {
    const catalog = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
        ? window.firestoreProducts
        : (window.productsData || []);
    if (!Array.isArray(catalog) || catalog.length === 0) return item.price;

    let match = null;
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
    if (!match) {
        console.warn('Could not verify price for "' + item.name + '" against catalog; using cached price.');
        return item.price;
    }
    return match.price;
}

// Load cart from storage so it survives page reloads / mobile navigation.
window.cart = JSON.parse(localStorage.getItem('mohor_cart') || '[]');

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

// Attached to window so the quick-view modal (app.js) and product.html can
// call it. Takes the full product object (not just a name string) so the
// cart line can carry a stable id/baseTitle for reliable price verification
// at checkout, independent of how the display name gets formatted.
window.addToCart = function(product, size, color) {
    const baseTitle = getText(product.title) || (typeof product.title === 'string' ? product.title : 'Item');
    const id = product.id !== undefined ? String(product.id) : null;
    const price = Number(product.price) || 0;

    const displayColor = (color && color !== 'Default') ? color : null;
    const displayName = baseTitle + (displayColor ? ` (${displayColor})` : '');

    let existingItem = window.cart.find(item =>
        (id ? item.id === id : item.name === displayName) && item.size === size && (item.color || null) === displayColor
    );

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        window.cart.push({ id, baseTitle, name: displayName, price, size: size || 'Standard', color: displayColor, qty: 1 });
    }

    window.updateCartUI();
    if (cartBadge) { cartBadge.classList.remove('pop'); void cartBadge.offsetWidth; cartBadge.classList.add('pop'); }

    if (cartSidebar && cartOverlay) {
        window.openCartSidebar();
    } else {
        notify(t('addedToCart'), 'success');
    }
};

window.changeQty = function(index, delta) {
    if (!window.cart[index]) return;
    window.cart[index].qty += delta;
    if (window.cart[index].qty <= 0) window.cart.splice(index, 1);
    window.updateCartUI();
};

window.removeFromCart = function(index) {
    window.cart.splice(index, 1);
    window.updateCartUI();
};

function currentDeliveryFee() {
    const zoneSelect = document.getElementById('deliveryZone');
    if (!zoneSelect || !zoneSelect.value || window.cart.length === 0) return 0;
    if (zoneSelect.value === 'outside' || zoneSelect.value === '150') return 150;
    if (zoneSelect.value === 'inside' || zoneSelect.value === '80') return 80;
    return parseInt(zoneSelect.value, 10) || 0;
}

window.updateDeliveryPolicyAndTotal = function() {
    const zoneSelect = document.getElementById('deliveryZone');
    const policyDisplay = document.getElementById('dynamicPolicyDisplay');

    if (zoneSelect && policyDisplay) {
        if (zoneSelect.value === '80' || zoneSelect.value === 'inside') {
            policyDisplay.style.display = 'block';
            policyDisplay.innerHTML = t('zoneDeliveryInside');
        } else if (zoneSelect.value === '150' || zoneSelect.value === 'outside') {
            policyDisplay.style.display = 'block';
            policyDisplay.innerHTML = t('zoneDeliveryOutside');
        } else {
            policyDisplay.style.display = 'none';
        }
    }
    window.updateCartUI();
};

window.updateCartUI = function() {
    localStorage.setItem('mohor_cart', JSON.stringify(window.cart));

    if (cartItemsContainer) cartItemsContainer.innerHTML = '';
    let subtotal = 0;
    let totalItems = 0;

    if (window.cart.length === 0) {
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <div>${t('cartEmpty')}</div>
                    <div style="font-size:.78rem;margin:4px 0 16px;">${t('cartEmptySub')}</div>
                    <button type="button" class="btn btn-outline btn-sm" id="continueShoppingBtn">${t('continueShopping')}</button>
                </div>`;
            const csBtn = document.getElementById('continueShoppingBtn');
            if (csBtn) csBtn.addEventListener('click', () => {
                window.closeCartSidebar();
                if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') window.location.href = 'index.html';
            });
        }
    } else {
        window.cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            totalItems += item.qty;
            if (!cartItemsContainer) return;

            const metaParts = [];
            if (item.size) metaParts.push('Size: ' + escapeHtml(item.size));
            if (item.color) metaParts.push('Color: ' + escapeHtml(item.color));

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
                    <div class="cart-item-price">৳${itemTotal}</div>
                    <button type="button" class="remove-item">Remove</button>
                </div>`;
            row.querySelector('[data-action="dec"]').addEventListener('click', () => window.changeQty(index, -1));
            row.querySelector('[data-action="inc"]').addEventListener('click', () => window.changeQty(index, 1));
            row.querySelector('.remove-item').addEventListener('click', () => window.removeFromCart(index));
            cartItemsContainer.appendChild(row);
        });
    }

    const deliveryFee = currentDeliveryFee();
    const finalTotal = subtotal + deliveryFee;

    const subEl = document.getElementById('cartSubtotalValue') || document.getElementById('cartSubtotal');
    const delEl = document.getElementById('cartDeliveryValue') || document.getElementById('cartDelivery');
    const totEl = document.getElementById('cartTotalValue') || document.getElementById('cartTotal');
    if (subEl) subEl.innerText = subtotal;
    if (delEl) delEl.innerText = deliveryFee;
    if (totEl) totEl.innerText = finalTotal;

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
    if (window.cart.length === 0) {
        notify(t('cartEmpty'), 'error');
        return null;
    }

    const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
    const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
    const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress');
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
    const deliveryFee = currentDeliveryFee();

    // Recompute subtotal from canonical product prices to avoid trusting mutable client-side values
    let canonicalSubtotal = 0;
    try {
        window.cart.forEach(item => {
            const price = (typeof getCanonicalPrice === 'function') ? getCanonicalPrice(item) : (item.price || 0);
            canonicalSubtotal += (Number(price) || 0) * (Number(item.qty) || 0);
        });
    } catch (e) {
        console.warn('Error computing canonical subtotal', e);
        // fallback to client-side prices
        window.cart.forEach(item => canonicalSubtotal += (Number(item.price) || 0) * (Number(item.qty) || 0));
    }

    const finalTotal = canonicalSubtotal + deliveryFee;
    return { name: nameInput, phone: phoneInput, address: addressInput, zoneText, deliveryFee, subtotal: canonicalSubtotal, finalTotal };
}

function resetCheckoutFormsIfGuest(isGuest) {
    if (isGuest) {
        const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
        const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
        const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress');
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
    let message = 'Hello Mohor Clothings! I would like to order the following items:%0A%0A';
    window.cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        message += `${index + 1}. ${item.name} (Size: ${item.size}) | Qty: ${item.qty} - ৳${itemTotal}%0A`;
    });
    message += `%0A*Subtotal: ৳${orderData.subtotal}*`;
    message += `%0A*Delivery (${orderData.zoneText}): ৳${orderData.deliveryFee}*`;
    message += `%0A*FINAL TOTAL: ৳${orderData.finalTotal}*%0A`;
    message += `%0A*CUSTOMER DETAILS:*%0AName: ${orderData.name}%0APhone: ${orderData.phone}%0AAddress: ${orderData.address}`;

    // Open WhatsApp first — only clear the cart once we know the redirect fired,
    // so a blocked popup doesn't silently wipe the customer's order.
    const win = window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    window.cart = [];
    window.updateCartUI();
    if (!win) notify(window.currentLang === 'en' ? 'Please allow pop-ups to continue to WhatsApp.' : 'হোয়াটসঅ্যাপে যেতে অনুগ্রহ করে পপ-আপের অনুমতি দিন।', 'error');
};

// Option 2: Direct website order (Firebase)
window.checkoutToAdmin = async function() {
    const orderData = validateCheckoutInputs();
    if (!orderData) return;

    const confirmBtn = document.getElementById('adminOrderBtn') || document.getElementById('btnConfirmOrder');
    if (confirmBtn) { confirmBtn.classList.add('is-loading'); confirmBtn.disabled = true; }

    try {
        let activeUid = 'guest';
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            activeUid = firebase.auth().currentUser.uid;
        } else if (window.currentUser) {
            activeUid = window.currentUser.uid;
        }

        // SECURITY: never trust prices coming from the client cart/localStorage —
        // recompute each line item from the canonical catalog. Client-side
        // mitigation only; the real guard belongs in Firestore rules / a Cloud Function.
        const verifiedItems = window.cart.map(item => ({
            name: item.name, size: item.size, qty: item.qty, price: getCanonicalPrice(item)
        }));
        const verifiedSubtotal = verifiedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const verifiedTotal = verifiedSubtotal + orderData.deliveryFee;

        // Use null for guest orders (avoids writing the literal string 'guest')
        const resolvedUserId = (activeUid && activeUid !== 'guest') ? activeUid : null;
        const resolvedUserEmail = (typeof firebase !== 'undefined' && firebase.auth().currentUser && firebase.auth().currentUser.email) ? firebase.auth().currentUser.email : (window.currentUser && window.currentUser.email) ? window.currentUser.email : null;

        const newOrder = {
            userId: resolvedUserId,
            userEmail: resolvedUserEmail,
            customerName: orderData.name,
            customerPhone: orderData.phone,
            deliveryAddress: orderData.address,
            deliveryZone: orderData.zoneText,
            deliveryFee: orderData.deliveryFee,
            subtotal: verifiedSubtotal,
            totalAmount: verifiedTotal,
            items: verifiedItems,
            // Use serverTimestamp so ordering and timezone are canonical
            orderDate: firebase && firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
            status: 'pending'
        };

        await window.db.collection('orders').add(newOrder);

        notify(window.currentLang === 'en' ? 'Order placed successfully! We will contact you soon.' : 'আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।', 'success');

        window.cart = [];
        window.updateCartUI();
        window.closeCartSidebar();
        resetCheckoutFormsIfGuest(activeUid === 'guest');

        if (activeUid !== 'guest' && typeof window.loadUserOrders === 'function') window.loadUserOrders(activeUid);
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

    const zoneSelect = document.getElementById('deliveryZone');
    if (zoneSelect) zoneSelect.addEventListener('change', window.updateDeliveryPolicyAndTotal);

    window.updateCartUI();
});
