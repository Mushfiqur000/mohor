// --- CART, QUANTITY & UI LOGIC ---

// SECURITY: escape any value before it is concatenated into innerHTML.
// Cart item names/sizes ultimately come from productsData, but this keeps
// rendering safe even if that ever changes or gets out of sync.
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// SECURITY: look up the real, current price for a product from the
// canonical product catalog instead of trusting whatever price was cached
// on the cart item (which lives in localStorage and can be edited by
// anyone via devtools before checkout).
function getCanonicalPrice(itemName, fallbackPrice, productId) {
    // Check the live Firestore catalog first (real inventory); only fall
    // back to the small static demo list if nothing has loaded from Firestore.
    const catalog = (Array.isArray(window.firestoreProducts) && window.firestoreProducts.length > 0)
        ? window.firestoreProducts
        : window.productsData;
    if (!Array.isArray(catalog)) return fallbackPrice;

    // Prefer matching by ID — reliable even if two products share a title
    // or a title contains special characters. Fall back to title matching
    // for cart items saved before this fix (no id yet in localStorage).
    let match = null;
    if (productId !== undefined && productId !== null && productId !== '') {
        match = catalog.find(p => String(p.id) === String(productId));
    }
    if (!match) {
        match = catalog.find(p =>
            p.title && (p.title.en === itemName || p.title.bn === itemName || p.title === itemName)
        );
    }
    if (!match) {
        console.warn('Could not verify price for "' + itemName + '" against catalog; using cached price.');
        return fallbackPrice;
    }
    return match.price;
}

// 1. MEMORY FIX: Load cart from storage so it survives page reloads on mobile
window.cart = JSON.parse(localStorage.getItem('mohor_cart')) || [];

const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
// 2. ID FIX: Support both PC container ID and Mobile cart page ID
const cartItemsContainer = document.getElementById('cartItemsContainer') || document.getElementById('cartItems');
const cartBadge = document.getElementById('cartBadge');

// Safely attach sidebar events (in case they don't exist on the mobile page)
const openBtn = document.getElementById('openCartBtn');
if(openBtn) {
    openBtn.addEventListener('click', () => { 
        if(cartSidebar) cartSidebar.classList.add('active'); 
        if(cartOverlay) cartOverlay.classList.add('active'); 
    });
}
const closeCart = () => { 
    if(cartSidebar) cartSidebar.classList.remove('active'); 
    if(cartOverlay) cartOverlay.classList.remove('active'); 
};
const closeBtn = document.getElementById('closeCartBtn');
if(closeBtn) closeBtn.addEventListener('click', closeCart);
if(cartOverlay) cartOverlay.addEventListener('click', closeCart);

// Attached to window so app.js can trigger it from the product modal
window.addToCart = function(name, price, size, productId) {
    let existingItem = window.cart.find(item => item.name === name && item.size === size);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        window.cart.push({ name: name, price: price, size: size, qty: 1, productId: productId });
    }
    
    window.updateCartUI();
    
    if (cartSidebar && cartOverlay) {
        cartSidebar.classList.add('active'); 
        cartOverlay.classList.add('active');
    } else {
        // Fallback alert for mobile if sidebar doesn't exist
        const msg = (window.currentLang === 'en') ? "Added to Cart!" : "কার্টে যোগ করা হয়েছে!";
        alert(msg);
    }
}

window.changeQty = function(index, delta) {
    window.cart[index].qty += delta;
    if (window.cart[index].qty <= 0) {
        window.cart.splice(index, 1);
    }
    window.updateCartUI();
}

window.removeFromCart = function(index) {
    window.cart.splice(index, 1);
    window.updateCartUI();
}

window.updateDeliveryPolicyAndTotal = function() {
    const zoneSelect = document.getElementById('deliveryZone');
    const policyDisplay = document.getElementById('dynamicPolicyDisplay');
    
    if (zoneSelect && policyDisplay) {
        // Supports your original "80"/"150" values and the mobile "inside"/"outside" values
        if (zoneSelect.value === "80" || zoneSelect.value === "inside") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = window.uiTranslations[window.currentLang].policy1Text;
        } else if (zoneSelect.value === "150" || zoneSelect.value === "outside") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = window.uiTranslations[window.currentLang].policy2Text;
        } else {
            policyDisplay.style.display = "none";
        }
    }
    window.updateCartUI(); 
}

window.updateCartUI = function() {
    // 3. MEMORY FIX: Save cart to storage every time UI updates
    localStorage.setItem('mohor_cart', JSON.stringify(window.cart));

    if(cartItemsContainer) cartItemsContainer.innerHTML = ''; 
    let subtotal = 0;
    let totalItems = 0;
    
    if (window.cart.length === 0) {
        if(cartItemsContainer) {
            // Safely check for translation text
            const emptyTxt = (window.uiTranslations && window.uiTranslations[window.currentLang]) ? window.uiTranslations[window.currentLang].cartEmpty : "Your cart is empty";
            cartItemsContainer.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;">${emptyTxt}</p>`;
        }
    } else {
        window.cart.forEach((item, index) => {
            let itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            totalItems += item.qty;
            
            // Added type="button" to the -, +, and Remove buttons to prevent page reloads
            if(cartItemsContainer) {
                cartItemsContainer.innerHTML += `
                    <div class="cart-item" style="align-items: center;">
                        <div class="cart-item-info" style="flex: 1;">
                            <strong style="display: block; margin-bottom: 3px;">${escapeHtml(item.name)}</strong>
                            <span style="font-size: 11px; color: var(--text-light); text-transform: uppercase;">Size: ${escapeHtml(item.size)}</span>
                            
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <button type="button" onclick="changeQty(${index}, -1)" style="border: 1px solid var(--border-color); background: var(--soft-gray); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">-</button>
                                <span style="font-size: 13px; font-weight: 600;">${item.qty}</span>
                                <button type="button" onclick="changeQty(${index}, 1)" style="border: 1px solid var(--border-color); background: var(--soft-gray); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">+</button>
                            </div>
                        </div>
                        
                        <div style="text-align: right;">
                            <div style="font-weight:600; color:var(--primary-gold); margin-bottom: 5px;">৳${itemTotal}</div>
                            <button type="button" class="remove-item" onclick="removeFromCart(${index})" style="font-size: 10px; background:none; border:none; color:red; cursor:pointer;">Remove</button>
                        </div>
                    </div>`;
            }
        });
    }
    
    const zoneSelect = document.getElementById('deliveryZone');
    let deliveryFee = 0;
    if (zoneSelect && zoneSelect.value && window.cart.length > 0) {
        if(zoneSelect.value === "outside" || zoneSelect.value === "150") deliveryFee = 150;
        else if(zoneSelect.value === "inside" || zoneSelect.value === "80") deliveryFee = 80;
        else deliveryFee = parseInt(zoneSelect.value) || 0;
    }
    
    const finalTotal = subtotal + deliveryFee;
    
    // Support both PC and Phone HTML IDs
    const subEl = document.getElementById('cartSubtotalValue') || document.getElementById('cartSubtotal');
    const delEl = document.getElementById('cartDeliveryValue') || document.getElementById('cartDelivery');
    const totEl = document.getElementById('cartTotalValue') || document.getElementById('cartTotal');
    
    if(subEl) subEl.innerText = subtotal;
    if(delEl) delEl.innerText = deliveryFee;
    if(totEl) totEl.innerText = finalTotal;
    
    if(cartBadge) {
        cartBadge.innerText = totalItems;
        cartBadge.classList.remove('bump');
        void cartBadge.offsetWidth; // restart the animation even if it fired a moment ago
        cartBadge.classList.add('bump');
    }
    
    // Legacy Text Counter
    const cartCountNav = document.getElementById('cartCountDisplay');
    if(cartCountNav) cartCountNav.innerText = `Cart (${totalItems})`;

    // ==========================================
    // UPGRADE: PREMIUM SVG CART BADGE UPDATE
    // ==========================================
    const iconBadge = document.getElementById('cartBadgeIcon');
    if(iconBadge) {
        iconBadge.innerText = totalItems;
        // Dynamically hide the gold circle if the cart is empty for a cleaner UI
        iconBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// --- DUAL CHECKOUT LOGIC ---

// Helper function to validate all inputs before sending order anywhere
function validateCheckoutInputs() {
    if (window.cart.length === 0) { 
        alert(window.currentLang === 'en' ? "Your cart is empty." : "আপনার কার্ট খালি।"); 
        return null; 
    }
    
    // Looks for PC input IDs first, falls back to Mobile input IDs
    const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
    const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
    const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress');
    
    const zoneSelect = document.getElementById('deliveryZone');
    const policyElement = document.getElementById('policyAgree');
    
    const nameInput = nameEl ? nameEl.value.trim() : "";
    const phoneInput = phoneEl ? phoneEl.value.trim() : "";
    const addressInput = addressEl ? addressEl.value.trim() : "";
    
    // If the checkbox doesn't exist on the mobile page, default to true so it doesn't block checkout
    const policyAgree = policyElement ? policyElement.checked : true;

    if (!nameInput) { alert(window.currentLang === 'en' ? "Please enter your Full Name." : "অনুগ্রহ করে আপনার পুরো নাম দিন।"); return null; }
    if (!phoneInput) { alert(window.currentLang === 'en' ? "Please enter your Mobile Number." : "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।"); return null; }
    if (!addressInput) { alert(window.currentLang === 'en' ? "Please enter your delivery address." : "অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা দিন।"); return null; }
    if (!zoneSelect || !zoneSelect.value) { alert(window.currentLang === 'en' ? "Please select a Delivery Zone." : "অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন।"); return null; }
    if (policyElement && !policyAgree) { alert(window.currentLang === 'en' ? "Please agree to the Delivery & Return Policy." : "অনুগ্রহ করে ডেলিভারি ও রিটার্ন পলিসিতে সম্মত হোন।"); return null; }

    const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text;
    
    let deliveryFee = 0;
    if(zoneSelect.value === "outside" || zoneSelect.value === "150") deliveryFee = 150;
    else if(zoneSelect.value === "inside" || zoneSelect.value === "80") deliveryFee = 80;
    else deliveryFee = parseInt(zoneSelect.value) || 0;
    
    let subtotal = 0;
    window.cart.forEach(item => subtotal += (item.price * item.qty));

    return {
        name: nameInput,
        phone: phoneInput,
        address: addressInput,
        zoneText: zoneText,
        deliveryFee: deliveryFee,
        subtotal: subtotal,
        finalTotal: subtotal + deliveryFee
    };
}

// Option 1: WhatsApp Order
window.checkoutToWhatsApp = function() {
    const orderData = validateCheckoutInputs();
    if (!orderData) return; 

    const WHATSAPP_NUMBER = "8801330113027"; 
    let message = "Hello Mohor Clothings! I would like to order the following items:%0A%0A";
    
    window.cart.forEach((item, index) => { 
        let itemTotal = item.price * item.qty;
        message += `${index + 1}. ${item.name} (Size: ${item.size}) | Qty: ${item.qty} - ৳${itemTotal}%0A`; 
    });
    
    message += `%0A*Subtotal: ৳${orderData.subtotal}*`;
    message += `%0A*Delivery (${orderData.zoneText}): ৳${orderData.deliveryFee}*`;
    message += `%0A*FINAL TOTAL: ৳${orderData.finalTotal}*%0A`;
    message += `%0A*CUSTOMER DETAILS:*%0AName: ${orderData.name}%0APhone: ${orderData.phone}%0AAddress: ${orderData.address}`;
    
    window.cart = [];
    window.updateCartUI();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

// Option 2: Direct Admin Order (Firebase Integration)
window.checkoutToAdmin = async function() {
    const orderData = validateCheckoutInputs();
    if (!orderData) return; 
    
    // 1. Temporarily disable the button so the user doesn't double-click (Checks PC ID then Mobile ID)
    const confirmBtn = document.getElementById('adminOrderBtn') || document.getElementById('btnConfirmOrder');
    let originalText = confirmBtn ? confirmBtn.innerHTML : "Confirm Order";
    if (confirmBtn) {
        confirmBtn.innerHTML = window.currentLang === 'en' ? "Processing..." : "প্রসেস হচ্ছে...";
        confirmBtn.disabled = true;
    }

    try {
        // UPGRADE: Bulletproof check for logged-in user directly from Firebase Auth
        let activeUid = "guest";
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            activeUid = firebase.auth().currentUser.uid;
        } else if (typeof window.currentUser !== 'undefined' && window.currentUser) {
            activeUid = window.currentUser.uid;
        }

        // SECURITY: never trust prices coming from the client cart/localStorage
        // directly — recompute each line item and the total from the
        // canonical product catalog so a tampered `window.cart.price` in
        // devtools can't be used to place an underpriced order.
        // NOTE: this is a client-side mitigation only. The authoritative fix
        // is to validate/recompute totals in Firestore Security Rules or a
        // Cloud Function, since anyone can still bypass this file entirely
        // and call the Firestore SDK directly from the console.
        const verifiedItems = window.cart.map(item => {
            const verifiedPrice = getCanonicalPrice(item.name, item.price, item.productId);
            return { name: item.name, size: item.size, qty: item.qty, price: verifiedPrice };
        });
        const verifiedSubtotal = verifiedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const verifiedTotal = verifiedSubtotal + orderData.deliveryFee;

        // 2. Package the order data including user tracking
        const newOrder = {
            userId: activeUid,
            customerName: orderData.name,
            customerPhone: orderData.phone,
            deliveryAddress: orderData.address,
            deliveryZone: orderData.zoneText,
            deliveryFee: orderData.deliveryFee,
            subtotal: verifiedSubtotal,
            totalAmount: verifiedTotal,
            items: verifiedItems,
            orderDate: new Date().toISOString(),
            status: "Pending" 
        };

        // 3. Send the data to your Firebase 'orders' collection
        await window.db.collection("orders").add(newOrder);

        // 4. Show success message
        alert(window.currentLang === 'en' ? "Order placed successfully! We will contact you soon." : "আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
        
        // 5. Empty the cart and update the UI
        window.cart = [];
        window.updateCartUI();
        
        // 6. Close the cart sidebar automatically
        if(cartSidebar) cartSidebar.classList.remove('active');
        if(cartOverlay) cartOverlay.classList.remove('active');

        // 7. Clear the input fields (Keep name/address if user is logged in, clear if guest)
        if (activeUid === "guest") {
            const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
            const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
            const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress');
            if(nameEl) nameEl.value = '';
            if(phoneEl) phoneEl.value = '';
            if(addressEl) addressEl.value = '';
        }
        
        if(document.getElementById('deliveryZone')) document.getElementById('deliveryZone').value = '';
        if(document.getElementById('policyAgree')) document.getElementById('policyAgree').checked = false;
        
        const policyDisplay = document.getElementById('dynamicPolicyDisplay');
        if(policyDisplay) policyDisplay.style.display = 'none';

        // 8. Refresh order history if user is logged in (using bulletproof auth check)
        if (activeUid !== "guest" && typeof loadUserOrders === 'function') {
            loadUserOrders(activeUid);
        }

    } catch (error) {
        console.error("Error saving order: ", error);
        alert(window.currentLang === 'en' ? "There was an error placing your order. Please try WhatsApp instead." : "অর্ডার প্লেস করতে সমস্যা হয়েছে। অনুগ্রহ করে হোয়াটসঅ্যাপে চেষ্টা করুন।");
    } finally {
        // 9. Turn the button back on
        if (confirmBtn) {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
}

// Ensure Mobile cart page connects buttons immediately
document.addEventListener('DOMContentLoaded', () => {
    const btnWhatsApp = document.getElementById('btnWhatsAppOrder');
    if (btnWhatsApp) btnWhatsApp.addEventListener('click', window.checkoutToWhatsApp);

    const btnConfirm = document.getElementById('btnConfirmOrder');
    if (btnConfirm) btnConfirm.addEventListener('click', window.checkoutToAdmin);

    // Refresh UI on load
    window.updateCartUI();

    // ==========================================
    // UPGRADE: ROBUST FIREBASE AUTO-FILL LOGIC
    // Embedded here so you don't need to touch cart.html
    // ==========================================
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    firebase.firestore().collection("users").doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            
                            // Find the input fields based on PC or Mobile IDs
                            const nameEl = document.getElementById('custName') || document.getElementById('checkoutName');
                            const phoneEl = document.getElementById('custPhone') || document.getElementById('checkoutPhone');
                            const addressEl = document.getElementById('deliveryAddress') || document.getElementById('checkoutAddress');
                            
                            // Search the database for any possible matching name
                            const userName = userData.name || userData.fullName || userData.displayName || '';
                            const userPhone = userData.phone || userData.phoneNumber || userData.mobile || '';
                            const userAddress = userData.address || userData.deliveryAddress || userData.fullAddress || '';
                            
                            // Only overwrite the input if it's currently empty
                            if(nameEl && !nameEl.value && userName) nameEl.value = userName;
                            if(phoneEl && !phoneEl.value && userPhone) phoneEl.value = userPhone;
                            if(addressEl && !addressEl.value && userAddress) addressEl.value = userAddress;
                        }
                    }).catch(e => console.log("Error fetching user auto-fill data:", e));
                }
            });
        }
    }, 1500); // 1.5-second delay to ensure Firebase finishes loading first
});
