// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAb19slq1ayFiUuIFLSsTwXUgL7uaifOic",
    authDomain: "task-management-system-6e81a.firebaseapp.com",
    projectId: "task-management-system-6e81a",
    storageBucket: "task-management-system-6e81a.firebasestorage.app",
    messagingSenderId: "447950223696",
    appId: "1:447950223696:web:a0103cde7b6b7dd233d455",
    measurementId: "G-W9JVP73M5Z"
};

// Initialize Firebase when SDK is loaded
function initializeFirebase() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        const app = firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
        
        // Make services globally available
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        
        // Enable offline persistence
        db.enablePersistence()
            .catch((err) => {
                console.log('Firebase persistence error:', err.code);
            });
        
        // Dispatch event that Firebase is ready
        const event = new Event('firebase-ready');
        document.dispatchEvent(event);
        
        // Check auth state
        checkAuthState();
    } else if (firebase.apps.length > 0) {
        console.log('Firebase already initialized');
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        
        const event = new Event('firebase-ready');
        document.dispatchEvent(event);
    }
}

// Check authentication state
// SIMPLEST FIX - Update checkAuthState function
function checkAuthState() {
    if (!window.auth) return;
    
    auth.onAuthStateChanged((user) => {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('login.html');
        
        if (user) {
            // User is logged in
            console.log('User logged in:', user.email);
            
            // Only redirect if NOT on login page
            // This allows registration flow to complete without interruption
            if (!isLoginPage) {
                // We're on some other page and logged in, that's fine
            }
        } else {
            // User is not logged in
            console.log('User not logged in');
            
            // If NOT on login page, redirect to login
            if (!isLoginPage) {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 100);
            }
        }
    });
}

// Wait for Firebase SDK to load
if (typeof firebase !== 'undefined') {
    initializeFirebase();
} else {
    // If Firebase SDK not loaded yet, wait for it
    document.addEventListener('firebase-ready', initializeFirebase);
}

// Make initializeFirebase available globally
window.initializeFirebase = initializeFirebase;