const dashboardData = {
    stats: {
        totalTransactions: 1847,
        revenue: 342580,
        growthRate: 24
    },
    centres: [
        { name: 'Johannesburg Central', transactions: 542, amount: 98450 },
        { name: 'Pretoria East', transactions: 428, amount: 76230 },
        { name: 'Cape Town South', transactions: 315, amount: 54320 },
        { name: 'Durban Central', transactions: 287, amount: 48900 }
    ],
    priceUpdates: [
        { material: 'Plastic', oldPrice: 10, newPrice: 12, change: 20 },
        { material: 'Metal', oldPrice: 22, newPrice: 25, change: 14 },
        { material: 'Paper', oldPrice: 8, newPrice: 9, change: 12 },
        { material: 'Glass', oldPrice: 15, newPrice: 17, change: 13 }
    ]
};

// Format currency
const formatCurrency = (amount) => {
    return 'R ' + amount.toLocaleString('en-US');
};

// Animate number counting
const animateValue = (element, start, end, duration, prefix = '', suffix = '') => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = prefix + value.toLocaleString('en-US') + suffix;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// Render top performing centres
const renderCentres = () => {
    const container = document.getElementById('centresList');
    container.innerHTML = dashboardData.centres.map(centre => `
        <div class="centre-item">
            <div class="centre-info">
                <h4>${centre.name}</h4>
                <p>${centre.transactions} transactions</p>
            </div>
            <div class="centre-amount">${formatCurrency(centre.amount)}</div>
        </div>
    `).join('');
};

// Render price updates
const renderPriceUpdates = () => {
    const container = document.getElementById('updatesList');
    container.innerHTML = dashboardData.priceUpdates.map(update => `
        <div class="update-item">
            <div class="update-info">
                <h4>${update.material}</h4>
                <p class="price-change">R ${update.oldPrice} → R ${update.newPrice}</p>
            </div>
            <span class="update-badge">+${update.change}%</span>
        </div>
    `).join('');
};

// Initialize dashboard
const initDashboard = () => {
    // Animate stats
    const totalTransElement = document.getElementById('totalTransactions');
    const revenueElement = document.getElementById('revenueSummary');
    const growthElement = document.getElementById('growthRate');
    
    // Animate with counting effect
    setTimeout(() => {
        animateValue(totalTransElement, 0, dashboardData.stats.totalTransactions, 1000);
    }, 100);
    
    setTimeout(() => {
        animateValue(revenueElement, 0, dashboardData.stats.revenue, 1200, 'R ');
    }, 200);
    
    setTimeout(() => {
        growthElement.textContent = `+${dashboardData.stats.growthRate}%`;
        growthElement.style.opacity = '0';
        growthElement.style.transform = 'translateY(10px)';
        growthElement.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            growthElement.style.opacity = '1';
            growthElement.style.transform = 'translateY(0)';
        }, 50);
    }, 400);
    
    // Render lists
    renderCentres();
    renderPriceUpdates();
    
    // Add click handlers for navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Logout handler
    document.querySelector('.logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            alert('Logged out successfully!');
        }
    });
};

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Simulate real-time updates
setInterval(() => {
    // Randomly update transaction count slightly to simulate activity
    const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const currentValue = dashboardData.stats.totalTransactions;
    const newValue = currentValue + variation;
    
    if (newValue !== currentValue) {
        dashboardData.stats.totalTransactions = newValue;
        document.getElementById('totalTransactions').textContent = newValue.toLocaleString('en-US');
    }
}, 30000); // Update every 30 seconds