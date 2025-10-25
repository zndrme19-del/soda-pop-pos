document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & DOM REFERENCES ---
    let menu = [], categories = [], orders = [], salesHistory = [], currentOrder = [];
    
    const pages = document.querySelectorAll('.page');
    const bottomNavLinks = document.querySelectorAll('.nav-link');
    const posMenuItemsContainer = document.getElementById('menu-items-pos');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const resetDayBtn = document.getElementById('reset-day-btn');
    const inventoryMenuItemsContainer = document.getElementById('menu-items-inventory');
    const addItemBtn = document.getElementById('add-item-btn');
    const pendingOrdersContainer = document.getElementById('pending-orders-container');
    const finishedOrdersContainer = document.getElementById('finished-orders-container');
    const totalSalesTodayEl = document.getElementById('total-sales-today');
    const salesHistoryContainer = document.getElementById('sales-history-container');
    const cartModal = document.getElementById('cart-modal');
    const cartFab = document.getElementById('cart-fab');
    const cartItemCount = document.getElementById('cart-item-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const cartModalCloseBtn = cartModal.querySelector('.close-button');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const itemModal = document.getElementById('menu-modal');
    const itemModalCloseBtn = itemModal.querySelector('.close-button');
    const menuItemForm = document.getElementById('menu-item-form');
    const modalTitle = document.getElementById('modal-title');
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const itemCategorySelect = document.getElementById('item-category');
    const priceInputsContainer = document.getElementById('price-inputs-container');
    const deleteItemBtn = document.getElementById('delete-item-btn');
    const categoryModal = document.getElementById('category-modal');
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const categoryModalCloseBtn = categoryModal.querySelector('.close-button');
    const categoryManagerList = document.getElementById('category-manager-list');
    const addCategoryFormModal = document.getElementById('add-category-form-modal');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const newCategoryTypeSelect = document.getElementById('new-category-type');
    const sizeModal = document.getElementById('size-modal');
    const sizeModalTitle = document.getElementById('size-modal-title');
    const sizeOptionsContainer = document.getElementById('size-options');
    const sizeModalCloseBtn = sizeModal.querySelector('.close-button');

    const fetchData = async () => {
        try {
            const [menuRes, catRes, ordRes, histRes] = await Promise.all([
                fetch('/api/menu'), fetch('/api/categories'), fetch('/api/orders'), fetch('/api/sales/history')
            ]);
            menu = await menuRes.json();
            categories = await catRes.json();
            orders = await ordRes.json();
            salesHistory = await histRes.json();
            renderAll();
        } catch (error) { console.error("Failed to fetch data:", error); }
    };

    const renderAll = () => {
        renderPosMenu();
        renderInventoryMenu();
        renderCategoryFilters();
        renderOrdersPage();
        renderCart();
        renderHistoryPage();
    };

    const renderPosMenu = (filterCategoryId = null) => {
        posMenuItemsContainer.innerHTML = '';
        const itemsToDisplay = filterCategoryId ? menu.filter(item => item.categoryId === filterCategoryId) : menu;
        itemsToDisplay.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item';
            itemEl.textContent = item.name;
            itemEl.dataset.id = item.id;
            posMenuItemsContainer.appendChild(itemEl);
        });
    };
    
    const renderInventoryMenu = () => {
        inventoryMenuItemsContainer.innerHTML = '';
        menu.forEach(item => {
            const category = categories.find(c => c.id === item.categoryId);
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            itemEl.dataset.id = item.id;
            itemEl.innerHTML = `<strong>${item.name}</strong><p>${category ? category.name : 'Uncategorized'}</p>`;
            inventoryMenuItemsContainer.appendChild(itemEl);
        });
    };

    const renderCategoryFilters = () => {
        categoryFiltersContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            allBtn.classList.add('active');
            renderPosMenu();
        });
        categoryFiltersContainer.appendChild(allBtn);
        categories.forEach(category => {
            const catBtn = document.createElement('button');
            catBtn.className = 'filter-btn';
            catBtn.textContent = category.name;
            catBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                catBtn.classList.add('active');
                renderPosMenu(category.id);
            });
            categoryFiltersContainer.appendChild(catBtn);
        });
    };

    const renderCart = () => {
        const totalItems = currentOrder.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems === 0) {
            cartFab.classList.add('hidden');
            cartModal.style.display = 'none';
            return;
        }
        cartItemCount.textContent = totalItems;
        cartFab.classList.remove('hidden');
        cartItemsContainer.innerHTML = '';
        let total = 0;
        currentOrder.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            const itemName = item.size !== 'default' ? `${item.name} (${item.size})` : item.name;
            itemEl.innerHTML = `<div class="cart-item-details"><span class="cart-item-name">${itemName}</span><span class="cart-item-price">₱${item.price.toFixed(2)} each</span></div><div class="cart-item-controls"><button class="quantity-btn" data-cart-id="${item.cartId}" data-action="decrease">-</button><span class="item-quantity">${item.quantity}</span><button class="quantity-btn" data-cart-id="${item.cartId}" data-action="increase">+</button></div>`;
            cartItemsContainer.appendChild(itemEl);
            total += item.price * item.quantity;
        });
        cartTotalEl.textContent = total.toFixed(2);
        placeOrderBtn.disabled = false;
    };

    const renderOrdersPage = () => {
        pendingOrdersContainer.innerHTML = '';
        finishedOrdersContainer.innerHTML = '';
        let totalSales = 0;
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = `order-card ${order.status}`;
            const itemsHtml = order.items.map(item => {
                const itemName = item.size !== 'default' ? `${item.name} (${item.size})` : `${item.name}`;
                const quantity = item.quantity > 1 ? ` x${item.quantity}` : '';
                return `<li>${itemName}${quantity}</li>`;
            }).join('');
            orderCard.innerHTML = `<div class="order-card-header"><span>Order #${order.id}</span><span>₱${order.total.toFixed(2)}</span></div><ul class="order-card-items">${itemsHtml}</ul>${order.status === 'pending' ? `<div class="order-card-actions"><button class="btn-primary btn-success btn-finish" data-id="${order.id}">Mark as Finished</button></div>` : ''}`;
            if (order.status === 'pending') {
                pendingOrdersContainer.appendChild(orderCard);
            } else {
                finishedOrdersContainer.appendChild(orderCard);
                totalSales += order.total;
            }
        });
        if (totalSalesTodayEl) totalSalesTodayEl.textContent = `₱${totalSales.toFixed(2)}`;
    };

    const renderHistoryPage = () => {
        salesHistoryContainer.innerHTML = '';
        if (salesHistory.length === 0) {
            salesHistoryContainer.innerHTML = '<p>No sales history found.</p>';
            return;
        }
        salesHistory.slice().reverse().forEach(record => {
            const recordCard = document.createElement('div');
            recordCard.className = 'history-card';
            const recordDate = new Date(record.date);
            const formattedDate = recordDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            recordCard.innerHTML = `<div class="history-card-header"><span>Total Sales</span><span>₱${record.total.toFixed(2)}</span></div><div class="history-card-date">${formattedDate}</div>`;
            salesHistoryContainer.appendChild(recordCard);
        });
    };

    const populateCategoryDropdown = (selectedCategoryId = null) => {
        itemCategorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (category.id === selectedCategoryId) option.selected = true;
            itemCategorySelect.appendChild(option);
        });
        if (itemCategorySelect.options.length > 0) updatePriceInputs();
    };

    const renderCategoryManagerModal = () => {
        categoryManagerList.innerHTML = '';
        categories.forEach(category => {
            const catEl = document.createElement('div');
            catEl.className = 'inventory-item';
            catEl.innerHTML = `<span>${category.name} (${category.type})</span><button class="delete-cat-btn" data-id="${category.id}">🗑️</button>`;
            categoryManagerList.appendChild(catEl);
        });
    };
    
    const updatePriceInputs = (item = null) => {
        const categoryId = parseInt(itemCategorySelect.value);
        const category = categories.find(c => c.id === categoryId);
        priceInputsContainer.innerHTML = '';
        if (category && category.type === 'drink') {
            priceInputsContainer.innerHTML = `<label for="price-16oz">Price (16oz):</label><input type="number" id="price-16oz" min="0" step="0.01" required value="${item && item.prices['16oz'] ? item.prices['16oz'] : ''}"><label for="price-22oz">Price (22oz):</label><input type="number" id="price-22oz" min="0" step="0.01" required value="${item && item.prices['22oz'] ? item.prices['22oz'] : ''}">`;
        } else {
            priceInputsContainer.innerHTML = `<label for="price-default">Price:</label><input type="number" id="price-default" min="0" step="0.01" required value="${item && item.prices['default'] ? item.prices['default'] : ''}">`;
        }
    };

    const showPage = (pageId) => {
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        bottomNavLinks.forEach(link => link.classList.toggle('active', link.hash === `#${pageId}`));
    };

    const clearCart = () => { currentOrder = []; renderCart(); };

    const handlePosItemClick = (itemId) => {
        const item = menu.find(i => i.id === itemId);
        if (!item) return;
        const category = categories.find(c => c.id === item.categoryId);
        if (!category || !category.type) { addItemToOrder(item, 'default'); return; }
        if (category.type === 'drink') openSizeSelectionModal(item);
        else addItemToOrder(item, 'default');
    };

    const openSizeSelectionModal = (item) => {
        sizeModalTitle.textContent = item.name;
        sizeOptionsContainer.innerHTML = '';
        for (const size in item.prices) {
            const price = item.prices[size];
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'size-btn';
            sizeBtn.textContent = `${size} - ₱${price.toFixed(2)}`;
            sizeBtn.addEventListener('click', () => {
                addItemToOrder(item, size);
                sizeModal.style.display = 'none';
            });
            sizeOptionsContainer.appendChild(sizeBtn);
        }
        sizeModal.style.display = 'block';
    };

    const addItemToOrder = (item, size) => {
        const price = item.prices[size];
        if (price === undefined) return;
        const cartId = `${item.id}-${size}`;
        const existingItem = currentOrder.find(orderItem => orderItem.cartId === cartId);
        if (existingItem) existingItem.quantity++;
        else currentOrder.push({ cartId, id: item.id, name: item.name, size, price, quantity: 1 });
        renderCart();
    };

    const placeOrder = async () => {
        if (currentOrder.length === 0) return;
        const orderData = { items: currentOrder, total: currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0), status: 'pending' };
        const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
        if (response.ok) {
            currentOrder = [];
            await fetchData();
            showPage('orders-page');
        }
    };
    
    const markOrderAsFinished = async (orderId) => {
        const response = await fetch(`/api/orders/${orderId}/finish`, { method: 'PUT' });
        if (response.ok) await fetchData();
    };

    const resetDay = async () => {
        const finishedOrders = orders.filter(o => o.status === 'finished');
        if (finishedOrders.length === 0) {
            alert('No finished orders to archive.');
            return;
        }
        if (confirm('Are you sure you want to end the day?')) {
            await fetch('/api/sales/reset', { method: 'POST' });
            await fetchData();
            showPage('pos-page');
        }
    };

    const openItemModalForNew = () => {
        modalTitle.textContent = 'Add Menu Item';
        menuItemForm.reset();
        itemIdInput.value = '';
        populateCategoryDropdown();
        deleteItemBtn.style.display = 'none';
        itemModal.style.display = 'block';
    };

    const openItemModalForEdit = (itemId) => {
        const item = menu.find(i => i.id === itemId);
        if (item) {
            modalTitle.textContent = 'Edit Menu Item';
            itemIdInput.value = item.id;
            itemNameInput.value = item.name;
            populateCategoryDropdown(item.categoryId);
            updatePriceInputs(item);
            deleteItemBtn.style.display = 'block';
            itemModal.style.display = 'block';
        }
    };
    
    const saveMenuItem = async (e) => {
        e.preventDefault();
        const id = itemIdInput.value;
        const categoryId = parseInt(itemCategorySelect.value);
        const category = categories.find(c => c.id === categoryId);
        let prices = {};
        if (category && category.type === 'drink') {
            prices['16oz'] = parseFloat(document.getElementById('price-16oz').value);
            prices['22oz'] = parseFloat(document.getElementById('price-22oz').value);
        } else {
            prices['default'] = parseFloat(document.getElementById('price-default').value);
        }
        const itemData = { name: itemNameInput.value, categoryId, prices };
        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `/api/menu/${id}` : '/api/menu';
        await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemData) });
        itemModal.style.display = 'none';
        fetchData();
    };

    const deleteMenuItem = async (itemId) => {
        if (confirm('Are you sure you want to permanently delete this menu item?')) {
            await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
            itemModal.style.display = 'none';
            fetchData();
        }
    };
    
    const saveCategory = async (e) => {
        e.preventDefault();
        const newCategory = { name: newCategoryNameInput.value, type: newCategoryTypeSelect.value };
        await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCategory) });
        addCategoryFormModal.reset();
        await fetchData();
        renderCategoryManagerModal();
    };

    const deleteCategory = async (categoryId) => {
        if (confirm('Are you sure you want to delete this category?')) {
            await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
            await fetchData();
            renderCategoryManagerModal();
        }
    };

    bottomNavLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); showPage(link.hash.substring(1)); }); });
    posMenuItemsContainer.addEventListener('click', (e) => { if (e.target.closest('.menu-item')) handlePosItemClick(parseInt(e.target.closest('.menu-item').dataset.id)); });
    addItemBtn.addEventListener('click', openItemModalForNew);
    itemModalCloseBtn.addEventListener('click', () => itemModal.style.display = 'none');
    itemCategorySelect.addEventListener('change', () => updatePriceInputs(null));
    menuItemForm.addEventListener('submit', saveMenuItem);
    inventoryMenuItemsContainer.addEventListener('click', (e) => {
        const itemCard = e.target.closest('.inventory-item');
        if (itemCard) openItemModalForEdit(parseInt(itemCard.dataset.id));
    });
    deleteItemBtn.addEventListener('click', () => {
        const itemId = parseInt(itemIdInput.value);
        if (itemId) deleteMenuItem(itemId);
    });
    manageCategoriesBtn.addEventListener('click', () => { renderCategoryManagerModal(); categoryModal.style.display = 'block'; });
    categoryModalCloseBtn.addEventListener('click', () => { categoryModal.style.display = 'none'; populateCategoryDropdown(); });
    addCategoryFormModal.addEventListener('submit', saveCategory);
    categoryManagerList.addEventListener('click', (e) => { if(e.target.closest('.delete-cat-btn')) deleteCategory(parseInt(e.target.closest('.delete-cat-btn').dataset.id)); });
    sizeModalCloseBtn.addEventListener('click', () => sizeModal.style.display = 'none');
    placeOrderBtn.addEventListener('click', placeOrder);
    resetDayBtn.addEventListener('click', resetDay);
    cartFab.addEventListener('click', () => { cartModal.style.display = 'block'; });
    cartModalCloseBtn.addEventListener('click', () => { cartModal.style.display = 'none'; });
    clearCartBtn.addEventListener('click', clearCart);
    document.body.addEventListener('click', e => { if (e.target.classList.contains('btn-finish')) markOrderAsFinished(parseInt(e.target.dataset.id)); });
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.quantity-btn');
        if (!target) return;
        const cartId = target.dataset.cartId;
        const action = target.dataset.action;
        const itemInCart = currentOrder.find(item => item.cartId === cartId);
        if (!itemInCart) return;
        if (action === 'increase') itemInCart.quantity++;
        else if (action === 'decrease') {
            itemInCart.quantity--;
            if (itemInCart.quantity === 0) currentOrder = currentOrder.filter(item => item.cartId !== cartId);
        }
        renderCart();
    });
    window.addEventListener('click', (e) => {
        if (e.target == itemModal || e.target == sizeModal || e.target == cartModal) {
            e.target.style.display = 'none';
        }
        if (e.target == categoryModal) { 
            categoryModal.style.display = 'none'; 
            populateCategoryDropdown(); 
        }
    });
    
    const initialize = () => { fetchData(); showPage('pos-page'); };
    initialize();
});

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & DOM REFERENCES ---

    const calculatorFab = document.getElementById('calculator-fab'); // New
    const calculatorModal = document.getElementById('calculator-modal'); // New
    const calcDisplay = document.getElementById('calc-display'); // New
    const calcButtons = calculatorModal.querySelector('.calc-buttons'); // New
    const calculatorModalCloseBtn = calculatorModal.querySelector('.close-button'); // New

    // --- Calculator State ---
    let currentInput = '';
    let previousInput = '';
    let operator = null;

    // --- CALCULATOR LOGIC ---
    const updateDisplay = () => {
        calcDisplay.value = currentInput || '0';
    };

    const handleNumber = (number) => {
        if (currentInput === '0' && number === '0') return;
        if (number === '.' && currentInput.includes('.')) return;
        currentInput = currentInput + number;
    };

    const handleOperator = (op) => {
        if (currentInput === '' && previousInput === '') return;
        if (currentInput !== '') {
            if (previousInput !== '') {
                // Perform calculation if there's a pending operation
                calculate();
            }
            previousInput = currentInput;
            currentInput = '';
        }
        operator = op;
    };

    const calculate = () => {
        if (previousInput === '' || currentInput === '' || operator === null) return;
        const prev = parseFloat(previousInput);
        const curr = parseFloat(currentInput);
        let result;

        switch (operator) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '*': result = prev * curr; break;
            case '/': result = prev / curr; break;
            default: return;
        }
        currentInput = result.toString();
        operator = null;
        previousInput = '';
    };

    const clearCalculator = () => {
        currentInput = '';
        previousInput = '';
        operator = null;
        updateDisplay();
    };

    const handleCalcButtonClick = (event) => {
        const button = event.target;
        if (!button.matches('button')) return;

        const value = button.textContent;

        if (button.classList.contains('operator')) {
            handleOperator(value);
        } else if (button.classList.contains('equals')) {
            calculate();
        } else if (button.classList.contains('clear')) {
            clearCalculator();
        } else { // Number or decimal point
            handleNumber(value);
        }
        updateDisplay();
    };

    // --- EVENT LISTENERS ---
    // ... (keep all existing listeners)
    calculatorFab.addEventListener('click', () => {
        calculatorModal.style.display = 'block';
        clearCalculator(); // Reset calculator when opened
    });
    calculatorModalCloseBtn.addEventListener('click', () => {
        calculatorModal.style.display = 'none';
    });
    calcButtons.addEventListener('click', handleCalcButtonClick);

    // Update window click listener to include calculator modal
    window.addEventListener('click', (e) => {
        if (e.target == itemModal || e.target == sizeModal || e.target == cartModal || e.target == calculatorModal) { // Added calculatorModal
            e.target.style.display = 'none';
        }
        if (e.target == categoryModal) { 
            categoryModal.style.display = 'none'; 
            populateCategoryDropdown(); 
        }
    });

    // --- INITIALIZE ---
    // ... (keep existing initialize function)
});