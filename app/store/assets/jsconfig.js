<script>
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
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        // Sample products data based on the provided image
        const products = [
            {
                id: 1,
                name: "Hijab Paris",
                price: 35000,
                category: "hijab",
                image: "https://raw.githubusercontent.com/gunadizz/FemmeiaCloth/refs/heads/main/IMG_3593.jpeg",
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
            },
            {
                id: 2,
                name: "Pashmina Kaos",
                price: 55000,
                category: "pashmina",
                image: "https://raw.githubusercontent.com/gunadizz/FemmeiaCloth/refs/heads/main/IMG_3593.jpeg",
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
                name: "Premium Inner Ninja",
                price: 25000,
                category: "inner",
                image: "https://raw.githubusercontent.com/gunadizz/FemmeiaCloth/refs/heads/main/IMG_3593.jpeg",
                colors: ["Hitam", "Putih", "Cream", "Mocha", "Abu-abu"],
                colorCodes: {
                    "Hitam": "#000000",
                    "Putih": "#FFFFFF",
                    "Cream": "#FFFDD0",
                    "Mocha": "#A38068",
                    "Abu-abu": "#808080"
                },
                description: "Inner Ninja premium, adem, nyaman dipakai seharian."
            }
        ];

        // Checkout form color options and prices
        const colorHexMap = {
            "Hitam": "#191919", "Stone": "#b8b6b1", "Abu Ash": "#a7a6a6", "Soft Latte": "#e5ceb8",
            "Cream": "#fff6cf", "Vanilla": "#fbe7a2", "Biskuit": "#e2c39a", "Dusty Rose": "#e4aeb1",
            "Dark Blue": "#222e50", "Dark Choco": "#513c29", "Burgundy": "#7d2636", "Maroon": "#781f29",
            "Dark Grey": "#44474b", "Silver": "#c0c0c0", "Khaky": "#bdb76b", "Oat": "#e5d1b8",
            "BW": "#f8f8f8", "Khaky Putty": "#cabfa0", "Navy": "#2a3759",
            "Putih": "#FFFFFF", "Abu-abu": "#808080", "Pink": "#FFC0CB", "Coklat": "#964B00",
            "Beige": "#F5F5DC", "Mauve": "#E0B0FF", "Lilac": "#C8A2C8", "Hijau": "#00FF00", "Olive": "#808000",
            "Mocha": "#A38068"
        };

        const warnaOptions = {
            "Hijab Paris - 35.000": ["Hitam", "Putih", "Abu-abu", "Navy", "Pink", "Cream"],
            "Pashmina Kaos - 55.000": ["Hitam", "Coklat", "Beige", "Mauve", "Lilac", "Hijau", "Olive"],
            "Premium Inner Ninja - 25.000": ["Hitam", "Putih", "Cream", "Mocha", "Abu-abu"]
        };

        const hargaProduk = {
            "Hijab Paris - 35.000": 35000,
            "Pashmina Kaos - 55.000": 55000,
            "Premium Inner Ninja - 25.000": 25000
        };

        const PROMO_CODE = "femmeia10";
        const PROMO_DISKON = 0.10;

        // Global state
        let currentUser = null;
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let currentFilter = 'all';
        let selectedProduct = null;
        let selectedColor = null;

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            loadProducts();
            updateCartBadge();
            initializeCheckoutForm();
        });

        // Mobile menu toggle
        function toggleMobileMenu() {
            const navLinks = document.getElementById('navLinks');
            navLinks.classList.toggle('active');
        }

        // Authentication functions
        function showLogin() {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
        }

        function showRegister() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        }

        async function login(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Save user to Firebase
                try {
                    await db.collection('users').doc(user.id.toString()).set({
                        username: user.username,
                        email: user.email,
                        avatar: user.avatar,
                        lastLogin: new Date()
                    });
                } catch (error) {
                    console.log('Firebase save error:', error);
                }
                
                showMainApp();
                showSection('home');
                showNotification('Berhasil masuk! Selamat datang kembali.');
            } else {
                showNotification('Email atau kata sandi tidak valid', true);
            }
        }

        async function register(event) {
            event.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.find(u => u.email === email)) {
                showNotification('Email sudah terdaftar', true);
                return;
            }

            const newUser = {
                id: Date.now(),
                username,
                email,
                password,
                avatar: 'https://raw.githubusercontent.com/gunadizz/FemmeiaCloth/refs/heads/main/IMG_3593.jpeg'
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            currentUser = newUser;
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            // Save user to Firebase
            try {
                await db.collection('users').doc(newUser.id.toString()).set({
                    username: newUser.username,
                    email: newUser.email,
                    avatar: newUser.avatar,
                    createdAt: new Date()
                });
            } catch (error) {
                console.log('Firebase save error:', error);
            }
            
            showMainApp();
            showSection('home');
            showNotification('Akun berhasil dibuat! Selamat datang.');
        }

        function logout() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            document.getElementById('authSection').classList.add('active');
            document.querySelectorAll('.page-section:not(#authSection)').forEach(section => {
                section.classList.remove('active');
            });
            updateNavLinks();
            showNotification('Anda telah keluar dari akun');
        }

        function checkAuth() {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                showMainApp();
                showSection('home');
            }
            updateNavLinks();
        }

        function showMainApp() {
            document.getElementById('authSection').classList.remove('active');
            loadProfile();
            updateNavLinks();
        }

        // Update navigation links based on authentication state
        function updateNavLinks() {
            const navLinks = document.getElementById('navLinks');
            
            if (currentUser) {
                // User is logged in
                navLinks.innerHTML = `
                    <li><a href="#" onclick="showSection('home')">Beranda</a></li>
                    <li><a href="#" onclick="showSection('products')">Produk</a></li>
                    <li><a href="#" onclick="showSection('cart')">Keranjang <span class="cart-badge" id="cartBadge">0</span></a></li>
                    <li><a href="#" onclick="showSection('profile')">Profil</a></li>
                    <li><a href="#" onclick="logout()">Keluar</a></li>
                `;
            } else {
                // User is not logged in
                navLinks.innerHTML = `
                    <li><a href="#" onclick="showSection('home')">Beranda</a></li>
                    <li><a href="#" onclick="showSection('products')">Produk</a></li>
                    <li><a href="#" onclick="showSection('cart')">Keranjang <span class="cart-badge" id="cartBadge">0</span></a></li>
                    <li><a href="#" onclick="document.getElementById('authSection').classList.add('active')">Masuk</a></li>
                `;
            }
            
            updateCartBadge();
        }

        // Navigation
        function showSection(sectionName) {
            // Check if user is trying to access profile or checkout without being logged in
            if ((sectionName === 'profile' || sectionName === 'checkout') && !currentUser) {
                document.getElementById('authSection').classList.add('active');
                showNotification('Silakan masuk terlebih dahulu', true);
                return;
            }
            
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionName + 'Section').classList.add('active');

            // Close mobile menu when navigating
            document.getElementById('navLinks').classList.remove('active');

            if (sectionName === 'cart') {
                loadCart();
            } else if (sectionName === 'checkout') {
                loadCheckout();
            }
        }

        // Products
        function loadProducts() {
            const grid = document.getElementById('productsGrid');
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
                            ${product.colors.map(color => `
                                <div class="color-option" 
                                    style="background-color: ${product.colorCodes[color]}" 
                                    title="${color}">
                                </div>
                            `).join('')}
                        </div>
                        <p style="color: #94a3b8; font-size: 0.9rem;">${product.description}</p>
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

        // Format price with thousand separator
        function formatPrice(price) {
            return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }

        // Product Detail Modal
        function showProductDetail(productId) {
            selectedProduct = products.find(p => p.id === productId);
            selectedColor = selectedProduct.colors[0];
            
            const modal = document.getElementById('productModal');
            const productDetail = document.getElementById('productDetail');
            
            productDetail.innerHTML = `
                <div>
                    <img src="${selectedProduct.image}" alt="${selectedProduct.name}" class="product-detail-image">
                </div>
                <div class="product-detail-info">
                    <h2>${selectedProduct.name}</h2>
                    <div class="product-detail-price">Rp ${formatPrice(selectedProduct.price)}</div>
                    <p>${selectedProduct.description}</p>
                    <div class="color-select">
                        <label>Pilih Warna:</label>
                        <select id="colorSelect" onchange="updateSelectedColor()">
                            ${selectedProduct.colors.map(color => `
                                <option value="${color}">${color}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="product-detail-colors">
                        ${selectedProduct.colors.map(color => `
                            <div class="color-option" 
                                style="background-color: ${selectedProduct.colorCodes[color]}" 
                                title="${color}"
                                onclick="selectColor('${color}')">
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn" onclick="addToCart(${selectedProduct.id})">
                        Tambahkan ke Keranjang
                    </button>
                </div>
            `;
            
            modal.style.display = 'block';
        }

        function closeProductModal() {
            document.getElementById('productModal').style.display = 'none';
        }

        function updateSelectedColor() {
            selectedColor = document.getElementById('colorSelect').value;
        }

        function selectColor(color) {
            selectedColor = color;
            document.getElementById('colorSelect').value = color;
        }

        // Cart functions
        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
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
            
            // Show feedback
            showNotification(`${product.name} (${color}) ditambahkan ke keranjang!`);
            
            // Close modal if open
            closeProductModal();
        }

        function updateCartBadge() {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const cartBadge = document.getElementById('cartBadge');
            if (cartBadge) {
                cartBadge.textContent = totalItems;
                
                // Add animation
                cartBadge.classList.remove('pulse');
                void cartBadge.offsetWidth; // Trigger reflow
                cartBadge.classList.add('pulse');
            }
        }

        function loadCart() {
            const cartItems = document.getElementById('cartItems');
            const cartTotal = document.getElementById('cartTotal');

            if (cart.length === 0) {
                cartItems.innerHTML = '<p style="text-align: center; color: #94a3b8;">Keranjang belanja Anda kosong</p>';
                cartTotal.textContent = 'Total: Rp 0';
                return;
            }

            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item fade-in" style="animation-delay: ${index * 0.1}s">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>Rp ${formatPrice(item.price)}</p>
                        <p>Warna: ${item.selectedColor}</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.selectedColor}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.selectedColor}', 1)">+</button>
                    </div>
                    <button class="quantity-btn" onclick="removeFromCart(${item.id}, '${item.selectedColor}')" style="background: #e74c3c;">×</button>
                </div>
            `).join('');

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `Total: Rp ${formatPrice(total)}`;
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
            
            showNotification(`${itemName} dihapus dari keranjang`);
        }

        // Checkout functions
        function loadCheckout() {
            const authWarning = document.getElementById('checkoutAuthWarning');
            const checkoutForm = document.getElementById('checkoutForm');
            
            if (!currentUser) {
                authWarning.style.display = 'block';
                checkoutForm.style.display = 'none';
            } else {
                authWarning.style.display = 'none';
                checkoutForm.style.display = 'block';
                
                // Pre-fill user data
                if (currentUser) {
                    const nameInput = document.querySelector('input[name="nama"]');
                    if (nameInput && !nameInput.value) {
                        nameInput.value = currentUser.username;
                    }
                }
            }
        }

        // Initialize checkout form
        function initializeCheckoutForm() {
            const productType = document.getElementById('productType');
            const warna = document.getElementById('warna');
            const colorPreview = document.getElementById('colorPreview');
            const jumlah = document.querySelector('input[name="jumlah"]');
            const paperbag = document.getElementById('paperbag');
            const totalHarga = document.getElementById('totalHarga');
            const notif = document.getElementById('notif');
            const pesanBtn = document.getElementById('pesanBtn');
            const promoInput = document.getElementById('promoInput');

            if (!productType) return; // Exit if elements don't exist yet

            // Modal animation helpers
            const modalBg = document.getElementById('modalBg');
            const modalContent = document.getElementById('modalContent');
            
            function openModal() {
                modalBg.classList.add('open');
                modalBg.classList.remove('closing');
                setTimeout(() => {
                    modalContent.scrollTop = 0;
                }, 30);
            }
            
            function closeModal() {
                modalBg.classList.add('closing');
                modalBg.classList.remove('open');
                setTimeout(() => {
                    modalBg.classList.remove('closing');
                }, 250);
            }

            // Warna custom select sync
            productType.addEventListener('change', function () {
                const selected = this.value;
                warna.innerHTML = '<option value="">-- Pilih Warna --</option>';
                colorPreview.innerHTML = '';
                if (warnaOptions[selected]) {
                    warnaOptions[selected].forEach(w => {
                        let opt = document.createElement('option');
                        opt.value = w;
                        opt.textContent = w;
                        warna.appendChild(opt);
                    });
                    updateColorPreview(selected, warna.value);
                }
                hitungTotal();
            });

            warna.addEventListener('focus', function () {
                if (!productType.value) {
                    alert("Silakan pilih jenis produk terlebih dahulu.");
                    productType.focus();
                }
            });

            function updateColorPreview(prod, selectedWarna) {
                colorPreview.innerHTML = '';
                if (warnaOptions[prod]) {
                    warnaOptions[prod].forEach(w => {
                        const hex = colorHexMap[w] || '#fff';
                        const dot = document.createElement('span');
                        dot.className = 'color-dot' + (w === selectedWarna ? ' selected' : '');
                        dot.style.background = hex;
                        dot.title = w;
                        dot.onclick = function() {
                            warna.value = w;
                            updateColorPreview(prod, w);
                        };
                        colorPreview.appendChild(dot);
                    });
                    if (selectedWarna) {
                        const label = document.createElement('span');
                        label.className = 'color-label';
                        label.innerText = selectedWarna;
                        colorPreview.appendChild(label);
                    }
                }
            }

            warna.addEventListener('change', function () {
                updateColorPreview(productType.value, warna.value);
            });

            jumlah.addEventListener('input', hitungTotal);
            productType.addEventListener('change', hitungTotal);
            paperbag.addEventListener('change', hitungTotal);
            promoInput.addEventListener('input', hitungTotal);

            function hitungTotal() {
                const prod = productType.value;
                let qty = parseInt(jumlah.value) || 1;
                if (qty < 1) qty = 1;
                let harga = hargaProduk[prod] ? hargaProduk[prod] * qty : 0;
                if (paperbag.value.startsWith('Pakai')) harga += 5000;
                let promoValid = false;
                let promoValue = promoInput.value.trim().toLowerCase();
                if (promoValue === PROMO_CODE) {
                    promoValid = true;
                    harga = Math.floor(harga * (1 - PROMO_DISKON));
                    promoInput.style.borderColor = "#82ca9c";
                } else if (promoValue.length > 0) {
                    promoInput.style.borderColor = "#d16a6a";
                } else {
                    promoInput.style.borderColor = "";
                }
                totalHarga.innerText = `Total: Rp${harga.toLocaleString('id-ID')}` + (promoValid ? " (promo -10%)" : "");
                return harga;
            }

            function resetNotif() { 
                if (notif) notif.innerText = ''; 
            }

            // Order form submission
            document.getElementById('orderForm').addEventListener('submit', async function (e) {
                e.preventDefault();
                resetNotif();
                
                if (!currentUser) {
                    showNotification('Silakan masuk terlebih dahulu', true);
                    return;
                }
                
                const waVal = this.wa.value.trim();
                if (!/^[0-9]{10,15}$/.test(waVal)) {
                    notif.innerText = 'Nomor WhatsApp tidak valid!';
                    this.wa.focus();
                    return;
                }
                
                let promoValue = promoInput.value.trim().toLowerCase();
                if (promoValue.length > 0 && promoValue !== PROMO_CODE) {
                    notif.innerText = 'Kode promo tidak valid! Masukkan: femmeia10';
                    promoInput.focus();
                    promoInput.style.borderColor = "#d16a6a";
                    showNotification('Kode promo salah. Gunakan femmeia10');
                    return;
                }
                
                pesanBtn.disabled = true;
                document.getElementById('loadingText').style.display = 'block';
                
                setTimeout(async () => {
                    document.getElementById('loadingText').style.display = 'none';
                    pesanBtn.disabled = false;
                    
                    const form = new FormData(this);
                    const pesan = [
                        ["Nama", form.get('nama')],
                        ["No WA", form.get('wa')],
                        ["Alamat", form.get('alamat')],
                        ["Produk", form.get('produk')],
                        ["Warna", form.get('warna')],
                        ["Jumlah", form.get('jumlah')],
                        ["Paperbag", form.get('paperbag')],
                        ["Pengiriman", form.get('pengiriman')],
                        ["Pembayaran", form.get('pembayaran')],
                        ["Kode Promo", form.get('promo')],
                        ["Catatan", form.get('catatan')],
                    ];
                    
                    const harga = hitungTotal();
                    
                    // Save order to Firebase
                    try {
                        const orderData = {
                            userId: currentUser.id,
                            customerName: form.get('nama'),
                            whatsapp: form.get('wa'),
                            address: form.get('alamat'),
                            product: form.get('produk'),
                            color: form.get('warna'),
                            quantity: parseInt(form.get('jumlah')),
                            paperBag: form.get('paperbag'),
                            shipping: form.get('pengiriman'),
                            payment: form.get('pembayaran'),
                            promoCode: form.get('promo'),
                            notes: form.get('catatan'),
                            total: harga,
                            createdAt: new Date(),
                            status: 'pending'
                        };
                        
                        await db.collection('orders').add(orderData);
                        console.log('Order saved to Firebase');
                    } catch (error) {
                        console.log('Firebase save error:', error);
                    }
                    
                    const ringkasanList = document.getElementById('ringkasanList');
                    ringkasanList.innerHTML = '';
                    pesan.forEach(([k,v]) => { 
                        if (v) ringkasanList.innerHTML += `<li><strong>${k}:</strong> ${v}</li>`; 
                    });
                    document.getElementById('ringkasanHarga').innerText = `Total: Rp${harga.toLocaleString('id-ID')}` + (promoValue === PROMO_CODE ? " (promo -10%)" : "");
                    
                    openModal();
                    window._ringkasanMsg = `*Form Pemesanan | FemmeiaCloth:*\n\n` +
                        pesan.map(([k,v]) => `${k}: ${v}`).join('\n') +
                        `\nTotal: Rp${harga.toLocaleString('id-ID')}` + (promoValue === PROMO_CODE ? " (promo -10%)" : "");
                }, 650);
            });

            document.getElementById('lanjutWA').onclick = function() {
                closeModal();
                pesanBtn.disabled = false;
                const waNumber = "6287777420644";
                const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(window._ringkasanMsg)}`;
                window.open(url, "_blank");
                showNotification('Pesanan diarahkan ke WhatsApp!');
                notif.innerText = '';
            };

            document.getElementById('batalModal').onclick = function() {
                closeModal();
                pesanBtn.disabled = false;
            };

            productType.dispatchEvent(new Event('change'));
        }

        // Profile functions
        function loadProfile() {
            if (currentUser) {
                document.getElementById('profileUsername').textContent = currentUser.username;
                document.getElementById('profileEmail').textContent = currentUser.email;
                document.getElementById('profileAvatar').src = currentUser.avatar || 'https://raw.githubusercontent.com/gunadizz/FemmeiaCloth/refs/heads/main/IMG_3593.jpeg';
                document.getElementById('editUsername').value = currentUser.username;
                document.getElementById('editEmail').value = currentUser.email;
            }
        }

        function uploadProfilePhoto(event) {
            if (!currentUser) {
                showNotification('Silakan masuk terlebih dahulu', true);
                return;
            }
            
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentUser.avatar = e.target.result;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Update users array
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    const userIndex = users.findIndex(u => u.id === currentUser.id);
                    if (userIndex !== -1) {
                        users[userIndex] = currentUser;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                    
                    loadProfile();
                    showNotification('Foto profil berhasil diperbarui');
                };
                reader.readAsDataURL(file);
            }
        }

        async function updateProfile(event) {
            event.preventDefault();
            
            if (!currentUser) {
                showNotification('Silakan masuk terlebih dahulu', true);
                return;
            }
            
            const username = document.getElementById('editUsername').value;
            const email = document.getElementById('editEmail').value;

            currentUser.username = username;
            currentUser.email = email;
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update users array
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // Update Firebase
            try {
                await db.collection('users').doc(currentUser.id.toString()).update({
                    username: username,
                    email: email,
                    updatedAt: new Date()
                });
            } catch (error) {
                console.log('Firebase update error:', error);
            }
            
            loadProfile();
            showNotification('Profil berhasil diperbarui!');
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
                notification.style.background = '#e74c3c';
            }
            
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('productModal');
            if (event.target == modal) {
                closeProductModal();
            }
        }
    </script>