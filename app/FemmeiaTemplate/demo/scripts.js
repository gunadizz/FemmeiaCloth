    // Firebase imports
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
    import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
    import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-storage.js";

    // Firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyAxMT-bM6FEPrD-o3I2G-VHdZP7hxhj0uo",
        authDomain: "femmeiacloth-finance.firebaseapp.com",
        projectId: "femmeiacloth-finance",
        storageBucket: "femmeiacloth-finance.appspot.com",
        messagingSenderId: "517478386163",
        appId: "1:517478386163:web:51028f5841baa311126a86",
        measurementId: "G-K4L516Q54R"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    // Products data
    const products = [
        {
            id: 1,
            name: "Inner Earab",
            price: 25000,
            category: "inner",
            image: "https://www.femmeiacloth.me/app/store/assets/ciputall.jpg",
            colors: ["Hitam", "Putih", "Cream", "Mocha", "Abu-abu"],
            colorCodes: {
                "Hitam": "#000000",
                "Putih": "#FFFFFF",
                "Cream": "#FFFDD0",
                "Mocha": "#A38068",
                "Abu-abu": "#808080"
            },
            description: "Inner Earab premium, adem, nyaman dipakai seharian."
        },
        {
            id: 2,
            name: "Pashmina",
            price: 55000,
            category: "pashmina",
            image: "https://www.femmeiacloth.me/app/store/assets/IMG-20250512-WA0017.jpg",
            colors: ["Hitam", "Coklat", "Beige", "Mauve", "Lilac", "Hijau", "Olive"],
            colorCodes: {
                "Hitam": "#000000",
                "Coklat": "#964B00",
                "Beige": "#F5F5DC",
                "Mauve": "#E0B0FF",
                "Lilac": "#C8A2C8",
                "Hijau": "#00FF00",
                "Olive": "#808000"
            },
            description: "Pashmina bahan kaos premium, nyaman dipakai."
        },
        {
            id: 3,
            name: "Paris Jadul",
            price: 35000,
            category: "hijab",
            image: "https://www.femmeiacloth.me/app/store/assets/all.jpg",
            colors: ["Hitam", "Putih", "Abu-abu", "Navy", "Pink", "Cream"],
            colorCodes: {
                "Hitam": "#000000",
                "Putih": "#FFFFFF",
                "Abu-abu": "#808080",
                "Navy": "#000080",
                "Pink": "#FFC0CB",
                "Cream": "#FFFDD0"
            },
            description: "Hijab ringan, mudah dibentuk, cocok untuk sehari-hari."
        }
    ];

    // Global state
    let currentUser = null;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentFilter = 'all';
    let selectedProduct = null;
    let selectedColor = null;
    let appliedPromo = null;
    let userProfile = null;
    let unverifiedUser = null;

    // Make functions globally available
    window.toggleProfileMenu = toggleProfileMenu;
    window.showLogin = showLogin;
    window.showRegister = showRegister;
    window.showForgotPassword = showForgotPassword;
    window.login = login;
    window.register = register;
    window.resetPassword = resetPassword;
    window.resendVerification = resendVerification;
    window.logout = logout;
    window.showSection = showSection;
    window.filterProducts = filterProducts;
    window.showProductDetail = showProductDetail;
    window.closeProductModal = closeProductModal;
    window.selectColor = selectColor;
    window.addToCart = addToCart;
    window.updateQuantity = updateQuantity;
    window.removeFromCart = removeFromCart;
    window.uploadProfilePhoto = uploadProfilePhoto;
    window.updateProfile = updateProfile;
    window.updateContactInfo = updateContactInfo;
    window.changePassword = changePassword;
    window.copyPromoCode = copyPromoCode;
    window.applyPromoCode = applyPromoCode;

    // Format price with thousand separator
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Initialize app
    document.addEventListener('DOMContentLoaded', function() {
        loadProducts();
        updateCartBadge();
        updateStickyCheckout();
        updateMobileNavActive();
        
        // Add scroll effect to navbar
        window.addEventListener('scroll', function() {
            const navbar = document.getElementById('navbar');
            if (navbar && window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else if (navbar) {
                navbar.classList.remove('scrolled');
            }
        });
    });

    // Enhanced Auth state management
    onAuthStateChanged(auth, async (user) => {
        if (user && user.emailVerified) {
            currentUser = user;
            unverifiedUser = null;
            hideVerificationNotice();
            showMainApp();
            updateNavLinks();
            updateMobileNavLinks();
            await loadProfile();
        } else if (user && !user.emailVerified) {
            unverifiedUser = user;
            currentUser = null;
            showVerificationNotice();
            showAuthSection();
            updateNavLinks();
            updateMobileNavLinks();
        } else {
            currentUser = null;
            unverifiedUser = null;
            hideVerificationNotice();
            showAuthSection();
            updateNavLinks();
            updateMobileNavLinks();
        }
    });

    function showVerificationNotice() {
        document.getElementById('verificationNotice').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'none';
    }

    function hideVerificationNotice() {
        document.getElementById('verificationNotice').style.display = 'none';
    }

    function showAuthSection() {
        document.getElementById('authSection').classList.add('active');
        document.querySelectorAll('.page-section:not(#authSection)').forEach(section => {
            section.classList.remove('active');
        });
        updateMobileNavActive();
    }

    function showMainApp() {
        document.getElementById('authSection').classList.remove('active');
        if (!document.querySelector('.page-section.active:not(#authSection)')) {
            showSection('home');
        }
    }

    // Mobile Profile Menu Toggle
    function toggleProfileMenu() {
        if (currentUser) {
            showSection('profile');
        } else {
            showSection('auth');
            showNotification('Silakan masuk terlebih dahulu', true);
        }
    }

    // Authentication functions
    function showLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('verificationNotice').style.display = 'none';
        clearAuthErrors();
    }

    function showRegister() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('forgotPasswordForm').style.display = 'none';
        document.getElementById('verificationNotice').style.display = 'none';
        clearAuthErrors();
    }

    function showForgotPassword() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('forgotPasswordForm').style.display = 'block';
        document.getElementById('verificationNotice').style.display = 'none';
        clearAuthErrors();
    }

    function clearAuthErrors() {
        document.querySelectorAll('.error').forEach(error => error.textContent = '');
        document.querySelectorAll('.success').forEach(success => success.textContent = '');
    }

    function showAuthError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) errorElement.textContent = message;
    }

    function showAuthSuccess(fieldId, message) {
        const successElement = document.getElementById(fieldId + 'Success');
        if (successElement) successElement.textContent = message;
    }

    async function login(event) {
        event.preventDefault();
        clearAuthErrors();

        const emailOrUsername = document.getElementById('loginEmailOrUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!emailOrUsername || !password) {
            showAuthError('loginEmail', 'Email/username dan password wajib diisi');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        
        loginBtn.disabled = true;
        loginBtnText.innerHTML = '<div class="loading"></div>Memproses...';

        try {
            let email = emailOrUsername;
            
            // If input doesn't contain @, treat as username and find email
            if (!emailOrUsername.includes('@')) {
                const q = query(collection(db, 'users'), where('username', '==', emailOrUsername));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    showAuthError('loginEmail', 'Username tidak ditemukan');
                    return;
                }
                
                email = querySnapshot.docs[0].data().email;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            if (!userCredential.user.emailVerified) {
                showNotification('Email belum diverifikasi. Silakan periksa email Anda.', true);
                return;
            }

            showNotification('Berhasil masuk! Selamat datang kembali.');
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
            let errorField = 'loginEmail';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Password salah. Silakan periksa kembali password Anda.';
                    errorField = 'loginPassword';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Format email tidak valid.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.';
                    break;
            }
            
            showAuthError(errorField, errorMessage);
        } finally {
            loginBtn.disabled = false;
            loginBtnText.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v18l-7-3-7 3V3h6"/>
                    <path d="M9 6h6"/>
                    <path d="M9 10h6"/>
                </svg>
                Masuk
            `;
        }
    }

    async function register(event) {
        event.preventDefault();
        clearAuthErrors();

        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        // Validation
        if (!username) {
            showAuthError('registerUsername', 'Nama pengguna wajib diisi');
            return;
        }

        if (username.length < 3) {
            showAuthError('registerUsername', 'Nama pengguna minimal 3 karakter');
            return;
        }

        if (!email) {
            showAuthError('registerEmail', 'Email wajib diisi');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAuthError('registerEmail', 'Format email tidak valid');
            return;
        }

        if (!password) {
            showAuthError('registerPassword', 'Password wajib diisi');
            return;
        }

        if (password.length < 6) {
            showAuthError('registerPassword', 'Password minimal 6 karakter');
            return;
        }

        const registerBtn = document.getElementById('registerBtn');
        const registerBtnText = document.getElementById('registerBtnText');
        
        registerBtn.disabled = true;
        registerBtnText.innerHTML = '<div class="loading"></div>Memproses...';

        try {
            // Check if username already exists
            const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
            const usernameSnapshot = await getDocs(usernameQuery);
            
            if (!usernameSnapshot.empty) {
                showAuthError('registerUsername', 'Nama pengguna sudah digunakan');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Save user profile to Firestore
            await addDoc(collection(db, 'users'), {
                uid: userCredential.user.uid,
                username: username,
                email: email,
                phone: '',
                address: '',
                createdAt: new Date()
            });

            // Send email verification
            await sendEmailVerification(userCredential.user);
            
            showNotification('Akun berhasil dibuat! Silakan periksa email untuk verifikasi.');
            
        } catch (error) {
            console.error('Register error:', error);
            
            let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
            let errorField = 'registerEmail';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password terlalu lemah. Gunakan minimal 6 karakter.';
                    errorField = 'registerPassword';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Format email tidak valid.';
                    break;
            }
            
            showAuthError(errorField, errorMessage);
        } finally {
            registerBtn.disabled = false;
            registerBtnText.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Daftar
            `;
        }
    }

    async function resetPassword(event) {
        event.preventDefault();
        clearAuthErrors();

        const email = document.getElementById('resetEmail').value.trim();

        if (!email) {
            showAuthError('resetEmail', 'Email wajib diisi');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAuthError('resetEmail', 'Format email tidak valid');
            return;
        }

        const resetBtn = document.getElementById('resetBtn');
        const resetBtnText = document.getElementById('resetBtnText');
        
        resetBtn.disabled = true;
        resetBtnText.innerHTML = '<div class="loading"></div>Mengirim...';

        try {
            await sendPasswordResetEmail(auth, email);
            showAuthSuccess('resetEmail', 'Link reset password telah dikirim ke email Anda');
            
            setTimeout(() => {
                showLogin();
            }, 3000);
        } catch (error) {
            console.error('Reset password error:', error);
            
            let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Email tidak terdaftar';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Format email tidak valid';
                    break;
            }
            
            showAuthError('resetEmail', errorMessage);
        } finally {
            resetBtn.disabled = false;
            resetBtnText.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                Kirim Link Reset
            `;
        }
    }

    async function resendVerification() {
        if (!unverifiedUser) {
            showNotification('Tidak ada pengguna yang perlu diverifikasi', true);
            return;
        }

        const resendBtn = document.getElementById('resendBtn');
        const resendBtnText = document.getElementById('resendBtnText');
        
        resendBtn.disabled = true;
        resendBtnText.innerHTML = '<div class="loading"></div>Mengirim...';

        try {
            await sendEmailVerification(unverifiedUser);
            showNotification('Email verifikasi telah dikirim ulang!');
        } catch (error) {
            console.error('Resend verification error:', error);
            showNotification('Gagal mengirim email verifikasi', true);
        } finally {
            resendBtn.disabled = false;
            resendBtnText.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                </svg>
                Kirim Ulang Email
            `;
        }
    }

    function logout() {
        signOut(auth).then(() => {
            cart = [];
            localStorage.removeItem('cart');
            appliedPromo = null;
            updateCartBadge();
            updateStickyCheckout();
            showNotification('Anda telah keluar dari akun');
        }).catch((error) => {
            console.error('Logout error:', error);
            showNotification('Terjadi kesalahan saat logout', true);
        });
    }

    // Update navigation links based on authentication state
    function updateNavLinks() {
        const navLinks = document.getElementById('navLinks');
        
        if (!navLinks) return;
        
        if (currentUser) {
            // User is logged in and verified
            navLinks.innerHTML = `
                <li><a href="#" onclick="showSection('home')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9L12 2l9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H3z"/>
                    </svg>
                    Beranda
                </a></li>
                <li><a href="#" onclick="showSection('products')">                   
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
            </svg>
                    Produk
                </a></li>
                <li><a href="#" onclick="showSection('about')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Tentang
                </a></li>
                <li><a href="#" onclick="showSection('cart')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Keranjang <span class="cart-badge" id="cartBadge">0</span>
                </a></li>
                <li><a href="#" onclick="showSection('profile')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.66 0-8 1.34-8 4v2h16v-2c0-2.66-5.34-4-8-4z"/>
            </svg>
                    Profil
                </a></li>
                <li><a href="#" onclick="logout()" style="color: var(--error);">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Keluar
                </a></li>
            `;
        } else {
            // User is not logged in or not verified
            navLinks.innerHTML = `
                <li><a href="#" onclick="showSection('home')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9L12 2l9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H3z"/>
                    </svg>
                    Beranda
                </a></li>
                <li><a href="#" onclick="showSection('products')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
            </svg>
                    Produk
                </a></li>
                <li><a href="#" onclick="showSection('about')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Tentang
                </a></li>
                <li><a href="#" onclick="showSection('cart')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Keranjang <span class="cart-badge" id="cartBadge">0</span>
                </a></li>
                <li><a href="#" onclick="showSection('auth')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.66 0-8 1.34-8 4v2h16v-2c0-2.66-5.34-4-8-4z"/>
            </svg>
                    Masuk
                </a></li>
            `;
        }
        
        updateCartBadge();
    }

    // Update mobile navigation visibility and content
    function updateMobileNavLinks() {
        const mobileBottomNav = document.getElementById('mobileBottomNav');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const mobileProfile = document.getElementById('mobileProfile');
        
        if (currentUser) {
            // Show mobile navigation for authenticated users
            if (mobileBottomNav) mobileBottomNav.style.display = 'block';
            if (mobileLogoutBtn) mobileLogoutBtn.classList.add('show');
            if (mobileProfile) mobileProfile.onclick = () => showSection('profile');
        } else {
            // Show mobile navigation for non-authenticated users too, but profile leads to auth
            if (mobileBottomNav) mobileBottomNav.style.display = 'block';
            if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('show');
            if (mobileProfile) mobileProfile.onclick = () => showSection('auth');
        }
    }

    // Update mobile navigation active state
    function updateMobileNavActive() {
        const currentSectionId = document.querySelector('.page-section.active')?.id;
        const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
        
        // Remove active class from all items
        mobileNavItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to current section
        if (currentSectionId) {
            const sectionName = currentSectionId.replace('Section', '').toLowerCase();
            const activeMobileNav = document.getElementById(`mobile${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`);
            if (activeMobileNav) {
                activeMobileNav.classList.add('active');
            } else if (currentSectionId === 'authSection') {
                const mobileProfile = document.getElementById('mobileProfile');
                if (mobileProfile) mobileProfile.classList.add('active');
            }
        }
    }

    // Navigation
    function showSection(sectionName) {
        // Check if user is trying to access profile or checkout without being logged in
        if ((sectionName === 'profile' || sectionName === 'checkout') && !currentUser) {
            showSection('auth');
            showNotification('Silakan masuk terlebih dahulu', true);
            return;
        }
        
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        if (sectionName === 'cart') {
            loadCart();
        } else if (sectionName === 'checkout') {
            loadCheckout();
        } else if (sectionName === 'profile') {
            loadProfile();
        }

        updateStickyCheckout();
        updateMobileNavActive();
    }

    // Products
    function loadProducts() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        const filteredProducts = currentFilter === 'all' 
            ? products 
            : products.filter(p => p.category === currentFilter);

        grid.innerHTML = filteredProducts.map((product, index) => `
            <div class="product-card fade-in" 
                 onclick="showProductDetail(${product.id})"
                 style="animation-delay: ${index * 0.1}s">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">Rp ${formatPrice(product.price)}</div>
                    <div class="product-colors">
                        <span style="color: var(--text-muted); font-size: 0.8rem; margin-right: 0.5rem;">Warna:</span>
                        ${product.colors.slice(0, 4).map(color => `
                            <div class="color-option" 
                                style="background-color: ${product.colorCodes[color]}" 
                                title="${color}">
                            </div>
                        `).join('')}
                        ${product.colors.length > 4 ? `<span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">+${product.colors.length - 4}</span>` : ''}
                    </div>
                    <p style="color: #94a3b8; font-size: 0.9rem; margin-top: auto;">${product.description}</p>
                </div>
            </div>
        `).join('');
    }

    function filterProducts(filter) {
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        loadProducts();
    }

    // Product Detail Modal
    function showProductDetail(productId) {
        selectedProduct = products.find(p => p.id === productId);
        if (!selectedProduct) return;
        
        selectedColor = selectedProduct.colors[0];
        
        const modal = document.getElementById('productModal');
        const productDetail = document.getElementById('productDetail');
        
        if (!modal || !productDetail) return;
        
        productDetail.innerHTML = `
            <div>
                <img src="${selectedProduct.image}" alt="${selectedProduct.name}" class="product-detail-image">
            </div>
            <div class="product-detail-info">
                <h2>${selectedProduct.name}</h2>
                <div class="product-detail-price">Rp ${formatPrice(selectedProduct.price)}</div>
                <p style="margin-bottom: 1.5rem; color: #cbd5e1;">${selectedProduct.description}</p>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-light);">Pilih Warna:</label>
                    <div class="product-colors" style="margin-bottom: 1rem;">
                        ${selectedProduct.colors.map(color => `
                            <div class="color-option ${color === selectedColor ? 'selected' : ''}" 
                                style="background-color: ${selectedProduct.colorCodes[color]}" 
                                title="${color}"
                                onclick="selectColor('${color}')">
                            </div>
                        `).join('')}
                    </div>
                    <p style="color: #94a3b8; font-size: 0.9rem;">Warna terpilih: <span id="selectedColorText" style="color: var(--accent-dark); font-weight: 600;">${selectedColor}</span></p>
                </div>
                <button class="btn" onclick="addToCart(${selectedProduct.id})" style="width: 100%;">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Tambahkan ke Keranjang
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    function closeProductModal() {
        const modal = document.getElementById('productModal');
        if (modal) modal.style.display = 'none';
    }

    function selectColor(color) {
        selectedColor = color;
        const selectedColorText = document.getElementById('selectedColorText');
        if (selectedColorText) selectedColorText.textContent = color;
        
        // Update color selection visual
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        if (event && event.target) {
            event.target.classList.add('selected');
        }
    }

    // Cart functions
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const color = selectedColor || product.colors[0];
        
        const existingItemIndex = cart.findIndex(item => 
            item.id === productId && item.selectedColor === color
        );

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({ 
                ...product, 
                quantity: 1,
                selectedColor: color
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        updateStickyCheckout();
        
        // Show feedback
        showNotification(`${product.name} (${color}) ditambahkan ke keranjang!`);
        
        // Close modal if open
        closeProductModal();
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Update desktop cart badge
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            cartBadge.textContent = totalItems;
        }
        
        // Update mobile cart badge
        const mobileCartBadge = document.getElementById('mobileCartBadge');
        if (mobileCartBadge) {
            mobileCartBadge.textContent = totalItems;
            mobileCartBadge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    function updateStickyCheckout() {
        const stickyCheckout = document.getElementById('stickyCheckout');
        if (!stickyCheckout) return;
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalItems > 0 && currentUser) {
            stickyCheckout.classList.add('show');
            stickyCheckout.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg> Checkout (${totalItems})
            `;
        } else {
            stickyCheckout.classList.remove('show');
        }
    }

    function loadCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartTotal) return;

        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="card" style="text-align: center;">
                    <p style="color: #94a3b8;">
                        <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto 1rem;">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        Keranjang belanja Anda kosong
                    </p>
                    <button class="btn" onclick="showSection('products')">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
                        </svg>
                        Mulai Belanja
                    </button>
                </div>
            `;
            cartTotal.textContent = 'Total: Rp 0';
            return;
        }

        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item fade-in" style="animation-delay: ${index * 0.1}s">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4 style="color: var(--text-light); margin-bottom: 0.5rem;">${item.name}</h4>
                    <p style="color: var(--accent-dark); font-weight: 600;">Rp ${formatPrice(item.price)}</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Warna: ${item.selectedColor}</p>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.selectedColor}', -1)">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </button>
                    <span style="margin: 0 1rem; font-weight: 600; color: var(--text-light);">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.selectedColor}', 1)">
                        <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </button>
                </div>
                <button class="quantity-btn" onclick="removeFromCart(${item.id}, '${item.selectedColor}')" style="background: var(--error); margin-left: 1rem;">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        `).join('');

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = appliedPromo ? Math.floor(subtotal * 0.1) : 0;
        const total = subtotal - discount;
        
        let totalHTML = `Subtotal: Rp ${formatPrice(subtotal)}`;
        if (discount > 0) {
            totalHTML += `<br><span style="color: var(--success);">Diskon (${appliedPromo}): -Rp ${formatPrice(discount)}</span>`;
        }
        totalHTML += `<br><strong style="font-size: 1.2rem;">Total: Rp ${formatPrice(total)}</strong>`;
        
        cartTotal.innerHTML = totalHTML;
    }

    function updateQuantity(productId, color, change) {
        const itemIndex = cart.findIndex(item => item.id === productId && item.selectedColor === color);
        
        if (itemIndex !== -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                removeFromCart(productId, color);
            } else {
                localStorage.setItem('cart', JSON.stringify(cart));
                loadCart();
                updateCartBadge();
                updateStickyCheckout();
            }
        }
    }

    function removeFromCart(productId, color) {
        const itemToRemove = cart.find(item => item.id === productId && item.selectedColor === color);
        const itemName = itemToRemove ? `${itemToRemove.name} (${itemToRemove.selectedColor})` : '';
        
        cart = cart.filter(item => !(item.id === productId && item.selectedColor === color));
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
        updateCartBadge();
        updateStickyCheckout();
        
        showNotification(`${itemName} dihapus dari keranjang`);
    }

    // Promo code functions
    function copyPromoCode() {
        navigator.clipboard.writeText('FEMMEIA10').then(() => {
            showNotification('Kode promo berhasil disalin!');
        }).catch(() => {
            showNotification('Gagal menyalin kode promo', true);
        });
    }

    function applyPromoCode() {
        const promoInput = document.getElementById('promoCode');
        const promoMessage = document.getElementById('promoMessage');
        
        if (!promoInput || !promoMessage) return;
        
        const code = promoInput.value.trim().toUpperCase();
        
        promoMessage.innerHTML = '';
        
        if (!code) {
            promoMessage.innerHTML = '<div class="error">Masukkan kode promo</div>';
            return;
        }
        
        if (code === 'FEMMEIA10') {
            if (appliedPromo === code) {
                promoMessage.innerHTML = '<div class="error">Kode promo sudah diterapkan</div>';
                return;
            }
            
            appliedPromo = code;
            promoMessage.innerHTML = '<div class="success">Kode promo berhasil diterapkan! Diskon 10%</div>';
            loadCheckoutCartSummary();
            showNotification('Selamat! Anda mendapat diskon 10%');
        } else {
            promoMessage.innerHTML = '<div class="error">Kode promo tidak valid</div>';
        }
    }

    // Checkout functions
    function loadCheckout() {
        const authWarning = document.getElementById('checkoutAuthWarning');
        const checkoutForm = document.getElementById('checkoutForm');
        
        if (!authWarning || !checkoutForm) return;
        
        if (!currentUser) {
            authWarning.style.display = 'block';
            checkoutForm.style.display = 'none';
        } else {
            authWarning.style.display = 'none';
            checkoutForm.style.display = 'block';
            
            // Load cart summary
            loadCheckoutCartSummary();
            
            // Pre-fill user data if available
            if (userProfile) {
                const nameInput = document.getElementById('customerName');
                const phoneInput = document.getElementById('customerWhatsapp');
                const addressInput = document.getElementById('customerAddress');
                
                if (nameInput && !nameInput.value && userProfile.username) {
                    nameInput.value = userProfile.username;
                }
                if (phoneInput && !phoneInput.value && userProfile.phone) {
                    phoneInput.value = userProfile.phone;
                }
                if (addressInput && !addressInput.value && userProfile.address) {
                    addressInput.value = userProfile.address;
                }
            }
        }
    }

    function loadCheckoutCartSummary() {
        const checkoutCartItems = document.getElementById('checkoutCartItems');
        if (!checkoutCartItems) return;
        
        if (cart.length === 0) {
            checkoutCartItems.innerHTML = '<p style="color: var(--text-muted);">Keranjang kosong</p>';
            return;
        }

        let subtotal = 0;
        let summaryHTML = '';

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            summaryHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border); color: var(--text);">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color: var(--text-muted);">Warna: ${item.selectedColor} | Qty: ${item.quantity}</small>
                    </div>
                    <div style="font-weight: 600;">Rp ${formatPrice(itemTotal)}</div>
                </div>
            `;
        });

        // Add discount if promo applied
        const discount = appliedPromo ? Math.floor(subtotal * 0.1) : 0;
        const total = subtotal - discount;

        if (discount > 0) {
            summaryHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border); color: var(--text);">
                    <div>Diskon (${appliedPromo})</div>
                    <div style="color: var(--success); font-weight: 600;">-Rp ${formatPrice(discount)}</div>
                </div>
            `;
        }

        summaryHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border); font-size: 1.1rem; font-weight: bold; color: var(--accent-dark);">
                <div><strong>Total</strong></div>
                <div><strong>Rp ${formatPrice(total)}</strong></div>
            </div>
        `;

        checkoutCartItems.innerHTML = summaryHTML;
    }

    // Order form submission
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showNotification('Silakan masuk terlebih dahulu', true);
                return;
            }

            if (cart.length === 0) {
                showNotification('Keranjang belanja kosong', true);
                return;
            }

            const orderBtn = document.getElementById('orderBtn');
            const orderBtnText = document.getElementById('orderBtnText');
            
            if (!orderBtn || !orderBtnText) return;
            
            orderBtn.disabled = true;
            orderBtnText.innerHTML = '<div class="loading"></div>Memproses...';

            try {
                const formData = new FormData(this);
                
                // Validate WhatsApp number
                const whatsapp = formData.get('whatsapp').trim();
                if (!/^[0-9]{10,15}$/.test(whatsapp.replace(/\D/g, ''))) {
                    showNotification('Nomor WhatsApp tidak valid', true);
                    return;
                }

                // Calculate totals
                const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const discount = appliedPromo ? Math.floor(subtotal * 0.1) : 0;
                const total = subtotal - discount;

                // Create order data
                const orderData = {
                    userId: currentUser.uid,
                    customerName: formData.get('nama'),
                    whatsapp: whatsapp,
                    address: formData.get('alamat'),
                    shipping: formData.get('pengiriman'),
                    payment: formData.get('pembayaran'),
                    notes: formData.get('catatan') || '',
                    items: cart,
                    subtotal: subtotal,
                    discount: discount,
                    promoCode: appliedPromo,
                    total: total,
                    createdAt: new Date(),
                    status: 'pending'
                };

                // Save order to Firebase
                await addDoc(collection(db, 'orders'), orderData);

                // Generate WhatsApp message
                let message = `*Pesanan Baru - FemmeiaCloth*\n\n`;
                message += `*Nama:* ${orderData.customerName}\n`;
                message += `*WhatsApp:* ${orderData.whatsapp}\n`;
                message += `*Alamat:* ${orderData.address}\n\n`;
                
                message += `*Detail Pesanan:*\n`;
                cart.forEach((item, index) => {
                    message += `${index + 1}. ${item.name}\n`;
                    message += `   Warna: ${item.selectedColor}\n`;
                    message += `   Qty: ${item.quantity}\n`;
                    message += `   Harga: Rp ${formatPrice(item.price * item.quantity)}\n\n`;
                });
                
                message += `*Subtotal: Rp ${formatPrice(subtotal)}*\n`;
                if (discount > 0) {
                    message += `*Diskon (${appliedPromo}): -Rp ${formatPrice(discount)}*\n`;
                }
                message += `*Total: Rp ${formatPrice(total)}*\n\n`;
                message += `*Pengiriman:* ${orderData.shipping}\n`;
                message += `*Pembayaran:* ${orderData.payment}\n`;
                
                if (orderData.notes) {
                    message += `*Catatan:* ${orderData.notes}\n`;
                }

                // Open WhatsApp
                const whatsappNumber = "6285341899229";
                const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappURL, '_blank');

                // Clear cart and show success
                cart = [];
                appliedPromo = null;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartBadge();
                updateStickyCheckout();
                
                showNotification('Pesanan berhasil dikirim ke WhatsApp!');
                
                // Reset form and redirect to home
                this.reset();
                const promoCodeInput = document.getElementById('promoCode');
                const promoMessage = document.getElementById('promoMessage');
                if (promoCodeInput) promoCodeInput.value = '';
                if (promoMessage) promoMessage.innerHTML = '';
                
                setTimeout(() => {
                    showSection('home');
                }, 2000);

            } catch (error) {
                console.error('Order submission error:', error);
                showNotification('Terjadi kesalahan saat memproses pesanan', true);
            } finally {
                orderBtn.disabled = false;
                orderBtnText.innerHTML = `
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    Pesan via WhatsApp
                `;
            }
        });
    }

    // Profile functions
    async function loadProfile() {
        if (!currentUser) return;
        
        const profileEmail = document.getElementById('profileEmail');
        const editEmail = document.getElementById('editEmail');
        
        if (profileEmail) profileEmail.textContent = currentUser.email;
        if (editEmail) editEmail.value = currentUser.email;
        
        // Load additional profile data from Firestore
        try {
            const q = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                userProfile = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                
                const profileUsername = document.getElementById('profileUsername');
                const editUsername = document.getElementById('editUsername');
                const editPhone = document.getElementById('editPhone');
                const editAddress = document.getElementById('editAddress');
                const profileAvatar = document.getElementById('profileAvatar');
                
                if (profileUsername) profileUsername.textContent = userProfile.username || 'Pengguna';
                if (editUsername) editUsername.value = userProfile.username || '';
                if (editPhone) editPhone.value = userProfile.phone || '';
                if (editAddress) editAddress.value = userProfile.address || '';
                
                if (userProfile.avatar && profileAvatar) {
                    profileAvatar.src = userProfile.avatar;
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async function uploadProfilePhoto(event) {
        if (!currentUser) {
            showNotification('Silakan masuk terlebih dahulu', true);
            return;
        }
        
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('File harus berupa gambar', true);
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Ukuran file maksimal 5MB', true);
            return;
        }
        
        try {
            showNotification('Mengupload foto profil...');
            
            // Create a reference to the file location
            const timestamp = Date.now();
            const fileName = `${currentUser.uid}_${timestamp}_${file.name}`;
            const storageRef = ref(storage, `profile-photos/${fileName}`);
            
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Update profile avatar immediately
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) profileAvatar.src = downloadURL;
            
            // Update user profile in Firestore
            if (userProfile && userProfile.id) {
                const userDocRef = doc(db, 'users', userProfile.id);
                await updateDoc(userDocRef, {
                    avatar: downloadURL,
                    updatedAt: new Date()
                });
                
                userProfile.avatar = downloadURL;
            } else {
                // Create new profile document if doesn't exist
                const docRef = await addDoc(collection(db, 'users'), {
                    uid: currentUser.uid,
                    username: currentUser.displayName || 'Pengguna',
                    email: currentUser.email,
                    avatar: downloadURL,
                    phone: '',
                    address: '',
                    createdAt: new Date()
                });
                
                userProfile = {
                    id: docRef.id,
                    uid: currentUser.uid,
                    username: currentUser.displayName || 'Pengguna',
                    email: currentUser.email,
                    avatar: downloadURL,
                    phone: '',
                    address: ''
                };
            }
            
            showNotification('Foto profil berhasil diperbarui!');
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Gagal mengupload foto profil: ' + error.message, true);
        }
    }

    async function updateProfile(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showNotification('Silakan masuk terlebih dahulu', true);
            return;
        }
        
        const editUsername = document.getElementById('editUsername');
        if (!editUsername) return;
        
        const username = editUsername.value.trim();
        
        if (!username) {
            showNotification('Nama pengguna wajib diisi', true);
            return;
        }

        try {
            if (userProfile && userProfile.id) {
                const userDocRef = doc(db, 'users', userProfile.id);
                await updateDoc(userDocRef, {
                    username: username,
                    updatedAt: new Date()
                });
                
                userProfile.username = username;
            } else {
                // Create new profile document
                const docRef = await addDoc(collection(db, 'users'), {
                    uid: currentUser.uid,
                    username: username,
                    email: currentUser.email,
                    phone: '',
                    address: '',
                    createdAt: new Date()
                });
                
                userProfile = {
                    id: docRef.id,
                    uid: currentUser.uid,
                    username: username,
                    email: currentUser.email,
                    phone: '',
                    address: ''
                };
            }
            
            const profileUsername = document.getElementById('profileUsername');
            if (profileUsername) profileUsername.textContent = username;
            showNotification('Profil berhasil diperbarui!');
        } catch (error) {
            console.error('Profile update error:', error);
            showNotification('Gagal memperbarui profil', true);
        }
    }

    async function updateContactInfo(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showNotification('Silakan masuk terlebih dahulu', true);
            return;
        }
        
        const editPhone = document.getElementById('editPhone');
        const editAddress = document.getElementById('editAddress');
        
        if (!editPhone || !editAddress) return;
        
        const phone = editPhone.value.trim();
        const address = editAddress.value.trim();

        try {
            if (userProfile && userProfile.id) {
                const userDocRef = doc(db, 'users', userProfile.id);
                await updateDoc(userDocRef, {
                    phone: phone,
                    address: address,
                    updatedAt: new Date()
                });
                
                userProfile.phone = phone;
                userProfile.address = address;
                
                showNotification('Informasi kontak berhasil diperbarui!');
            } else {
                showNotification('Profil tidak ditemukan', true);
            }
        } catch (error) {
            console.error('Contact update error:', error);
            showNotification('Gagal memperbarui informasi kontak', true);
        }
    }

    async function changePassword(event) {
        event.preventDefault();
        
        if (!currentUser) {
            showNotification('Silakan masuk terlebih dahulu', true);
            return;
        }
        
        const oldPasswordInput = document.getElementById('oldPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (!oldPasswordInput || !newPasswordInput || !confirmPasswordInput) return;
        
        const oldPassword = oldPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Clear previous errors
        const oldPasswordError = document.getElementById('oldPasswordError');
        const newPasswordError = document.getElementById('newPasswordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        
        if (oldPasswordError) oldPasswordError.textContent = '';
        if (newPasswordError) newPasswordError.textContent = '';
        if (confirmPasswordError) confirmPasswordError.textContent = '';
        
        // Validation
        if (!oldPassword) {
            if (oldPasswordError) oldPasswordError.textContent = 'Kata sandi lama wajib diisi';
            return;
        }
        
        if (!newPassword) {
            if (newPasswordError) newPasswordError.textContent = 'Kata sandi baru wajib diisi';
            return;
        }
        
        if (newPassword.length < 6) {
            if (newPasswordError) newPasswordError.textContent = 'Kata sandi baru minimal 6 karakter';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            if (confirmPasswordError) confirmPasswordError.textContent = 'Konfirmasi kata sandi tidak cocok';
            return;
        }

        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
            await reauthenticateWithCredential(currentUser, credential);
            
            // Update password
            await updatePassword(currentUser, newPassword);
            
            // Clear form
            oldPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            
            showNotification('Kata sandi berhasil diubah!');
        } catch (error) {
            console.error('Change password error:', error);
            
            let errorMessage = 'Terjadi kesalahan saat mengubah kata sandi';
            let errorField = 'oldPasswordError';
            
            switch (error.code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Kata sandi lama salah';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Kata sandi baru terlalu lemah';
                    errorField = 'newPasswordError';
                    break;
            }
            
            const errorElement = document.getElementById(errorField);
            if (errorElement) errorElement.textContent = errorMessage;
        }
    }
    
    // Notification system
    function showNotification(message, isError = false) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        if (isError) {
            notification.classList.add('error');
        } else {
            notification.classList.add('success');
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('productModal');
        if (event.target == modal) {
            closeProductModal();
        }
    };

    // Handle escape key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeProductModal();
        }
    });

  // Ambil elemen audio
  const clickSound = document.getElementById('clickSound');

  // Fungsi untuk memutar suara dengan cara reset posisi audio agar bisa diputar berulang tanpa delay
  function playClickSound() {
    clickSound.pause();
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {
      // Mengabaikan error bila pemutaran suara terganggu (seperti autoplay policy)
    });
  }

  // Pasang event listener global untuk click pada document
  document.addEventListener('click', (event) => {
    // Dapatkan elemen target yang diklik
    const target = event.target;

    // Cek apakah elemen target bisa diklik:
    // - tombol (button)
    // - link (a)
    // - punya class btn (misal elemen klik utama di UI)
    // - atau elemen dengan cursor pointer (opsional, bisa diganti/diperketat sesuai kebutuhan)
    
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('.btn') || 
      getComputedStyle(target).cursor === 'pointer'
    ) {
      playClickSound();
    }
  }, true); // gunakan capture phase supaya event terdengar lebih awal

  document.body.classList.add('loading-active'); // aktifkan blur pada body saat loading

  const preloader = document.getElementById('preloader');
  const spinner = preloader.querySelector('.spinner');

  spinner.addEventListener('animationend', () => {
    // Saat animasi spinner selesai, fade out + zoom out preloader
    preloader.style.opacity = '0';
    preloader.style.transform = 'scale(1.1)';

    // Hilangkan blur dari body bertahap
    document.body.classList.remove('loading-active');

    setTimeout(() => {
      preloader.style.display = 'none';
    }, 900); // durasi animasi fade out + zoom out
  });

  // Fallback jika load halaman terlambat
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (preloader.style.display !== 'none') {
        preloader.style.opacity = '0';
        preloader.style.transform = 'scale(1.1)';
        document.body.classList.remove('loading-active');
        setTimeout(() => preloader.style.display = 'none', 900);
      }
    }, 5800);
  });

(function() {
  // Otomatis slide, delay 1 detik, animasi slide
  const slider = document.getElementById('testimoniSlider');
  const cards = slider.children;
  let idx = 0;
  let total = cards.length;
  function setSlide(i) {
    slider.style.transform = `translateX(-${i * 100}%)`;
  }
  setSlide(0);
  setInterval(() => {
    idx = (idx + 1) % total;
    setSlide(idx);
  }, 5000);
})();
// Settings Modal Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsCloseBtn = document.querySelector('.settings-close-btn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

// Settings Input Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const animationsToggle = document.getElementById('animationsToggle');
const promoToggle = document.getElementById('promoToggle');
const languageSelect = document.getElementById('languageSelect');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

// Language Texts for Entire Website
const websiteTexts = {
    id: {
        // Settings Panel
        settingsTitle: 'Pengaturan Website',
        appearanceTitle: 'Tampilan',
        darkModeLabel: 'Mode Gelap',
        animationsLabel: 'Animasi',
        fontSizeLabel: 'Ukuran Font',
        preferencesTitle: 'Preferensi',
        promoLabel: 'Notifikasi Promo',
        languageLabel: 'Bahasa',
        closeBtnLabel: 'Tutup',
        resetBtnLabel: 'Reset Pengaturan',
        fontSmall: 'Kecil',
        fontNormal: 'Normal',
        fontLarge: 'Besar',
        settingsTooltip: 'Pengaturan',
        // Navigation (Desktop and Mobile)
        navHome: 'Beranda',
        navProducts: 'Produk',
        navAbout: 'Tentang',
        navCart: 'Keranjang',
        navProfile: 'Profil',
        navLogin: 'Masuk',
        navLogout: 'Keluar',
        // Home Section
        float111: 'Hijab & Fashion Premium',
        heroText: 'Temukan koleksi hijab dan aksesoris cantik berkualitas tinggi yang dirancang untuk wanita modern. Kualitas, variasi, dan harga terjangkau.',
        promoTitle: 'Diskon Spesial 10%!',
        promoText: 'Gunakan kode promo untuk mendapatkan diskon 10% untuk semua produk',
        promoCopy: 'Klik untuk menyalin kode',
        surveyTitle: 'Ikuti Survey Berhadiah! (Batch Pertama)',
        surveyDesc: 'Dapatkan <span class="highlight">saldo e-wallet</span> senilai <b>Rp1.000 - Rp10.000</b> dengan mengisi survey singkat dari FemmeiaCloth.<br>Bantu kami jadi lebih baik &amp; menangkan hadiahnya!',
        surveyBtn: 'Isi survey sekarang!',
        feature1Title: 'Koleksi Unggulan',
        feature1Text: 'Jelajahi desain hijab terbaru kami yang dibuat dengan bahan premium dan perhatian terhadap detail.',
        feature2Title: 'Jaminan Kualitas',
        feature2Text: 'Setiap produk dipilih dengan hati-hati untuk memastikan kenyamanan, daya tahan, dan gaya yang bertahan lama.',
        feature3Title: 'Kemewahan Terjangkau',
        feature3Text: 'Fashion yang indah tidak harus mahal. Temukan harga kompetitif kami.',
        // Products Section
        productsTitle: 'Produk Kami',
        filterAll: 'Semua',
        filterHijab: 'Hijab',
        filterInner: 'Inner',
        filterPashmina: 'Pashmina',
        // Cart Section
        cartTitle: 'Keranjang Belanja',
        cartEmpty: 'Keranjang belanja Anda kosong',
        cartStartShopping: 'Mulai Belanja',
        cartCheckout: 'Lanjut ke Checkout',
        cartTotal: 'Total',
        // Checkout Section
        checkoutTitle: 'Checkout',
        checkoutAuthWarningTitle: 'Silakan Masuk Terlebih Dahulu',
        checkoutAuthWarningText: 'Untuk melakukan pemesanan, Anda perlu masuk ke akun terlebih dahulu.',
        checkoutAuthWarningBtn: 'Masuk Sekarang',
        checkoutOrderSummary: 'Ringkasan Pesanan',
        checkoutPromoCode: 'Kode Promo',
        checkoutPromoInput: 'Masukkan Kode Promo',
        checkoutPromoApply: 'Terapkan',
        checkoutCustomerInfo: 'Informasi Pembeli',
        checkoutName: 'Nama Lengkap',
        checkoutWhatsapp: 'Nomor WhatsApp',
        checkoutAddress: 'Alamat Lengkap',
        checkoutShipping: 'Metode Pengiriman',
        checkoutPayment: 'Metode Pembayaran',
        checkoutNotes: 'Catatan Tambahan (Opsional)',
        checkoutOrderBtn: 'Pesan via WhatsApp',
        // Auth Section
        authWelcomeBack: 'Selamat Datang Kembali',
        authLogin: 'Masuk',
        authEmailUsername: 'Email atau Username',
        authPassword: 'Kata Sandi',
        authForgotPassword: 'Lupa kata sandi?',
        authNoAccount: 'Belum punya akun?',
        authRegisterLink: 'Daftar',
        authJoin: 'Bergabung dengan FemmeiaCloth',
        authRegister: 'Daftar',
        authUsername: 'Nama Pengguna',
        authEmail: 'Email',
        authResetPassword: 'Reset Kata Sandi',
        authSendResetLink: 'Kirim Link Reset',
        authHaveAccount: 'Sudah punya akun?',
        authVerificationTitle: 'Verifikasi Email Diperlukan',
        authVerificationText: 'Silakan periksa email Anda dan klik link verifikasi untuk mengaktifkan akun.',
        authResendEmail: 'Kirim Ulang Email',
        // Profile Section
        profileTitle: 'Profil',
        profileChangePhoto: 'Ganti Foto',
        profileEditBasic: 'Edit Profil Dasar',
        profileUpdateProfile: 'Perbarui Profil',
        profileContactInfo: 'Informasi Kontak',
        profilePhone: 'Nomor Telepon',
        profileAddressFull: 'Alamat Lengkap',
        profileSaveContact: 'Simpan Kontak',
        profileChangePassword: 'Ubah Kata Sandi',
        profileOldPassword: 'Kata Sandi Lama',
        profileNewPassword: 'Kata Sandi Baru',
        profileConfirmPassword: 'Konfirmasi Kata Sandi Baru',
        profileUpdatePassword: 'Ubah Kata Sandi',
        profileOrderHistory: 'Riwayat Pesanan',
        profileNoOrders: 'Belum ada pesanan',
        profileLogout: 'Log Out dari Akun',
        // About Section
        aboutTitle: 'Tentang FemmeiaCloth',
        aboutSubtitle: 'Menyediakan hijab dan fashion berkualitas untuk wanita modern',
        aboutVisionTitle: 'Visi Kami',
        aboutVisionText: 'Menjadi brand hijab terdepan yang menghadirkan produk berkualitas tinggi dengan desain modern dan harga terjangkau untuk semua kalangan wanita muslimah.',
        aboutQualityTitle: 'Kualitas Premium',
        aboutQualityText: 'Bahan pilihan terbaik yang nyaman dan tahan lama',
        aboutDesignTitle: 'Desain Modern',
        aboutDesignText: 'Mengikuti tren fashion terkini dengan sentuhan elegan',
        aboutPriceTitle: 'Harga Terjangkau',
        aboutPriceText: 'Fashion berkualitas dengan harga yang bersahabat',
        aboutShippingTitle: 'Pengiriman Cepat',
        aboutShippingText: 'Layanan pengiriman ke seluruh Indonesia',
        aboutContactTitle: 'Hubungi Kami',
        aboutWhatsapp: 'WhatsApp',
        aboutEmail: 'Email',
        aboutAddress: 'Alamat',
        aboutHours: 'Jam Operasional',
        // Notifications and Misc
        promoCopied: 'Kode promo berhasil disalin!',
        promoCopyFailed: 'Gagal menyalin kode promo',
        promoEnabledNotification: 'Notifikasi promo diaktifkan!',
        resetSuccessNotification: 'Pengaturan telah direset ke default!'
    },
    en: {
        // Settings Panel
        settingsTitle: 'Website Settings',
        appearanceTitle: 'Appearance',
        darkModeLabel: 'Dark Mode',
        animationsLabel: 'Animations',
        fontSizeLabel: 'Font Size',
        preferencesTitle: 'Preferences',
        promoLabel: 'Promo Notifications',
        languageLabel: 'Language',
        closeBtnLabel: 'Close',
        resetBtnLabel: 'Reset Settings',
        fontSmall: 'Small',
        fontNormal: 'Normal',
        fontLarge: 'Large',
        settingsTooltip: 'Settings',
        // Navigation (Desktop and Mobile)
        navHome: 'Home',
        navProducts: 'Products',
        navAbout: 'About',
        navCart: 'Cart',
        navProfile: 'Profile',
        navLogin: 'Login',
        navLogout: 'Logout',
        // Home Section
        float111: 'Premium Hijab & Fashion',
        heroText: 'Discover high-quality hijab and accessories designed for modern women. Quality, variety, and affordability.',
        promoTitle: 'Special 10% Discount!',
        promoText: 'Use the promo code to get 10% off on all products',
        promoCopy: 'Click to copy code',
        surveyTitle: 'Join Our Reward Survey! (First Batch)',
        surveyDesc: 'Get <span class="highlight">e-wallet balance</span> worth <b>Rp1,000 - Rp10,000</b> by filling out a short survey from FemmeiaCloth.<br>Help us improve &amp; win rewards!',
        surveyBtn: 'Take the survey now!',
        feature1Title: 'Featured Collection',
        feature1Text: 'Explore our latest hijab designs crafted with premium materials and attention to detail.',
        feature2Title: 'Quality Assurance',
        feature2Text: 'Every product is carefully selected to ensure comfort, durability, and lasting style.',
        feature3Title: 'Affordable Luxury',
        feature3Text: 'Beautiful fashion doesn’t have to be expensive. Discover our competitive prices.',
        // Products Section
        productsTitle: 'Our Products',
        filterAll: 'All',
        filterHijab: 'Hijab',
        filterInner: 'Inner',
        filterPashmina: 'Pashmina',
        // Cart Section
        cartTitle: 'Shopping Cart',
        cartEmpty: 'Your shopping cart is empty',
        cartStartShopping: 'Start Shopping',
        cartCheckout: 'Proceed to Checkout',
        cartTotal: 'Total',
        // Checkout Section
        checkoutTitle: 'Checkout',
        checkoutAuthWarningTitle: 'Please Log In First',
        checkoutAuthWarningText: 'To place an order, you need to log in to your account first.',
        checkoutAuthWarningBtn: 'Login Now',
        checkoutOrderSummary: 'Order Summary',
        checkoutPromoCode: 'Promo Code',
        checkoutPromoInput: 'Enter Promo Code',
        checkoutPromoApply: 'Apply',
        checkoutCustomerInfo: 'Customer Information',
        checkoutName: 'Full Name',
        checkoutWhatsapp: 'WhatsApp Number',
        checkoutAddress: 'Full Address',
        checkoutShipping: 'Shipping Method',
        checkoutPayment: 'Payment Method',
        checkoutNotes: 'Additional Notes (Optional)',
        checkoutOrderBtn: 'Order via WhatsApp',
        // Auth Section
        authWelcomeBack: 'Welcome Back',
        authLogin: 'Login',
        authEmailUsername: 'Email or Username',
        authPassword: 'Password',
        authForgotPassword: 'Forgot Password?',
        authNoAccount: 'Don’t have an account?',
        authRegisterLink: 'Register',
        authJoin: 'Join FemmeiaCloth',
        authRegister: 'Register',
        authUsername: 'Username',
        authEmail: 'Email',
        authResetPassword: 'Reset Password',
        authSendResetLink: 'Send Reset Link',
        authHaveAccount: 'Already have an account?',
        authVerificationTitle: 'Email Verification Required',
        authVerificationText: 'Please check your email and click the verification link to activate your account.',
        authResendEmail: 'Resend Email',
        // Profile Section
        profileTitle: 'Profile',
        profileChangePhoto: 'Change Photo',
        profileEditBasic: 'Edit Basic Profile',
        profileUpdateProfile: 'Update Profile',
        profileContactInfo: 'Contact Information',
        profilePhone: 'Phone Number',
        profileAddressFull: 'Full Address',
        profileSaveContact: 'Save Contact',
        profileChangePassword: 'Change Password',
        profileOldPassword: 'Old Password',
        profileNewPassword: 'New Password',
        profileConfirmPassword: 'Confirm New Password',
        profileUpdatePassword: 'Update Password',
        profileOrderHistory: 'Order History',
        profileNoOrders: 'No orders yet',
        profileLogout: 'Log Out of Account',
        // About Section
        aboutTitle: 'About FemmeiaCloth',
        aboutSubtitle: 'Providing quality hijab and fashion for modern women',
        aboutVisionTitle: 'Our Vision',
        aboutVisionText: 'To become the leading hijab brand offering high-quality products with modern designs at affordable prices for all Muslim women.',
        aboutQualityTitle: 'Premium Quality',
        aboutQualityText: 'Best selected materials for comfort and durability',
        aboutDesignTitle: 'Modern Design',
        aboutDesignText: 'Following the latest fashion trends with an elegant touch',
        aboutPriceTitle: 'Affordable Price',
        aboutPriceText: 'Quality fashion at friendly prices',
        aboutShippingTitle: 'Fast Shipping',
        aboutShippingText: 'Delivery service across Indonesia',
        aboutContactTitle: 'Contact Us',
        aboutWhatsapp: 'WhatsApp',
        aboutEmail: 'Email',
        aboutAddress: 'Address',
        aboutHours: 'Operating Hours',
        // Notifications and Misc
        promoCopied: 'Promo code copied successfully!',
        promoCopyFailed: 'Failed to copy promo code',
        promoEnabledNotification: 'Promo notifications enabled!',
        resetSuccessNotification: 'Settings have been reset to default!'
    }
};

// Default Settings
const defaultSettings = {
    darkMode: false,
    animations: true,
    promoNotifications: true,
    language: 'id',
    fontSize: 'normal'
};

// Load Settings from localStorage
function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('websiteSettings'));
    if (!savedSettings) return defaultSettings;

    // Merge saved settings with defaults to ensure all keys exist
    return {
        darkMode: savedSettings.darkMode || false,
        animations: savedSettings.animations !== undefined ? savedSettings.animations : true,
        promoNotifications: savedSettings.promoNotifications !== undefined ? savedSettings.promoNotifications : true,
        language: savedSettings.language || 'id',
        fontSize: savedSettings.fontSize || 'normal'
    };
}

// Apply Settings to UI
function applySettings(settings) {
    // Update input fields
    if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
    if (animationsToggle) animationsToggle.checked = settings.animations;
    if (promoToggle) promoToggle.checked = settings.promoNotifications;
    if (languageSelect) languageSelect.value = settings.language;
    if (fontSizeSelect) fontSizeSelect.value = settings.fontSize;

    // Apply Dark Mode
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Apply Animation Settings
    if (!settings.animations) {
        document.body.classList.add('animations-disabled');
    } else {
        document.body.classList.remove('animations-disabled');
    }

    // Apply Font Size
    document.body.classList.remove('font-small', 'font-normal', 'font-large');
    document.body.classList.add(`font-${settings.fontSize}`);

    // Update Language Texts Site-Wide
    updateLanguageTexts(settings.language);
}

// Update UI Texts based on Language for Entire Website
function updateLanguageTexts(lang) {
    const texts = websiteTexts[lang];

    // Update Settings Panel Texts via data-lang attributes
    document.querySelectorAll('[data-lang-id]').forEach(element => {
        const idText = element.getAttribute('data-lang-id');
        const enText = element.getAttribute('data-lang-en');
        if (idText && enText) {
            element.textContent = lang === 'id' ? idText : enText;
        }
    });

    // Update Navigation Links (Desktop)
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        const currentUser = window.currentUser; // Assuming global variable from your existing code
        if (currentUser) {
            navLinks.innerHTML = `
                <li><a href="#" onclick="showSection('home')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9L12 2l9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H3z"/>
                    </svg>
                    ${texts.navHome}
                </a></li>
                <li><a href="#" onclick="showSection('products')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M16 12l-4-4-4 4"/>
                    </svg>
                    ${texts.navProducts}
                </a></li>
                <li><a href="#" onclick="showSection('about')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    ${texts.navAbout}
                </a></li>
                <li><a href="#" onclick="showSection('cart')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    ${texts.navCart} <span class="cart-badge" id="cartBadge">0</span>
                </a></li>
                <li><a href="#" onclick="showSection('profile')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.66 0-8 1.34-8 4v2h16v-2c0-2.66-5.34-4-8-4z"/>
                    </svg>
                    ${texts.navProfile}
                </a></li>
                <li><a href="#" onclick="logout()" style="color: var(--error);">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    ${texts.navLogout}
                </a></li>
            `;
        } else {
            navLinks.innerHTML = `
                <li><a href="#" onclick="showSection('home')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9L12 2l9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4H9v4a2 2 0 0 1-2 2H3z"/>
                    </svg>
                    ${texts.navHome}
                </a></li>
                <li><a href="#" onclick="showSection('products')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M16 12l-4-4-4 4"/>
                    </svg>
                    ${texts.navProducts}
                </a></li>
                <li><a href="#" onclick="showSection('about')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    ${texts.navAbout}
                </a></li>
                <li><a href="#" onclick="showSection('cart')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"/>
                        <circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    ${texts.navCart} <span class="cart-badge" id="cartBadge">0</span>
                </a></li>
                <li><a href="#" onclick="showSection('auth')">
                    <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    </svg>
                    ${texts.navLogin}
                </a></li>
            `;
        }
        updateCartBadge(); // Assuming this function exists in your code to update the cart count
    }

    // Update Mobile Navigation Texts
    const mobileHomeText = document.querySelector('#mobileHome .mobile-nav-text');
    const mobileProductsText = document.querySelector('#mobileProducts .mobile-nav-text');
    const mobileCartText = document.querySelector('#mobileCart .mobile-nav-text');
    const mobileAboutText = document.querySelector('#mobileAbout .mobile-nav-text');
    const mobileProfileText = document.querySelector('#mobileProfile .mobile-nav-text');

    if (mobileHomeText) mobileHomeText.textContent = texts.navHome;
    if (mobileProductsText) mobileProductsText.textContent = texts.navProducts;
    if (mobileCartText) mobileCartText.textContent = texts.navCart;
    if (mobileAboutText) mobileAboutText.textContent = texts.navAbout;
    if (mobileProfileText) mobileProfileText.textContent = texts.navProfile;

    // Update Home Section
    const heroH1 = document.querySelector('#homeSection .hero h1');
    const heroP = document.querySelector('#homeSection .hero p');
    if (heroH1) {
        heroH1.textContent = texts.float111;
        heroH1.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26"/>
            </svg>
        `);
    }
    if (heroP) heroP.innerHTML = texts.heroText;

    const promoH3 = document.querySelector('.promo-card h3');
    const promoP = document.querySelector('.promo-card p:not([style])');
    const promoSmallP = document.querySelector('.promo-card p[style]');
    if (promoH3) {
        promoH3.textContent = texts.promoTitle;
        promoH3.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M21.2 15.89A3 3 0 1 1 18.11 18.78l-2.85-2.85a3 3 0 0 1-4.24 0l-2.85 2.85A3 3 0 1 1 5.32 15.89l2.85-2.85a3 3 0 0 1 0-4.24l-2.85-2.85A3 3 0 1 1 8.17 2.11l2.85 2.85a3 3 0 0 1 4.24 0l2.85-2.85A3 3 0 1 1 20.95 5.89l-2.85 2.85a3 3 0 0 1 0 4.24l2.85 2.85z"/>
            </svg>
        `);
    }
    if (promoP) promoP.textContent = texts.promoText;
    if (promoSmallP) promoSmallP.textContent = texts.promoCopy;

    const surveyTitle = document.querySelector('.survey-section-title');
    const surveyDesc = document.querySelector('.survey-section-desc');
    const surveyBtn = document.querySelector('.survey-section-btn');
    if (surveyTitle) surveyTitle.innerHTML = `<span class="survey-icon">🎁</span> ${texts.surveyTitle}`;
    if (surveyDesc) surveyDesc.innerHTML = texts.surveyDesc;
    if (surveyBtn) surveyBtn.textContent = texts.surveyBtn;

    const featureCards = document.querySelectorAll('#homeSection .bento-grid .card');
    if (featureCards.length >= 3) {
        featureCards[0].querySelector('h3').textContent = texts.feature1Title;
        featureCards[0].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26"/>
            </svg>
        `);
        featureCards[0].querySelector('p').textContent = texts.feature1Text;

        featureCards[1].querySelector('h3').textContent = texts.feature2Title;
        featureCards[1].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
            </svg>
        `);
        featureCards[1].querySelector('p').textContent = texts.feature2Text;

        featureCards[2].querySelector('h3').textContent = texts.feature3Title;
        featureCards[2].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
        `);
        featureCards[2].querySelector('p').textContent = texts.feature3Text;
    }

    // Update Products Section
    const productsH2 = document.querySelector('#productsSection h2');
    if (productsH2) {
        productsH2.textContent = texts.productsTitle;
        productsH2.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
            </svg>
        `);
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length) {
        filterBtns[0].textContent = texts.filterAll;
        filterBtns[1].textContent = texts.filterHijab;
        filterBtns[2].textContent = texts.filterInner;
        filterBtns[3].textContent = texts.filterPashmina;
    }

    // Update Cart Section
    const cartH2 = document.querySelector('#cartSection h2');
    if (cartH2) {
        cartH2.textContent = texts.cartTitle;
        cartH2.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
        `);
    }

    const cartEmptyDiv = document.querySelector('#cartItems .card');
    if (cartEmptyDiv) {
        const cartP = cartEmptyDiv.querySelector('p');
        const cartBtn = cartEmptyDiv.querySelector('button');
        if (cartP) {
            cartP.innerHTML = `
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto 1rem;">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                ${texts.cartEmpty}
            `;
        }
        if (cartBtn) {
            cartBtn.textContent = texts.cartStartShopping;
            cartBtn.insertAdjacentHTML('afterbegin', `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
                </svg>
            `);
        }
    }

    const checkoutBtn = document.querySelector('#cartSection button.btn');
    if (checkoutBtn) {
        checkoutBtn.textContent = texts.cartCheckout;
        checkoutBtn.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v18l-7-3-7 3V3h6"/>
                <path d="M9 6h6"/>
                <path d="M9 10h6"/>
            </svg>
        `);
    }

    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) {
        const currentTotalText = cartTotalEl.textContent.split(':')[1] || 'Rp 0';
        cartTotalEl.textContent = `${texts.cartTotal}: ${currentTotalText}`;
    }

    // Update Checkout Section
    const checkoutH2 = document.querySelector('#checkoutSection h2');
    if (checkoutH2) {
        checkoutH2.textContent = texts.checkoutTitle;
        checkoutH2.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16,3 22,9 13,18 9,18 1,10 16,3"/>
            </svg>
        `);
    }

    const authWarningCard = document.getElementById('checkoutAuthWarning');
    if (authWarningCard) {
        const authWarningH3 = authWarningCard.querySelector('h3');
        const authWarningP = authWarningCard.querySelector('p');
        const authWarningBtn = authWarningCard.querySelector('button');
        if (authWarningH3) {
            authWarningH3.textContent = texts.checkoutAuthWarningTitle;
            authWarningH3.insertAdjacentHTML('afterbegin', `
                <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            `);
        }
        if (authWarningP) authWarningP.textContent = texts.checkoutAuthWarningText;
        if (authWarningBtn) {
            authWarningBtn.textContent = texts.checkoutAuthWarningBtn;
            authWarningBtn.insertAdjacentHTML('afterbegin', `
                <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v18l-7-3-7 3V3h6"/>
                    <path d="M9 6h6"/>
                    <path d="M9 10h6"/>
                </svg>
            `);
        }
    }

    const checkoutFormTitles = document.querySelectorAll('#checkoutForm .card h3');
    if (checkoutFormTitles.length >= 3) {
        checkoutFormTitles[0].textContent = texts.checkoutOrderSummary;
        checkoutFormTitles[0].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
            </svg>
        `);
        checkoutFormTitles[1].textContent = texts.checkoutPromoCode;
        checkoutFormTitles[1].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M21.2 15.89A3 3 0 1 1 18.11 18.78l-2.85-2.85a3 3 0 0 1-4.24 0l-2.85 2.85A3 3 0 1 1 5.32 15.89l2.85-2.85a3 3 0 0 1 0-4.24l-2.85-2.85A3 3 0 1 1 8.17 2.11l2.85 2.85a3 3 0 0 1 4.24 0l2.85-2.85A3 3 0 1 1 20.95 5.89l-2.85 2.85a3 3 0 0 1 0 4.24l2.85 2.85z"/>
            </svg>
        `);
        checkoutFormTitles[2].textContent = texts.checkoutCustomerInfo;
        checkoutFormTitles[2].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
        `);
    }

    const promoCodeInput = document.querySelector('#promoCode');
    if (promoCodeInput) promoCodeInput.placeholder = texts.checkoutPromoInput;

    const promoApplyBtn = document.querySelector('#checkoutForm button.btn');
    if (promoApplyBtn) {
        promoApplyBtn.textContent = texts.checkoutPromoApply;
        promoApplyBtn.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26"/>
            </svg>
        `);
    }

    const orderFormLabels = document.querySelectorAll('#orderForm .form-group label');
    if (orderFormLabels.length >= 5) {
        orderFormLabels[0].textContent = texts.checkoutName;
        orderFormLabels[1].textContent = texts.checkoutWhatsapp;
        orderFormLabels[2].textContent = texts.checkoutAddress;
        orderFormLabels[3].textContent = texts.checkoutShipping;
        orderFormLabels[4].textContent = texts.checkoutPayment;
        if (orderFormLabels.length > 5) orderFormLabels[5].textContent = texts.checkoutNotes;
    }

    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.querySelector('span').textContent = texts.checkoutOrderBtn;
        orderBtn.querySelector('span').insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
        `);
    }

    // Update Auth Section
    const loginFormH2 = document.querySelector('#loginForm h2');
    if (loginFormH2) loginFormH2.textContent = texts.authWelcomeBack;

    const loginBtnSpan = document.querySelector('#loginBtn span');
    if (loginBtnSpan) {
        loginBtnSpan.textContent = texts.authLogin;
        loginBtnSpan.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v18l-7-3-7 3V3h6"/>
                <path d="M9 6h6"/>
                <path d="M9 10h6"/>
            </svg>
        `);
    }

    const loginLabels = document.querySelectorAll('#loginForm .form-group label');
    if (loginLabels.length >= 2) {
        loginLabels[0].textContent = texts.authEmailUsername;
        loginLabels[1].textContent = texts.authPassword;
    }

    const forgotPwdLink = document.querySelector('.forgot-password a');
    if (forgotPwdLink) forgotPwdLink.textContent = texts.authForgotPassword;

    const authSwitchLogin = document.querySelector('#loginForm .auth-switch');
    if (authSwitchLogin) {
        authSwitchLogin.childNodes[0].textContent = `${texts.authNoAccount} `;
        authSwitchLogin.querySelector('a').textContent = texts.authRegisterLink;
    }

    const registerFormH2 = document.querySelector('#registerForm h2');
    if (registerFormH2) registerFormH2.textContent = texts.authJoin;

    const registerBtnSpan = document.querySelector('#registerBtn span');
    if (registerBtnSpan) {
        registerBtnSpan.textContent = texts.authRegister;
        registerBtnSpan.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
        `);
    }

    const registerLabels = document.querySelectorAll('#registerForm .form-group label');
    if (registerLabels.length >= 3) {
        registerLabels[0].textContent = texts.authUsername;
        registerLabels[1].textContent = texts.authEmail;
        registerLabels[2].textContent = texts.authPassword;
    }

    const authSwitchRegister = document.querySelector('#registerForm .auth-switch');
    if (authSwitchRegister) {
        authSwitchRegister.childNodes[0].textContent = `${texts.authHaveAccount} `;
        authSwitchRegister.querySelector('a').textContent = texts.authLogin;
    }

    const forgotPwdH2 = document.querySelector('#forgotPasswordForm h2');
    if (forgotPwdH2) forgotPwdH2.textContent = texts.authResetPassword;

    const resetBtnSpan = document.querySelector('#resetBtn span');
    if (resetBtnSpan) {
        resetBtnSpan.textContent = texts.authSendResetLink;
        resetBtnSpan.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
            </svg>
        `);
    }

    const forgotPwdLabel = document.querySelector('#forgotPasswordForm .form-group label');
    if (forgotPwdLabel) forgotPwdLabel.textContent = texts.authEmail;

    const authSwitchForgot = document.querySelector('#forgotPasswordForm .auth-switch');
    if (authSwitchForgot) {
        authSwitchForgot.childNodes[0].textContent = `${texts.authHaveAccount} `;
        authSwitchForgot.querySelector('a').textContent = texts.authLogin;
    }

    const verificationH3 = document.querySelector('#verificationNotice h3');
    const verificationP = document.querySelector('#verificationNotice p');
    const resendBtnText = document.querySelector('#resendBtnText');
    if (verificationH3) {
        verificationH3.textContent = texts.authVerificationTitle;
        verificationH3.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
            </svg>
        `);
    }
    if (verificationP) verificationP.textContent = texts.authVerificationText;
    if (resendBtnText) {
        resendBtnText.textContent = texts.authResendEmail;
        resendBtnText.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
            </svg>
        `);
    }

    // Update Profile Section
    const profileH2s = document.querySelectorAll('#profileSection .card h3');
    if (profileH2s.length >= 4) {
        profileH2s[0].textContent = texts.profileEditBasic;
        profileH2s[0].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        `);
        profileH2s[1].textContent = texts.profileContactInfo;
        profileH2s[1].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
        `);
        profileH2s[2].textContent = texts.profileChangePassword;
        profileH2s[2].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
        `);
        profileH2s[3].textContent = texts.profileOrderHistory;
        profileH2s[3].insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
            </svg>
        `);
    }

    const profileBtnLabels = document.querySelectorAll('#profileSection .card label');
    if (profileBtnLabels.length >= 5) {
        profileBtnLabels[0].textContent = texts.authUsername;
        profileBtnLabels[1].textContent = texts.authEmail;
        profileBtnLabels[2].textContent = texts.profilePhone;
        profileBtnLabels[3].textContent = texts.profileAddressFull;
        profileBtnLabels[4].textContent = texts.profileOldPassword;
        if (profileBtnLabels.length > 5) {
            profileBtnLabels[5].textContent = texts.profileNewPassword;
            profileBtnLabels[6].textContent = texts.profileConfirmPassword;
        }
    }

    const profileBtns = document.querySelectorAll('#profileSection .card button');
    if (profileBtns.length >= 4) {
        profileBtns[0].textContent = texts.profileChangePhoto;
        profileBtns[0].insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
            </svg>
        `);
        profileBtns[1].textContent = texts.profileUpdateProfile;
        profileBtns[1].insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
            </svg>
        `);
        profileBtns[2].textContent = texts.profileSaveContact;
        profileBtns[2].insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
            </svg>
        `);
        profileBtns[3].textContent = texts.profileUpdatePassword;
        profileBtns[3].insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
        `);
    }

    const profileNoOrdersP = document.querySelector('#orderHistory p');
    if (profileNoOrdersP) profileNoOrdersP.textContent = texts.profileNoOrders;

    const profileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (profileLogoutBtn) profileLogoutBtn.textContent = texts.profileLogout;

    // Update About Section
    const aboutH1 = document.querySelector('#aboutSection .hero h1');
    const aboutP = document.querySelector('#aboutSection .hero p');
    if (aboutH1) {
        aboutH1.textContent = texts.aboutTitle;
        aboutH1.insertAdjacentHTML('afterbegin', `
            <svg class="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
        `);
    }
    if (aboutP) aboutP.textContent = texts.aboutSubtitle;

    const aboutCards = document.querySelectorAll('#aboutSection .bento-grid .card');
    if (aboutCards.length >= 6) {
        aboutCards[0].querySelector('h3').textContent = texts.aboutVisionTitle;
        aboutCards[0].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10,8 16,12 10,16 10,8"/>
            </svg>
        `);
        aboutCards[0].querySelector('p').textContent = texts.aboutVisionText;

        aboutCards[1].querySelector('h3').textContent = texts.aboutQualityTitle;
        aboutCards[1].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zM3 6h18M10 12h4"/>
            </svg>
        `);
        aboutCards[1].querySelector('p').textContent = texts.aboutQualityText;

        aboutCards[2].querySelector('h3').textContent = texts.aboutDesignTitle;
        aboutCards[2].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26"/>
            </svg>
        `);
        aboutCards[2].querySelector('p').textContent = texts.aboutDesignText;

        aboutCards[3].querySelector('h3').textContent = texts.aboutPriceTitle;
        aboutCards[3].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
        `);
        aboutCards[3].querySelector('p').textContent = texts.aboutPriceText;

        aboutCards[4].querySelector('h3').textContent = texts.aboutShippingTitle;
        aboutCards[4].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16,3 22,9 13,18 9,18 1,10 16,3"/>
            </svg>
        `);
        aboutCards[4].querySelector('p').textContent = texts.aboutShippingText;

        aboutCards[5].querySelector('h3').textContent = texts.aboutContactTitle;
        aboutCards[5].querySelector('h3').insertAdjacentHTML('afterbegin', `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 0.5rem;">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
        `);
        const contactP = aboutCards[5].querySelector('p');
        if (contactP) {
            contactP.innerHTML = `
                <strong>${texts.aboutWhatsapp}:</strong> +62 853-4189-9229<br>
                <strong>${texts.aboutEmail}:</strong> info@femmeiacloth.com<br>
                <strong>${texts.aboutAddress}:</strong> Makassar, Sulawesi Selatan<br>
                <strong>${texts.aboutHours}:</strong> Senin - Sabtu, 09:00 - 17:00 WITA
            `;
        }
    }
}

// Save Settings to localStorage
function saveSettings() {
    const currentSettings = {
        darkMode: darkModeToggle.checked,
        animations: animationsToggle.checked,
        promoNotifications: promoToggle.checked,
        language: languageSelect.value,
        fontSize: fontSizeSelect.value
    };
    localStorage.setItem('websiteSettings', JSON.stringify(currentSettings));
    applySettings(currentSettings);

    // Show notification based on promo setting if the function exists
    if (promoToggle.checked && typeof showNotification === 'function') {
        showNotification(currentSettings.language === 'id' ? websiteTexts.id.promoEnabledNotification : websiteTexts.en.promoEnabledNotification);
    }
}

// Open Settings Modal
function openSettingsModal() {
    if (settingsModal) settingsModal.style.display = 'block';
}

// Close Settings Modal
function closeSettingsModal() {
    if (settingsModal) settingsModal.style.display = 'none';
}

// Reset Settings to Default
function resetSettings() {
    localStorage.removeItem('websiteSettings');
    const settings = defaultSettings;
    applySettings(settings);
    saveSettings();
    if (typeof showNotification === 'function') {
        showNotification(settings.language === 'id' ? websiteTexts.id.resetSuccessNotification : websiteTexts.en.resetSuccessNotification);
    }
}

// Event Listeners
if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
}

if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', closeSettingsModal);
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('change', saveSettings);
}

if (animationsToggle) {
    animationsToggle.addEventListener('change', saveSettings);
}

if (promoToggle) {
    promoToggle.addEventListener('change', saveSettings);
}

if (languageSelect) {
    languageSelect.addEventListener('change', saveSettings);
}

if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', saveSettings);
}

if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
}

// Close modal if clicked outside
window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});

// Handle escape key to close modal
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsModal && settingsModal.style.display === 'block') {
        closeSettingsModal();
    }
});

// Initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();
    applySettings(settings);
});

// modal download app

function showGuide(platform) {
  const modal = document.getElementById('modalGuide');
  modal.classList.remove('closing');
  modal.classList.add('active');
  let title = document.getElementById('modalTitle');
  let steps = document.getElementById('modalSteps');
  if(platform === 'android') {
    title.innerText = "Cara Install di Android";
    steps.innerHTML = `
      <li>Buka website ini di browser Chrome.</li>
      <li>Tap menu (titik tiga kanan atas).</li>
      <li>Pilih <b>"Add to Home screen"</b> / <b>"Tambahkan ke layar utama"</b>.</li>
      <li>Ikuti instruksi hingga FemmeiaCloth muncul di layar utama.</li>
    `;
  } else {
    title.innerText = "Cara Install di iOS (iPhone/iPad)";
    steps.innerHTML = `
      <li>Buka website ini di Safari.</li>
      <li>Tap ikon <b>Share</b> (kotak dengan panah ke atas).</li>
      <li>Pilih <b>"Add to Home Screen"</b> / <b>"Tambahkan ke Layar Utama"</b>.</li>
      <li>Ikuti instruksi hingga FemmeiaCloth muncul di layar utama.</li>
    `;
  }
}
function closeGuide() {
  const modal = document.getElementById('modalGuide');
  modal.classList.add('closing');
  setTimeout(() => {
    modal.classList.remove('active', 'closing');
  }, 380);
}
document.getElementById('modalGuide').addEventListener('click', function(e) {
  if(e.target === this) closeGuide();
});

