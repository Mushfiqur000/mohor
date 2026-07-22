// Import the functions you need directly from Google's browser servers
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your web app's Firebase configuration keys
const firebaseConfig = {
  apiKey: "AIzaSyALxypXDkF9QexbD_wE7-ADALIdj5vd-rY",
  authDomain: "mohor-app.firebaseapp.com",
  projectId: "mohor-app",
  storageBucket: "mohor-app.firebasestorage.app",
  messagingSenderId: "989000457004",
  appId: "1:989000457004:web:5679b256e20d94e27daa89"
};

// Initialize Firebase and Authentication
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// LOGIN FUNCTIONALITY
const loginForm = document.getElementById('customer-login-form');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevents the page from refreshing immediately

        // Get the email and password the user typed in
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;

        // Ask Firebase to verify the credentials
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Success! Redirect to the admin page
                window.location.href = "admin.html";
            })
            .catch((error) => {
                // Failure! Show an error message
                alert("Login failed: " + error.message);
            });
    });
}
