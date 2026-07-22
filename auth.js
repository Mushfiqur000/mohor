// Import the functions you need directly from Google's browser servers
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
