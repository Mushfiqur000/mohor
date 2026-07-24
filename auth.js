// --- AUTHENTICATION & PROFILE LOGIC (Modular Firebase) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyALxypXDkF9QexbD_wE7-ADALIdj5vd-rY",
    authDomain: "mohor-app.firebaseapp.com",
    projectId: "mohor-app",
    storageBucket: "mohor-app.firebasestorage.app",
    messagingSenderId: "989000457004",
    appId: "1:989000457004:web:5679b256e20d94e27daa89"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose globally so cart.js and other files can check who is logged in
window.currentUser = null;

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
onAuthStateChanged(auth, async (user) => {
    window.currentUser = user;
    const authView = document.getElementById('authView');
    const profileView = document.getElementById('profileView');
    
    if (user) {
        if (authView) authView.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
        if (document.getElementById('userProfileEmail')) {
            document.getElementById('userProfileEmailinnerText') || (document.getElementById('userProfileEmail').innerText = user.email);
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { 
            name, 
            email, 
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
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}

// Handle Logout
window.handleLogout = async function() {
    try {
        await signOut(auth);
        alert("Logged out successfully.");
    } catch (error) {
        alert("Logout error: " + error.message);
    }
}

// Save Address Book to Firestore
window.saveUserProfile = async function() {
    if (!window.currentUser) {
        alert("You must be logged in to save an address.");
        return;
    }
    const phoneInput = document.getElementById('profilePhone');
    const addressInput = document.getElementById('profileAddress');

    const phone = phoneInput ? phoneInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";

    try {
        await setDoc(doc(db, "users", window.currentUser.uid), {
            phone, address
        }, { merge: true });
        alert("Address saved successfully!");
    } catch (error) {
        alert("Error saving address: " + error.message);
    }
}

// Load saved user data and auto-fill checkout fields if empty
async function loadUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.phone) {
                if (document.getElementById('profilePhone')) document.getElementById('profilePhone').value = data.phone;
                if (document.getElementById('custPhone') && !document.getElementById('custPhone').value) document.getElementById('custPhone').value = data.phone;
            }
            if (data.address) {
                if (document.getElementById('profileAddress')) document.getElementById('profileAddress').value = data.address;
                if (document.getElementById('deliveryAddress') && !document.getElementById('deliveryAddress').value) document.getElementById('deliveryAddress').value = data.address;
            }
            if (data.name && document.getElementById('custName') && !document.getElementById('custName').value) {
                document.getElementById('custName').value = data.name;
            }
        }
    } catch (e) { console.error("Error loading user profile data:", e); }
}

// Load User Order History inside the Account Drawer
async function loadUserOrders(uid) {
    const container = document.getElementById('userOrderHistoryContainer');
    if (!container) return;

    try {
        const q = query(collection(db, "orders"), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = `<p style="color: var(--text-light); padding: 10px 0;">No order history found.</p>`;
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((documentSnapshot) => {
            const order = documentSnapshot.data();
            const formattedDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "Recent";
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
