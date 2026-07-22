// --- CUSTOMER LOGIN LOGIC ---
const customerForm = document.getElementById('customer-login-form');
if (customerForm) {
    customerForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevents page reload
        
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;
        
        console.log("Attempting Customer Login with:", email);
        // Next Step: Send this email and password to the database to verify!
    });
}

// --- ADMIN LOGIN LOGIC ---
const adminForm = document.getElementById('admin-login-form');
if (adminForm) {
    adminForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        
        console.log("Attempting Admin Login with:", email);
        // Next Step: Verify admin credentials, then hide the login form and show the dashboard!
    });
}
