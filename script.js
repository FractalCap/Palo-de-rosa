document.addEventListener('DOMContentLoaded', function() {
    // --- LÓGICA DEL MENÚ DE NAVEGACIÓN, BÚSQUEDA Y OVERLAY (Elementos) ---
    const menuToggle = document.getElementById('menu-toggle');
    const navCloseBtn = document.getElementById('nav-close-btn');
    const mainNav = document.getElementById('main-nav');
    const overlay = document.getElementById('overlay');
    const body = document.querySelector('body');
    const searchOpenBtn = document.getElementById('search-open-btn');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const searchOverlay = document.getElementById('search-overlay');
    
    // --- LÓGICA DEL CARRITO (Elementos y Estado) ---
    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalPrice = document.getElementById('cart-subtotal-price');
    const cartItemCount = document.getElementById('cart-item-count');
    
    // --- ELEMENTOS DEL MODAL DE CHECKOUT ---
    const checkoutModal = document.getElementById('checkout-modal');
    const btnCheckout = document.getElementById('btn-checkout');
    const checkoutCloseBtn = document.getElementById('checkout-close-btn');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const shippingAddressInput = document.getElementById('shipping-address');
    const addressErrorMsg = document.getElementById('address-error');

    // Vistas del Modal
    const checkoutTitleMain = document.getElementById('checkout-title-main');
    const checkoutFormView = document.getElementById('checkout-form-view');
    const checkoutSuccessView = document.getElementById('checkout-success-view');
    const checkoutStep1 = document.getElementById('checkout-step-1');
    const checkoutStep2 = document.getElementById('checkout-step-2');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- MANEJADORES DE VISIBILIDAD DE PANELES ---
    const openNav = () => mainNav?.classList.add('nav-active');
    const closeNav = () => mainNav?.classList.remove('nav-active');
    const openCart = () => cartSidebar?.classList.add('cart-active');
    const closeCart = () => cartSidebar?.classList.remove('cart-active');
    const openSearch = (e) => {
        if (e) e.preventDefault();
        if (searchOverlay) {
            searchOverlay.classList.add('active');
            setTimeout(() => document.getElementById('search-input').focus(), 400);
        }
    };
    const closeSearch = () => {
        if (searchOverlay) {
            searchOverlay.classList.remove('active');
        }
    };
    
    const closeCheckoutModal = () => {
        if (checkoutModal) {
            checkoutModal.classList.remove('visible');
            setTimeout(() => {
                checkoutTitleMain.textContent = 'Completa tu pedido';
                checkoutFormView.style.display = 'block';
                checkoutSuccessView.style.display = 'none';
                
                checkoutStep1.style.display = 'block';
                checkoutStep2.style.display = 'none';

                const paymentButtons = checkoutFormView.querySelectorAll('.payment-btn');
                paymentButtons.forEach(button => {
                    button.disabled = false;
                    button.textContent = button.dataset.method === 'Contraentrega' ? 'Pagar Contraentrega' : `Pagar con ${button.dataset.method}`;
                });
            }, 300);
        }
    };
    
    const openCheckoutModal = () => checkoutModal?.classList.add('visible');

    const updateOverlayAndScroll = () => {
        const isPanelOpen = mainNav?.classList.contains('nav-active') ||
                            cartSidebar?.classList.contains('cart-active') ||
                            searchOverlay?.classList.contains('active');

        if (isPanelOpen) {
            body?.classList.add('no-scroll');
            overlay?.classList.add('overlay-active');
        } else {
            body?.classList.remove('no-scroll');
            overlay?.classList.remove('overlay-active');
        }
    };
    
    // --- EVENT LISTENERS GENERALES ---
    menuToggle?.addEventListener('click', () => { openNav(); updateOverlayAndScroll(); });
    navCloseBtn?.addEventListener('click', () => { closeNav(); updateOverlayAndScroll(); });
    cartToggle?.addEventListener('click', (e) => { e.preventDefault(); openCart(); updateOverlayAndScroll(); });
    cartCloseBtn?.addEventListener('click', () => { closeCart(); updateOverlayAndScroll(); });
    searchOpenBtn?.addEventListener('click', (e) => { openSearch(e); updateOverlayAndScroll(); });
    searchCloseBtn?.addEventListener('click', () => { closeSearch(); updateOverlayAndScroll(); });
    overlay?.addEventListener('click', () => {
        closeNav();
        closeCart();
        closeSearch();
        updateOverlayAndScroll();
    });

    // --- LÓGICA PARA SUBMENÚS (NUEVO) ---
    document.querySelectorAll('.main-nav .has-submenu > a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const parentLi = link.parentElement;
            parentLi.classList.toggle('active');
            const submenu = parentLi.querySelector('.nav-submenu');
            if (parentLi.classList.contains('active')) {
                submenu.style.maxHeight = submenu.scrollHeight + "px";
            } else {
                submenu.style.maxHeight = null;
            }
        });
    });

    // --- LÓGICA DE BÚSQUEDA (NUEVO) ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    searchForm?.addEventListener('submit', e => {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const searchableElements = document.querySelectorAll('.searchable-content');
        let firstMatch = null;

        searchableElements.forEach(el => {
            el.classList.remove('search-highlight');
            if (!firstMatch && el.textContent.toLowerCase().includes(query)) {
                firstMatch = el;
            }
        });

        if (firstMatch) {
            closeSearch();
            updateOverlayAndScroll();
            setTimeout(() => {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstMatch.classList.add('search-highlight');
                setTimeout(() => {
                    firstMatch.classList.remove('search-highlight');
                }, 2500);
            }, 400);
        } else {
            searchInput.classList.add('not-found');
            setTimeout(() => {
                searchInput.classList.remove('not-found');
            }, 500);
        }
    });

    // --- EVENT LISTENERS PARA EL MODAL DE CHECKOUT ---
    btnCheckout?.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Tu carrito está vacío. Añade productos para poder finalizar la compra.');
            return;
        }
        closeCart();
        updateOverlayAndScroll();
        openCheckoutModal();
    });
    checkoutCloseBtn?.addEventListener('click', closeCheckoutModal);
    
    // --- LÓGICA CENTRAL DEL CARRITO DE COMPRAS ---
    const formatPrice = (price) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);

    const updateCart = () => {
        if (!cartItemsContainer) return;

        // --- LÓGICA DE PRECIOS POR MAYOR ---
        const productCounts = cart.reduce((counts, item) => {
            counts[item.baseId] = (counts[item.baseId] || 0) + item.quantity;
            return counts;
        }, {});

        cart.forEach(item => {
            const totalQuantity = productCounts[item.baseId];
            if (totalQuantity >= 3 && item.wholesale_price) {
                item.display_price = item.wholesale_price;
            } else {
                item.display_price = item.unit_price;
            }
        });
        // --- FIN DE LA LÓGICA DE PRECIOS ---

        cartItemsContainer.innerHTML = cart.length === 0
            ? '<p class="cart-empty-msg">Tu carrito está vacío.</p>'
            : cart.map(item => {
                const isWholesale = item.display_price === item.wholesale_price && item.wholesale_price > 0;
                const priceHtml = `
                    <p class="cart-item-price">${formatPrice(item.display_price)}</p>
                    ${isWholesale ? '<p class="cart-item-wholesale-notice">Precio por mayor aplicado</p>' : ''}
                `;
                
                return `
                <div class="cart-item">
                    <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        ${priceHtml}
                        <div class="cart-item-actions">
                            <div class="quantity-control" data-id="${item.id}">
                                <button class="quantity-btn decrease">-</button>
                                <span class="item-quantity">${item.quantity}</span>
                                <button class="quantity-btn increase">+</button>
                            </div>
                            <button class="remove-item-btn" data-id="${item.id}">Eliminar</button>
                        </div>
                    </div>
                </div>
            `}).join('');
        
        const subtotal = cart.reduce((total, item) => total + (item.display_price * item.quantity), 0);
        if (cartSubtotalPrice) cartSubtotalPrice.textContent = formatPrice(subtotal);
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartItemCount) {
            cartItemCount.textContent = totalItems;
            cartItemCount.classList.toggle('visible', totalItems > 0);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    document.addEventListener('addToCart', (e) => {
        const product = e.detail;
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCart();
        openCart();
        updateOverlayAndScroll();
    });

    cartItemsContainer?.addEventListener('click', e => {
       const target = e.target;
       let productId;
       if (target.matches('.increase, .decrease')) {
           productId = target.closest('.quantity-control').dataset.id;
           const item = cart.find(i => i.id === productId);
           if(item) {
               if (target.matches('.increase')) {
                   item.quantity++;
               } else if (item.quantity > 1) {
                   item.quantity--;
               } else {
                   cart = cart.filter(i => i.id !== productId);
               }
           }
       } else if (target.matches('.remove-item-btn')) {
           productId = target.dataset.id;
           cart = cart.filter(i => i.id !== productId);
       }
       if(productId) updateCart();
    });

    // --- LÓGICA DE GOOGLE SHEETS Y WHATSAPP (SOLUCIÓN ACTUALIZADA) ---
    const paymentButtons = checkoutFormView.querySelectorAll('.payment-btn');
    paymentButtons.forEach(button => {
        button.addEventListener('click', () => {
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const shippingAddress = shippingAddressInput.value.trim();
            const paymentMethod = button.dataset.method;

            if (customerName === '' || customerPhone === '' || shippingAddress === '') {
                addressErrorMsg.textContent = 'Por favor, completa todos los campos.';
                addressErrorMsg.classList.add('visible');
                setTimeout(() => addressErrorMsg.classList.remove('visible'), 3000);
                return;
            }
            addressErrorMsg.classList.remove('visible');

            button.textContent = 'Procesando...';
            button.disabled = true;

            const subtotal = cart.reduce((total, item) => total + (item.display_price * item.quantity), 0);
            const cartSummaryForSheet = cart.map(item => `${item.name} (x${item.quantity})`).join('\n');
            const orderId = `PDR-${Date.now()}`;

            const orderData = {
                orderId: orderId,
                timestamp: new Date().toISOString(),
                name: customerName,
                phone: customerPhone,
                address: shippingAddress,
                cartSummary: cartSummaryForSheet,
                subtotal: formatPrice(subtotal),
                paymentMethod: paymentMethod
            };

            const appsScriptUrl = "https://script.google.com/macros/s/AKfycbwabt8ZVx3EkD54Y_DCsyNGjuFxFPITo2lhB-X6HGi9cZLfspib7_gtAUa4JU6xRGE/exec"; 
            
            fetch(appsScriptUrl, {
                method: 'POST',
                body: JSON.stringify(orderData),
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.result === 'success') {
                    let fullWhatsappMessage = `¡Hola Palo de Rosa! 🌸\n\nQuisiera confirmar mi pedido con ID *${orderId}*:\n\n`;
                    fullWhatsappMessage += `*PRODUCTOS:*\n`;
                    cart.forEach(item => {
                        fullWhatsappMessage += `- ${item.name} (x${item.quantity}) - ${formatPrice(item.display_price)} c/u\n`;
                    });
                    fullWhatsappMessage += `\n*SUBTOTAL: ${formatPrice(subtotal)}*\n\n`;
                    fullWhatsappMessage += `*MI DIRECCIÓN DE ENVÍO:*\n${shippingAddress}\n\n`;
                    fullWhatsappMessage += `*MI MÉTODO DE PAGO:* ${paymentMethod}\n\n`;
                    fullWhatsappMessage += `¡Quedo atento/a, gracias!`;
                    
                    checkoutTitleMain.textContent = '¡Pedido Registrado!';
                    checkoutFormView.style.display = 'none';
                    checkoutSuccessView.style.display = 'block';

                    const copyBtn = document.getElementById('copy-order-btn');
                    const openWhatsAppBtn = document.getElementById('open-whatsapp-btn');

                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(fullWhatsappMessage).then(() => {
                            checkoutStep1.style.display = 'none';
                            checkoutStep2.style.display = 'block';
                        }).catch(err => {
                            console.error('Error al copiar el mensaje: ', err);
                            alert('Error al copiar. Por favor, intenta de nuevo.');
                        });
                    };
                    
                    openWhatsAppBtn.onclick = () => {
                        setTimeout(closeCheckoutModal, 500);
                    };
                    
                    cart = [];
                    updateCart();

                } else {
                    throw new Error(data.message || 'El servidor devolvió un error inesperado.');
                }
            })
            .catch(error => {
                console.error('Error al procesar el pedido:', error);
                alert('Hubo un error al procesar tu pedido. Por favor, revisa tu conexión e intenta de nuevo.');
                button.textContent = `Pagar con ${paymentMethod}`;
                button.disabled = false;
            });
        });
    });

    // INICIALIZAR ESTADO AL CARGAR
    updateCart();
});