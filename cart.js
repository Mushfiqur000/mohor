// --- CART, QUANTITY & UI LOGIC ---
window.cart = [];
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartBadge = document.getElementById('cartBadge');

document.getElementById('openCartBtn').addEventListener('click', () => { cartSidebar.classList.add('active'); cartOverlay.classList.add('active'); });
const closeCart = () => { cartSidebar.classList.remove('active'); cartOverlay.classList.remove('active'); };
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Attached to window so app.js can trigger it from the product modal
window.addToCart = function(name, price, size) {
    let existingItem = window.cart.find(item => item.name === name && item.size === size);
    
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        window.cart.push({ name: name, price: price, size: size, qty: 1 });
    }
    
    window.updateCartUI();
    cartSidebar.classList.add('active'); cartOverlay.classList.add('active');
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
        if (zoneSelect.value === "80") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = window.uiTranslations[window.currentLang].policy1Text;
        } else if (zoneSelect.value === "150") {
            policyDisplay.style.display = "block";
            policyDisplay.innerHTML = window.uiTranslations[window.currentLang].policy2Text;
        } else {
            policyDisplay.style.display = "none";
        }
    }
    window.updateCartUI(); 
}

window.updateCartUI = function() {
    cartItemsContainer.innerHTML = ''; 
    let subtotal = 0;
    let totalItems = 0;
    
    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #666; margin-top: 20px;">${window.uiTranslations[window.currentLang].cartEmpty}</p>`;
    } else {
        window.cart.forEach((item, index) => {
            let itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            totalItems += item.qty;
            
            // FIX: Added type="button" to the -, +, and Remove buttons to prevent page reloads
            cartItemsContainer.innerHTML += `
                <div class="cart-item" style="align-items: center;">
                    <div class="cart-item-info" style="flex: 1;">
                        <strong style="display: block; margin-bottom: 3px;">${item.name}</strong>
                        <span style="font-size: 11px; color: var(--text-light); text-transform: uppercase;">Size: ${item.size}</span>
                        
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <button type="button" onclick="changeQty(${index}, -1)" style="border: 1px solid var(--border-color); background: var(--soft-gray); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">-</button>
                            <span style="font-size: 13px; font-weight: 600;">${item.qty}</span>
                            <button type="button" onclick="changeQty(${index}, 1)" style="border: 1px solid var(--border-color); background: var(--soft-gray); width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">+</button>
                        </div>
                    </div>
                    
                    <div style="text-align: right;">
                        <div style="font-weight:600; color:var(--primary-gold); margin-bottom: 5px;">৳${itemTotal}</div>
                        <button type="button" class="remove-item" onclick="removeFromCart(${index})" style="font-size: 10px;">Remove</button>
                    </div>
                </div>`;
        });
    }
    
    const zoneSelect = document.getElementById('deliveryZone');
    let deliveryFee = 0;
    if (zoneSelect && zoneSelect.value && window.cart.length > 0) {
        deliveryFee = parseInt(zoneSelect.value);
    }
    
    const finalTotal = subtotal + deliveryFee;
    
    if(document.getElementById('cartSubtotalValue')) document.getElementById('cartSubtotalValue').innerText = subtotal;
    if(document.getElementById('cartDeliveryValue')) document.getElementById('cartDeliveryValue').innerText = deliveryFee;
    if(document.getElementById('cartTotalValue')) document.getElementById('cartTotalValue').innerText = finalTotal;
    
    if(cartBadge) cartBadge.innerText = totalItems;
}

// --- DUAL CHECKOUT LOGIC ---

// Helper function to validate all inputs before sending order anywhere
function validateCheckoutInputs() {
    if (window.cart.length === 0) { 
        alert(window.currentLang === 'en' ? "Your cart is empty." : "আপনার কার্ট খালি।"); 
        return null; 
    }
    
    const nameInput = document.getElementById('custName') ? document.getElementById('custName').value.trim() : "";
    const phoneInput = document.getElementById('custPhone') ? document.getElementById('custPhone').value.trim() : "";
    const addressElement = document.getElementById('deliveryAddress');
    const zoneSelect = document.getElementById('deliveryZone');
    const policyElement = document.getElementById('policyAgree');
    
    const addressInput = addressElement ? addressElement.value.trim() : "";
    const policyAgree = policyElement ? policyElement.checked : false;

    if (!nameInput) { alert(window.currentLang === 'en' ? "Please enter your Full Name." : "অনুগ্রহ করে আপনার পুরো নাম দিন।"); return null; }
    if (!phoneInput) { alert(window.currentLang === 'en' ? "Please enter your Mobile Number." : "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।"); return null; }
    if (!addressInput) { alert(window.currentLang === 'en' ? "Please enter your delivery address." : "অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা দিন।"); return null; }
    if (!zoneSelect || !zoneSelect.value) { alert(window.currentLang === 'en' ? "Please select a Delivery Zone." : "অনুগ্রহ করে ডেলিভারি জোন নির্বাচন করুন।"); return null; }
    if (!policyAgree) { alert(window.currentLang === 'en' ? "Please agree to the Delivery & Return Policy." : "অনুগ্রহ করে ডেলিভারি ও রিটার্ন পলিসিতে সম্মত হোন।"); return null; }

    const zoneText = zoneSelect.options[zoneSelect.selectedIndex].text;
    const deliveryFee = parseInt(zoneSelect.value);
    
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
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

// Option 2: Direct Admin Order (Firebase Integration)
window.checkoutToAdmin = async function() {
    const orderData = validateCheckoutInputs();
    if (!orderData) return; 
    
    // 1. Temporarily disable the button so the user doesn't double-click
    const confirmBtn = document.getElementById('adminOrderBtn');
    let originalText = confirmBtn ? confirmBtn.innerHTML : "Confirm Order";
    if (confirmBtn) {
        confirmBtn.innerHTML = window.currentLang === 'en' ? "Processing..." : "প্রসেস হচ্ছে...";
        confirmBtn.disabled = true;
    }

    try {
        // 2. Package the order data including user tracking
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

        // 3. Send the data to your Firebase 'orders' collection
        await window.db.collection("orders").add(newOrder);

        // 4. Show success message
        alert(window.currentLang === 'en' ? "Order placed successfully! We will contact you soon." : "আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
        
        // 5. Empty the cart and update the UI
        window.cart = [];
        window.updateCartUI();
        
        // 6. Close the cart sidebar automatically
        document.getElementById('cartSidebar').classList.remove('active');
        document.getElementById('cartOverlay').classList.remove('active');

        // 7. Clear the input fields for the next customer
        if(document.getElementById('custName')) document.getElementById('custName').value = '';
        if(document.getElementById('custPhone')) document.getElementById('custPhone').value = '';
        if(document.getElementById('deliveryAddress')) document.getElementById('deliveryAddress').value = '';
        if(document.getElementById('deliveryZone')) document.getElementById('deliveryZone').value = '';
        if(document.getElementById('policyAgree')) document.getElementById('policyAgree').checked = false;

        // 8. Refresh order history if user is logged in
        if (typeof window.currentUser !== 'undefined' && window.currentUser && typeof loadUserOrders === 'function') {
            loadUserOrders(window.currentUser.uid);
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
