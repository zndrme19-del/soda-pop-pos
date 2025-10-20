// Import necessary modules
const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize the express app
const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// --- MIDDLEWARE ---
app.use(express.json()); 
app.use(express.static('public')); 

// --- HELPER FUNCTIONS (Defined only ONCE) ---
const readData = () => {
    const rawData = fs.readFileSync(DB_FILE);
    return JSON.parse(rawData);
};
const writeData = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API ROUTES FOR MENU ---
app.get('/api/menu', (req, res) => {
    const data = readData();
    res.json(data.menu);
});
app.post('/api/menu', (req, res) => {
    const data = readData();
    const newItem = req.body;
    newItem.id = data.menu.length > 0 ? Math.max(...data.menu.map(item => item.id)) + 1 : 1;
    data.menu.push(newItem);
    writeData(data);
    res.status(201).json(newItem);
});
app.put('/api/menu/:id', (req, res) => {
    const data = readData();
    const itemId = parseInt(req.params.id);
    const updatedItem = req.body;
    const itemIndex = data.menu.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        data.menu[itemIndex] = { ...data.menu[itemIndex], ...updatedItem, id: itemId };
        writeData(data);
        res.json(data.menu[itemIndex]);
    } else {
        res.status(404).send('Item not found');
    }
});
app.delete('/api/menu/:id', (req, res) => {
    const data = readData();
    const itemId = parseInt(req.params.id);
    const initialLength = data.menu.length;
    data.menu = data.menu.filter(item => item.id !== itemId);
    if(data.menu.length < initialLength) {
        writeData(data);
        res.status(204).send();
    } else {
        res.status(404).send('Item not found');
    }
});

// --- API ROUTES FOR ORDERS ---
app.get('/api/orders', (req, res) => {
    const data = readData();
    res.json(data.orders);
});
app.post('/api/orders', (req, res) => {
    const data = readData();
    const newOrder = req.body;
    newOrder.id = data.orders.length > 0 ? Math.max(...data.orders.map(o => o.id)) + 1 : 1;
    data.orders.push(newOrder);
    writeData(data);
    res.status(201).json(newOrder);
});
app.put('/api/orders/:id/finish', (req, res) => {
    const data = readData();
    const orderId = parseInt(req.params.id);
    const orderIndex = data.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        data.orders[orderIndex].status = 'finished';
        writeData(data);
        res.json(data.orders[orderIndex]);
    } else {
        res.status(404).send('Order not found');
    }
});

// --- API ROUTES FOR CATEGORIES ---
app.get('/api/categories', (req, res) => {
    const data = readData();
    res.json(data.categories);
});
app.post('/api/categories', (req, res) => {
    const data = readData();
    const { name, type } = req.body;
    if (!name || !type) {
        return res.status(400).send('Category name and type are required.');
    }
    const newCategory = {
        id: data.categories.length > 0 ? Math.max(...data.categories.map(c => c.id)) + 1 : 1,
        name: name,
        type: type
    };
    data.categories.push(newCategory);
    writeData(data);
    res.status(201).json(newCategory);
});
app.delete('/api/categories/:id', (req, res) => {
    const data = readData();
    const categoryId = parseInt(req.params.id);
    const initialLength = data.categories.length;
    data.categories = data.categories.filter(c => c.id !== categoryId);
    data.menu.forEach(item => {
        if (item.categoryId === categoryId) {
            item.categoryId = null;
        }
    });
    if (data.categories.length < initialLength) {
        writeData(data);
        res.status(204).send();
    } else {
        res.status(404).send('Category not found');
    }
});

// --- API ROUTES FOR SALES HISTORY ---
app.get('/api/sales/history', (req, res) => {
    const data = readData();
    res.json(data.salesHistory || []);
});
app.post('/api/sales/reset', (req, res) => {
    const data = readData();
    const finishedOrders = data.orders.filter(o => o.status === 'finished');
    if (finishedOrders.length > 0) {
        const total = finishedOrders.reduce((sum, order) => sum + order.total, 0);
        const today = new Date().toISOString();
        const historyEntry = { date: today, total: total, orders: finishedOrders };
        if (!data.salesHistory) {
            data.salesHistory = [];
        }
        data.salesHistory.push(historyEntry);
    }
    data.orders = data.orders.filter(o => o.status === 'pending');
    writeData(data);
    res.status(200).json({ message: 'Sales reset successfully.' });
});

// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});