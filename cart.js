// --- CART, QUANTITY & UI LOGIC ---

// FIX 1: LocalStorage added so cart doesn't empty on page reload
window.cart = JSON.parse(localStorage.getItem('mohor_cart')) || [];

const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsContainer = document.getElementById('cartItems'); // Updated to match cart.html ID
const cartBadge = document.getElementById('cartBadge');

if (document.getElementById('openCartBtn')) {
    document.getElementById('openCartBtn').addEventListener('click', () => { 
        if(cartSidebar) cartSidebar.classList.add('active'); 
        if(cartOverlay) cartOverlay.classList.add('active'); 
    });
}
const closeCart = () => { 
    if(cartSidebar) cartSidebar.classList.remove('active'); 
    if(cartOverlay) cartOverlay.classList.remove('active'); 
};
if (document.getElementById('closeCartBtn')) document.getElementById('closeCartBtn').addEventListener('click', closeCart);
if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

// Attached to window so app.js can trigger it from the product modal
window.addToCart = function(name, price, size) {
    let existingItem = window.cart.find(item => item.name === name && item.size === size);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        window.cart.push({ name: name, price: price, size: size, qty: 1 });
    }
    
    window.updateCartUI();
    if(cartSidebar && cartOverlay) {
        cartSidebar.classList.add('active'); cartOverlay.classList.add('active');
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

// RESTORED: Your original Delivery Policy display logic
window.updateDeliveryPolicyAndTotal = function() {
    const zoneSelect = document.getElementById('deliveryZone');
    const policyDisplay = document.getElementById('dynamicPolicyDisplay');
    
    if (zoneSelect && policyDisplay) {
        // Updated to match the "inside" and "outside" values in your cart.html
        if (zoneSelect.value === "inside") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = window.uiTranslations ? window.uiTranslations[window.currentLang].policy1Text : "Inside Sylhet Delivery Policy";
        } else if (zoneSelect.value === "outside") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = window.uiTranslations ? window.uiTranslations[window.currentLang].policy2Text : "Outside Sylhet Delivery Policy";
        } else {
            policyDisplay.style.display = "none";
        }
    }
    window.updateCartUI(); 
}

window.updateCartUI = function() {
    // Save to memory every time cart updates
    localStorage.setItem('mohor_cart', JSON.stringify(window.cart));

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = ''; 
    }
    
    let subtotal = 0;
    let totalItems = 0;
    
    if (window.cart.length === 0 && cartItemsContainer) {
        // RESTORED: Your translation logic for empty cart
        const emptyMsg = window.uiTranslations ? window.uiTranslations[window.currentLang].cartEmpty : "Your cart is empty.";
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;">${emptyMsg}</p>`;
    } else {
        window.cart.forEach((item, index) => {
            let itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            totalItems += item.qty;
            
            if (cartItemsContainer) {
                cartItemsContainer.innerHTML += `
                    <div class="cart-item" style="align-items: center;">
                        <div class="cart-item-info" style="flex: 1;">
                            <strong style="display: block; margin-bottom: 3px;">${item.name}</strong>
                            <span style="font-size: 11px; color: var(--text-light, #666); text-transform: uppercase;">Size: ${item.size}</span>
                            
                            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                                <button type="button" onclick="changeQty(${index}, -1)" style="border: 1px solid var(--border-color, #eaeaea); background: var(--soft-gray, #f9f9f9); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">-</button>
                                <span style="font-size: 13px; font-weight: 600;">${item.qty}</span>
                                <button type="button" onclick="changeQty(${index}, 1)" style="border: 1px solid var(--border-color, #eaeaea); background: var(--soft-gray, #f9f9f9); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">+</button>
                            </div>
                        </div>
                        
                        <div style="text-align: right;">
                            <div style="font-weight:600; color:var(--primary-gold, #C9A14A); margin-bottom: 5px;">৳${itemTotal}</div>
                            <button type="button" class="remove-item" onclick="removeFromCart(${index})" style="font-size: 10px; background: none; border: none; color: #d9534f; cursor: pointer; text-transform: uppercase;">Remove</button>
                        </div>
                    </div>`;
            }
        });
    }
    
    const zoneSelect = document.getElementById('deliveryZone');
    let deliveryFee = 0;
    if (zoneSelect && zoneSelect.value && window.cart.length > 0) {
        // Calculates fee based on HTML select values
        deliveryFee = (zoneSelect.value === 'outside') ? 150 : 80;
    }
    
    const finalTotal = subtotal + deliveryFee;
    
    // Updated IDs to match cart.html
    if(document.getElementById('cartSubtotal')) document.getElementById('cartSubtotal').innerText = '৳' + subtotal;
    if(document.getElementById('cartDelivery')) document.getElementById('cartDelivery').innerText = '৳' + deliveryFee;
    if(document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = '৳' + finalTotal;
    
    if(cartBadge) cartBadge.innerText = totalItems;
    if(document.getElementById('cartCountDisplay')) document.getElementById('cartCountDisplay').innerText = `Cart (${totalItems})`;
}

// --- DUAL CHECKOUT LOGIC ---

// Helper function to validate all inputs
function validateCheckoutInputs() {
    if (window.cart.length === 0) { 
        alert(window.currentLang === 'en' ? "Your cart is empty." : "আপনার কার্ট খালি।"); 
        return null; 
    }
    
    // FIX 2: Updated IDs to match your cart.html file exactly
    const nameInput = document.getElementById('checkoutName') ? document.getElementById('checkoutName').value.trim() : "";
    const phoneInput = document.getElementById('checkoutPhone') ? document.getElementById('checkoutPhone').value.trim() : "";
    const addressElement = document.getElementById('checkoutAddress');
    const zoneSelect = document.getElementById('deliveryZone');
    const policyElement = document.getElementById('policyAgree');
    
    const addressInput = addressElement ? addressElement.value.trim() : "";
    const policyAgree = policyElement ? policyElement.checked : true; // Defaults to true if checkbox isn't in HTML

    if (!nameInput) { alert(window.currentLang === 'en' ? "Please enter your Full Name." : "অনুগ্রহ করে আপনার পুরো নাম দিন।"); return null; }
    if (!phoneInput) { alert(window.currentLang === 'en' ? "Please enter your Mobile Number." : "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।"); return null; }
    if (!addressInput) { alert(window.currentLang === 'en' ? "Please enter your delivery address." : "অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা দিন।"); return null; }
    if (!zoneSelect || !zoneSelect.value) { alert(window.currentLang === 'en' ? "Please select a Delivery Zone." : "অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন।"); return null; }
    if (policyElement && !policyAgree) { alert(window.currentLang === 'en' ? "Please agree to the Delivery & Return Policy." : "অনুগ্রহ করে ডেলিভারি ও রিটার্ন পলিসিতে সম্মত হোন।"); return null; }

    const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text;
    const deliveryFee = (zoneSelect.value === 'outside') ? 150 : 80;
    
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
    
    const confirmBtn = document.getElementById('btnConfirmOrder');
    let originalText = confirmBtn ? confirmBtn.innerHTML : "Confirm Order";
    if (confirmBtn) {
        confirmBtn.innerHTML = window.currentLang === 'en' ? "Processing..." : "প্রসেস হচ্ছে...";
        confirmBtn.disabled = true;
    }

    try {
        const newOrder = {
            userId: (typeof window.currentUser !== 'undefined' && window.currentUser) ? window.currentUser.uid : "guest",
            customerName: orderData.name,
            customerPhone: orderData.phone,
            deliveryAddress: orderData.address,
            deliveryZone: orderData.zoneText,
            deliveryFee: orderData.deliveryFee,
            subtotal: orderData.subtotal,
            totalAmount: orderData.finalTotal,
            items: window.cart,
            orderDate: new Date().toISOString(),
            status: "New" 
        };

        await window.db.collection("orders").add(newOrder);

        alert(window.currentLang === 'en' ? "Order placed successfully! We will contact you soon." : "আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
        
        window.cart = [];
        window.updateCartUI();
        
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');

        if (typeof window.currentUser === 'undefined' || !window.currentUser) {
            if(document.getElementById('checkoutName')) document.getElementById('checkoutName').value = '';
            if(document.getElementById('checkoutPhone')) document.getElementById('checkoutPhone').value = '';
            if(document.getElementById('checkoutAddress')) document.getElementById('checkoutAddress').value = '';
        }
        
        if(document.getElementById('deliveryZone')) document.getElementById('deliveryZone').value = '';
        if(document.getElementById('policyAgree')) document.getElementById('policyAgree').checked = false;
        
        const policyDisplay = document.getElementById('dynamicPolicyDisplay');
        if(policyDisplay) policyDisplay.style.display = 'none';

        // RESTORED: Your user history reload logic
        if (typeof window.currentUser !== 'undefined' && window.currentUser && typeof loadUserOrders === 'function') {
            loadUserOrders(window.currentUser.uid);
        }

    } catch (error) {
        console.error("Error saving order: ", error);
        alert(window.currentLang === 'en' ? "There was an error placing your order. Please try WhatsApp instead." : "অর্ডার প্লেস করতে সমস্যা হয়েছে। অনুগ্রহ করে হোয়াটসঅ্যাপে চেষ্টা করুন।");
    } finally {
        if (confirmBtn) {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
}

// Auto-bind checkout buttons if on cart.html
document.addEventListener('DOMContentLoaded', () => {
    const btnWhatsApp = document.getElementById('btnWhatsAppOrder');
    if (btnWhatsApp) btnWhatsApp.onclick = window.checkoutToWhatsApp;

    const btnConfirm = document.getElementById('btnConfirmOrder');
    if (btnConfirm) btnConfirm.onclick = window.checkoutToAdmin;

    window.updateCartUI();
});
