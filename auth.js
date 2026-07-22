import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const loginForm = document.getElementById('customer-login-form');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                window.location.href = "admin.html";
            })
            .catch((error) => {
                alert("Login failed: " + error.message);
            });
    });
}
