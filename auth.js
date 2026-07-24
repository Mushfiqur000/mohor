// --- AUTHENTICATION & PROFILE LOGIC (Firebase Compat) ---

// Expose globally so cart.js and other files can check who is logged in
window.currentUser = null;

// Use the database and auth already initialized in index.html!
const db = window.db;
const auth = firebase.auth();

// Modal Elements Setup
const accountOverlay = document.getElementById('accountOverlay');
const accountSidebar = document.getElementById('accountSidebar');
const openAccountBtn = document.getElementById('openAccountBtn');
const closeAccountBtn = document.getElementById('closeAccountBtn');

if (openAccountBtn) {
    openAccountBtn.addEventListener('click', () => {
        if (accountSidebar) accountSidebar.classList.add('active');
        if (accountOverlay) accountOverlay.classList.add('active');
    });
}

const closeAccountModal = () => {
    if (accountSidebar) accountSidebar.classList.remove('active');
    if (accountOverlay) accountOverlay.classList.remove('active');
};

if (closeAccountBtn) closeAccountBtn.addEventListener('click', closeAccountModal);
if (accountOverlay) accountOverlay.addEventListener('click', closeAccountModal);

// Toggle between Login and Signup view inside the Account Modal
window.toggleAuthMode = function() {
    const loginCont = document.getElementById('loginFormContainer');
    const signupCont = document.getElementById('signupFormContainer');
    if (loginCont && signupCont) {
        if (loginCont.style.display === 'none') {
            loginCont.style.display = 'block';
            signupCont.style.display = 'none';
        } else {
            loginCont.style.display = 'none';
            signupCont.style.display = 'block';
        }
    }
}

// Monitor Auth State Changes
auth.onAuthStateChanged(async (user) => {
    window.currentUser = user;
    const authView = document.getElementById('authView');
    const profileView = document.getElementById('profileView');
    
    if (user) {
        if (authView) authView.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        
        const emailDisplay = document.getElementById('userProfileEmail');
        if (emailDisplay) {
            emailDisplay.innerText = user.email;
        }
        
        await loadUserData(user.uid);
        await loadUserOrders(user.uid);
    } else {
        if (authView) authView.style.display = 'block';
        if (profileView) profileView.style.display = 'none';
    }
});

// Handle Customer Signup via Account Modal
window.handleSignup = async function() {
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passInput = document.getElementById('signupPassword');

    const name = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    if (!email || !password) { alert("Please enter email and password."); return; }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // NEW: Save name to Firebase Auth Profile explicitly
        if (name) {
            await userCredential.user.updateProfile({
                displayName: name
            });
        }

        // Save user info to Firestore database
        await db.collection("users").doc(userCredential.user.uid).set({ 
            name: name, 
            customerName: name, // Save under both keys just to be safe
            email: email, 
            createdAt: new Date().toISOString() 
        });
        
        alert("Account created successfully!");
    } catch (error) {
        alert("Signup failed: " + error.message);
    }
}

// Handle Customer Login via Account Modal
window.handleLogin = async function() {
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    if (!email || !password) { alert("Please enter email and password."); return; }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("Logged in successfully!");
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}

// Handle Logout
window.handleLogout = async function() {
    try {
        await auth.signOut();
        alert("Logged out successfully.");
    } catch (error) {
        alert("Logout error: " + error.message);
    }
}

// Save Address Book to Firestore
window.saveUserProfile = async function() {
    if (!window.currentUser) {
        alert("You must be logged in to save a profile.");
        return;
    }
    
    // NEW: Grab the name directly from the new profile input box in index.html
    const nameInput = document.getElementById('profileName');
    const phoneInput = document.getElementById('profilePhone');
    const addressInput = document.getElementById('profileAddress');

    const nameToSave = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";

    try {
        let updatePayload = {
            phone: phone, 
            address: address
        };
        
        if (nameToSave) {
            updatePayload.name = nameToSave;
            updatePayload.customerName = nameToSave;
        }

        await db.collection("users").doc(window.currentUser.uid).set(updatePayload, { merge: true }); 
        
        alert("Profile saved successfully!");
    } catch (error) {
        alert("Error saving profile: " + error.message);
    }
}

// Load saved user data and auto-fill checkout fields if empty
async function loadUserData(uid) {
    try {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            let savedName = data.customerName || data.name || data.fullName || (window.currentUser ? window.currentUser.displayName : "") || "";
            
            // 1. Fill Profile Tab Displays (Now includes Name!)
            if (savedName && document.getElementById('profileName')) document.getElementById('profileName').value = savedName;
            if (data.phone && document.getElementById('profilePhone')) document.getElementById('profilePhone').value = data.phone;
            if (data.address && document.getElementById('profileAddress')) document.getElementById('profileAddress').value = data.address;
            
            // 2. Auto-fill Cart Checkout inputs
            if (savedName && document.getElementById('custName')) {
                document.getElementById('custName').value = savedName;
            }
            if (data.phone && document.getElementById('custPhone')) {
                document.getElementById('custPhone').value = data.phone || data.customerPhone || "";
            }
            if (data.address && document.getElementById('deliveryAddress')) {
                document.getElementById('deliveryAddress').value = data.address || data.deliveryAddress || "";
            }
        }
    } catch (e) { console.error("Error loading user profile data:", e); }
}

// Load User Order History inside the Account Drawer
async function loadUserOrders(uid) {
    const container = document.getElementById('userOrderHistoryContainer');
    if (!container) return;

    try {
        // Query the database for orders matching this user's ID
        const querySnapshot = await db.collection("orders").where("userId", "==", uid).get();
        
        if (querySnapshot.empty) {
            container.innerHTML = `<p style="color: var(--text-light); padding: 10px 0;">No order history found.</p>`;
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((documentSnapshot) => {
            const order = documentSnapshot.data();
            const formattedDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "Recent";
            
            // Add order visual card to the drawer
            container.innerHTML += `
                <div style="border: 1px solid var(--border-color); padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <strong>Total: ৳${order.totalAmount}</strong> <span style="float: right; color: var(--primary-gold);">${order.status || 'New'}</span>
                    <p style="color: var(--text-light); font-size: 11px; margin-top: 3px;">Date: ${formattedDate}</p>
                </div>`;
        });
    } catch (e) {
        console.error("Error loading order history:", e);
        container.innerHTML = `<p style="color: red; font-size: 11px;">Could not load past orders.</p>`;
    }
}
