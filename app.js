import { dataUtils } from './data.js';
import { dbMock } from './dbMock.js';

// --- Dashboard State Controller ---
let rawData = [];
let filteredData = [];

let activeFilters = {
    startDate: '',
    endDate: '',
    region: 'All',
    category: 'All',
    subCategory: 'All',
    productName: 'All',
    customerName: 'All',
    paymentMode: 'All'
};

let activeTab = 'overview';
let activeCharts = {};
let modalChartInstance = null;

// Helper variables for loading state
let loadingOverlay = null;

function showLoading(message = 'Loading...') {
    if (loadingOverlay) return;
    
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: #f3f4f6;
        font-family: 'Outfit', sans-serif;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 48px;
        height: 48px;
        border: 4px solid rgba(59, 130, 246, 0.1);
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 24px;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
    `;

    const text = document.createElement('div');
    text.id = 'loading-text';
    text.textContent = message;
    text.style.cssText = `
        font-size: 1.1rem;
        font-weight: 500;
        letter-spacing: 0.03em;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    `;

    // Ensure spin animation keyframes are defined
    if (!document.getElementById('spin-keyframes')) {
        const styleSheet = document.createElement("style");
        styleSheet.id = 'spin-keyframes';
        styleSheet.innerText = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        `;
        document.head.appendChild(styleSheet);
    }

    loadingOverlay.appendChild(spinner);
    loadingOverlay.appendChild(text);
    document.body.appendChild(loadingOverlay);
    
    // Force reflow and fade in
    loadingOverlay.offsetHeight;
    loadingOverlay.style.opacity = '1';
}

function hideLoading() {
    if (!loadingOverlay) return;
    loadingOverlay.style.opacity = '0';
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.remove();
            loadingOverlay = null;
        }
    }, 300);
}

function showError(message) {
    if (loadingOverlay) {
        // Change overlay content to error
        const spinner = loadingOverlay.querySelector('div');
        if (spinner) spinner.remove();
        
        const text = document.getElementById('loading-text');
        if (text) {
            text.innerHTML = `
                <div style="color: #ef4444; font-size: 1.5rem; margin-bottom: 12px;"><i data-lucide="alert-triangle"></i></div>
                <div style="font-weight: 600; font-size: 1.2rem; color: #fca5a5;">Connection Error</div>
                <div style="font-size: 0.95rem; color: #cbd5e1; margin-top: 8px; max-width: 400px; text-align: center; line-height: 1.5;">${message}</div>
                <button onclick="window.location.reload()" style="margin-top: 24px; padding: 8px 16px; background: #3b82f6; border: none; border-radius: 6px; color: white; cursor: pointer; font-family: 'Outfit'; font-weight: 500; transition: background 0.2s;">Retry Connection</button>
            `;
            // Refresh lucide icons in dynamic markup
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }
}

// --- Theme Helper: Retrieves current colors dynamically ---
function getThemeColors() {
    const isDark = document.body.classList.contains('dark-theme');
    return {
        text: isDark ? '#f3f4f6' : '#0f172a',
        muted: isDark ? '#9ca3af' : '#64748b',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        grid: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
        primary: isDark ? '#3b82f6' : '#2563eb',
        success: isDark ? '#10b981' : '#059669',
        warning: isDark ? '#f59e0b' : '#d97706',
        danger: isDark ? '#ef4444' : '#dc2626',
        info: isDark ? '#6366f1' : '#4f46e5'
    };
}

// --- Initialize App ---
async function init() {
    showLoading('Loading sales metrics from database...');
    try {
        const response = await fetch('/api/sales');
        if (!response.ok) throw new Error('API server returned error');
        rawData = await response.json();
        dbMock.init(rawData);
        populateSlicers();
        bindEvents();
        refreshDashboard();
        renderMap();
    } catch (error) {
        console.error('Failed to load sales data:', error);
        showError('Unable to connect to the BI data server. Please ensure the dev server is running.');
    } finally {
        hideLoading();
    }
}

// --- Populate Slicers Lists dynamically ---
function populateSlicers() {
    const fillDropdown = (elId, list, selectedVal) => {
        const select = document.getElementById(elId);
        if (!select) return;
        
        // Preserve first option ("All")
        select.innerHTML = select.options[0].outerHTML;
        
        list.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            if (val === selectedVal) opt.selected = true;
            select.appendChild(opt);
        });
    };

    fillDropdown('region-filter', dataUtils.getRegionsList(rawData), activeFilters.region);
    fillDropdown('category-filter', dataUtils.getCategoriesList(rawData), activeFilters.category);
    fillDropdown('subcat-filter', dataUtils.getSubCategoriesList(rawData), activeFilters.subCategory);
    fillDropdown('product-filter', dataUtils.getProductsList(rawData), activeFilters.productName);
    fillDropdown('customer-filter', dataUtils.getCustomersList(rawData), activeFilters.customerName);
    fillDropdown('payment-filter', dataUtils.getPaymentModesList(rawData), activeFilters.paymentMode);
    
    // Set default dates
    const dates = rawData.map(d => new Date(d.orderDate));
    const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
    
    document.getElementById('start-date-filter').min = minDate;
    document.getElementById('start-date-filter').max = maxDate;
    document.getElementById('end-date-filter').min = minDate;
    document.getElementById('end-date-filter').max = maxDate;
}

// --- Apply Slicers Filters & Search to rawData ---
function applyFilters() {
    const searchVal = document.getElementById('global-search').value.toLowerCase().trim();
    
    filteredData = rawData.filter(row => {
        // 1. Date Range
        if (activeFilters.startDate && row.orderDate < activeFilters.startDate) return false;
        if (activeFilters.endDate && row.orderDate > activeFilters.endDate) return false;
        
        // 2. Dropdown Slicers
        if (activeFilters.region !== 'All' && row.region !== activeFilters.region) return false;
        if (activeFilters.category !== 'All' && row.category !== activeFilters.category) return false;
        if (activeFilters.subCategory !== 'All' && row.subCategory !== activeFilters.subCategory) return false;
        if (activeFilters.productName !== 'All' && row.productName !== activeFilters.productName) return false;
        if (activeFilters.customerName !== 'All' && row.customerName !== activeFilters.customerName) return false;
        if (activeFilters.paymentMode !== 'All' && row.paymentMode !== activeFilters.paymentMode) return false;
        
        // 3. Search Box Matches
        if (searchVal) {
            const matchesSearch = 
                row.orderID.toLowerCase().includes(searchVal) ||
                row.customerName.toLowerCase().includes(searchVal) ||
                row.productName.toLowerCase().includes(searchVal) ||
                row.state.toLowerCase().includes(searchVal) ||
                row.city.toLowerCase().includes(searchVal) ||
                row.category.toLowerCase().includes(searchVal);
            if (!matchesSearch) return false;
        }
        
        return true;
    });

    renderFilterChips();
}

// --- Render Filter Chips under panel ---
function renderFilterChips() {
    const container = document.getElementById('active-filters-chips');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(activeFilters).forEach(key => {
        const val = activeFilters[key];
        if (!val || val === 'All') return;
        
        const friendlyName = {
            startDate: 'Start Date',
            endDate: 'End Date',
            region: 'Region',
            category: 'Category',
            subCategory: 'Sub-Category',
            productName: 'Product',
            customerName: 'Customer',
            paymentMode: 'Payment'
        }[key];

        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            <span>${friendlyName}: ${val}</span>
            <i data-lucide="x" class="clear-chip-btn" data-filter-key="${key}"></i>
        `;
        container.appendChild(chip);
    });
    
    lucide.createIcons();
    
    // Clear Chip event
    container.querySelectorAll('.clear-chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.target.dataset.filterKey;
            activeFilters[key] = key.endsWith('Date') ? '' : 'All';
            
            // Sync UI select value
            const selectId = {
                startDate: 'start-date-filter',
                endDate: 'end-date-filter',
                region: 'region-filter',
                category: 'category-filter',
                subCategory: 'subcat-filter',
                productName: 'product-filter',
                customerName: 'customer-filter',
                paymentMode: 'payment-filter'
            }[key];
            
            const selectEl = document.getElementById(selectId);
            if (selectEl) selectEl.value = key.endsWith('Date') ? '' : 'All';
            
            refreshDashboard();
        });
    });
}

// --- Refresh Dashboard Metrics & Active Tab Visuals ---
function refreshDashboard() {
    applyFilters();
    updateKPIs();
    renderActiveTabVisuals();
    updateMapDisplay();
}

// --- Update KPI Cards values ---
function updateKPIs() {
    const setKPI = (id, value, prefix = '', suffix = '') => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${prefix}${value}${suffix}`;
    };

    const totalSales = dataUtils.getTotalSales(filteredData);
    const totalRevenue = dataUtils.getTotalRevenue(filteredData);
    const totalProfit = dataUtils.getTotalProfit(filteredData);
    const totalOrders = dataUtils.getTotalOrders(filteredData);
    const totalCustomers = dataUtils.getTotalCustomers(filteredData);
    const qtySold = dataUtils.getQuantitySold(filteredData);
    const aov = dataUtils.getAverageOrderValue(filteredData);
    const margin = dataUtils.getProfitMargin(filteredData);

    setKPI('kpi-sales', Math.round(totalSales).toLocaleString('en-IN'), '₹');
    setKPI('kpi-revenue', Math.round(totalRevenue).toLocaleString('en-IN'), '₹');
    setKPI('kpi-profit', Math.round(totalProfit).toLocaleString('en-IN'), '₹');
    setKPI('kpi-margin', margin.toFixed(1), '', '%');
    setKPI('kpi-orders', totalOrders.toLocaleString('en-IN'));
    setKPI('kpi-customers', totalCustomers.toLocaleString('en-IN'));
    setKPI('kpi-quantity', qtySold.toLocaleString('en-IN'));
    setKPI('kpi-aov', Math.round(aov).toLocaleString('en-IN'), '₹');
}

// --- Render Visuals based on the selected Tab panel ---
function renderActiveTabVisuals() {
    const colors = getThemeColors();
    
    // Destroy previous charts in the current tab context to prevent canvas glitches
    const destroyChart = (chartId) => {
        if (activeCharts[chartId]) {
            activeCharts[chartId].destroy();
            delete activeCharts[chartId];
        }
    };

    if (activeTab === 'overview') {
        renderOverviewTab(colors, destroyChart);
    } else if (activeTab === 'sales') {
        renderSalesTab(colors, destroyChart);
    } else if (activeTab === 'products') {
        renderProductsTab(colors, destroyChart);
    } else if (activeTab === 'regions') {
        renderRegionsTab(colors, destroyChart);
    } else if (activeTab === 'customers') {
        renderCustomersTab(colors, destroyChart);
    } else if (activeTab === 'profit') {
        renderProfitTab(colors, destroyChart);
    } else if (activeTab === 'insights') {
        renderInsightsTab();
    }
}

// --- 1. OVERVIEW TAB VISUALIZATIONS ---
function renderOverviewTab(colors, destroyChart) {
    // 1. Monthly Revenue & Profit Trend
    destroyChart('chart-overview-trend');
    const trendData = dataUtils.getSalesByMonth(filteredData);
    const ctxTrend = document.getElementById('chart-overview-trend').getContext('2d');
    activeCharts['chart-overview-trend'] = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: trendData.map(d => d.month),
            datasets: [
                {
                    label: 'Revenue',
                    data: trendData.map(d => d.revenue),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryGlow,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Profit',
                    data: trendData.map(d => d.profit),
                    borderColor: colors.success,
                    backgroundColor: colors.successGlow,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },
        options: getCommonChartOptions(colors)
    });

    // 2. Revenue Contribution %
    destroyChart('chart-overview-donut');
    const catData = dataUtils.getSalesByCategory(filteredData);
    const ctxDonut = document.getElementById('chart-overview-donut').getContext('2d');
    activeCharts['chart-overview-donut'] = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: catData.map(d => d.category),
            datasets: [{
                data: catData.map(d => d.revenue),
                backgroundColor: [colors.primary, colors.success, colors.warning],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colors.text }
                }
            }
        }
    });

    // 3. Sales by Region Bar Chart
    destroyChart('chart-overview-region');
    const regData = dataUtils.getSalesByRegion(filteredData);
    const ctxRegion = document.getElementById('chart-overview-region').getContext('2d');
    activeCharts['chart-overview-region'] = new Chart(ctxRegion, {
        type: 'bar',
        data: {
            labels: regData.map(d => d.region),
            datasets: [{
                label: 'Sales',
                data: regData.map(d => d.sales),
                backgroundColor: colors.info,
                borderRadius: 6
            }]
        },
        options: getCommonChartOptions(colors, 'y')
    });

    // 4. Transactions Table
    const tbody = document.querySelector('#table-overview-transactions tbody');
    tbody.innerHTML = '';
    
    // Show top 5 high-value transactions
    const topTrans = [...filteredData].sort((a,b) => b.sales - a.sales).slice(0, 5);
    
    if (topTrans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transactions found</td></tr>';
        return;
    }

    topTrans.forEach(row => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.title = 'Double click to view Customer Profile';
        tr.innerHTML = `
            <td>${row.orderID}</td>
            <td>${row.orderDate}</td>
            <td>${row.customerName}</td>
            <td><span class="status-chip completed" style="background:${colors.primaryGlow}; color:${colors.primary};">${row.category}</span></td>
            <td>₹${Math.round(row.sales).toLocaleString('en-IN')}</td>
            <td style="color:${row.profit >= 0 ? colors.success : colors.danger}; font-weight:600;">₹${Math.round(row.profit).toLocaleString('en-IN')}</td>
        `;
        
        // Double-click row drill-through
        tr.addEventListener('dblclick', () => {
            openDetailModal('customer', row.customerID);
        });
        
        tbody.appendChild(tr);
    });
}

// --- 2. SALES ANALYSIS TAB VISUALIZATIONS ---
function renderSalesTab(colors, destroyChart) {
    // 1. Monthly Area
    destroyChart('chart-sales-monthly');
    const trendData = dataUtils.getSalesByMonth(filteredData);
    const ctxMonthly = document.getElementById('chart-sales-monthly').getContext('2d');
    activeCharts['chart-sales-monthly'] = new Chart(ctxMonthly, {
        type: 'line',
        data: {
            labels: trendData.map(d => d.month),
            datasets: [{
                label: 'Gross Sales',
                data: trendData.map(d => d.sales),
                borderColor: colors.info,
                backgroundColor: colors.infoGlow,
                fill: true,
                tension: 0.35,
                borderWidth: 3
            }]
        },
        options: getCommonChartOptions(colors)
    });

    // 2. Quarterly
    destroyChart('chart-sales-quarterly');
    const qData = dataUtils.getSalesByQuarter(filteredData);
    const ctxQuarterly = document.getElementById('chart-sales-quarterly').getContext('2d');
    activeCharts['chart-sales-quarterly'] = new Chart(ctxQuarterly, {
        type: 'bar',
        data: {
            labels: qData.map(d => d.quarter),
            datasets: [{
                label: 'Revenue',
                data: qData.map(d => d.revenue),
                backgroundColor: colors.primary,
                borderRadius: 8
            }]
        },
        options: getCommonChartOptions(colors)
    });

    // 3. Daily Sales Analysis
    destroyChart('chart-sales-daily');
    const dData = dataUtils.getDailySales(filteredData);
    const ctxDaily = document.getElementById('chart-sales-daily').getContext('2d');
    activeCharts['chart-sales-daily'] = new Chart(ctxDaily, {
        type: 'line',
        data: {
            labels: dData.map(d => d.date),
            datasets: [{
                label: 'Sales (₹)',
                data: dData.map(d => d.sales),
                borderColor: colors.success,
                borderWidth: 1.5,
                pointRadius: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: getCommonChartOptions(colors)
    });

    // 4. Yearly Trends Comparison
    destroyChart('chart-sales-yearly');
    const yData = dataUtils.getSalesByYear(filteredData);
    const ctxYearly = document.getElementById('chart-sales-yearly').getContext('2d');
    activeCharts['chart-sales-yearly'] = new Chart(ctxYearly, {
        type: 'bar',
        data: {
            labels: yData.map(d => d.year),
            datasets: [{
                label: 'Net Revenue',
                data: yData.map(d => d.revenue),
                backgroundColor: colors.warning,
                borderRadius: 6
            }]
        },
        options: getCommonChartOptions(colors)
    });
}

// --- 3. PRODUCT PERFORMANCE TAB VISUALIZATIONS ---
function renderProductsTab(colors, destroyChart) {
    const productsData = dataUtils.getSalesByProduct(filteredData);

    // 1. Top 10 products
    destroyChart('chart-products-top');
    const top10 = productsData.slice(0, 10);
    const ctxTop = document.getElementById('chart-products-top').getContext('2d');
    activeCharts['chart-products-top'] = new Chart(ctxTop, {
        type: 'bar',
        data: {
            labels: top10.map(d => d.product.substring(0, 20) + (d.product.length > 20 ? '...' : '')),
            datasets: [
                {
                    label: 'Sales (₹)',
                    data: top10.map(d => d.sales),
                    backgroundColor: colors.primary,
                    borderRadius: 5
                },
                {
                    label: 'Profit (₹)',
                    data: top10.map(d => d.profit),
                    backgroundColor: colors.success,
                    borderRadius: 5
                }
            ]
        },
        options: getCommonChartOptions(colors, 'y')
    });

    // 2. Sales by Sub-category
    destroyChart('chart-products-subcategory');
    const subcatData = dataUtils.getSalesBySubCategory(filteredData);
    const ctxSub = document.getElementById('chart-products-subcategory').getContext('2d');
    activeCharts['chart-products-subcategory'] = new Chart(ctxSub, {
        type: 'bar',
        data: {
            labels: subcatData.map(d => d.subCategory),
            datasets: [{
                label: 'Sales (₹)',
                data: subcatData.map(d => d.sales),
                backgroundColor: colors.info,
                borderRadius: 6
            }]
        },
        options: getCommonChartOptions(colors)
    });

    // 3. Custom squarified layout Treemap
    renderTreemap();

    // 4. Bottom 10 Products
    destroyChart('chart-products-bottom');
    const bottom10 = [...productsData].reverse().slice(0, 10);
    const ctxBottom = document.getElementById('chart-products-bottom').getContext('2d');
    activeCharts['chart-products-bottom'] = new Chart(ctxBottom, {
        type: 'bar',
        data: {
            labels: bottom10.map(d => d.product.substring(0, 20) + (d.product.length > 20 ? '...' : '')),
            datasets: [{
                label: 'Sales (₹)',
                data: bottom10.map(d => d.sales),
                backgroundColor: colors.danger,
                borderRadius: 5
            }]
        },
        options: getCommonChartOptions(colors, 'y')
    });
}

// --- Custom Nested HTML Flex-Treemap Implementation ---
function renderTreemap() {
    const container = document.getElementById('custom-treemap');
    if (!container) return;
    container.innerHTML = '';
    
    // Group and sum
    const categories = {};
    let grandTotal = 0;
    
    filteredData.forEach(row => {
        if (!categories[row.category]) {
            categories[row.category] = { total: 0, subCats: {} };
        }
        categories[row.category].total += row.sales;
        categories[row.category].subCats[row.subCategory] = (categories[row.category].subCats[row.subCategory] || 0) + row.sales;
        grandTotal += row.sales;
    });

    if (grandTotal === 0) {
        container.innerHTML = '<div style="margin:auto; font-weight:600; color:var(--text-muted);">No sales data for Treemap</div>';
        return;
    }

    const catColors = {
        "Technology": "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.8))",
        "Furniture": "linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(20, 184, 166, 0.8))",
        "Office Supplies": "linear-gradient(135deg, rgba(245, 158, 11, 0.8), rgba(249, 115, 22, 0.8))"
    };

    // Sort categories by sales descending
    const sortedCats = Object.keys(categories).sort((a,b) => categories[b].total - categories[a].total);

    sortedCats.forEach(catName => {
        const catSales = categories[catName].total;
        const catPct = catSales / grandTotal;
        if (catPct < 0.01) return; // ignore tiny nodes

        const catBlock = document.createElement('div');
        catBlock.style.flex = `${catPct * 100} 1 0%`;
        catBlock.style.display = 'flex';
        catBlock.style.flexDirection = 'column';
        catBlock.style.gap = '4px';
        catBlock.style.height = '100%';
        catBlock.style.border = '1px solid var(--border-color)';
        catBlock.style.borderRadius = '12px';
        catBlock.style.padding = '4px';
        catBlock.style.background = 'rgba(255, 255, 255, 0.02)';

        // Sub categories inside this category block
        const subCats = categories[catName].subCats;
        const sortedSubs = Object.keys(subCats).sort((a,b) => subCats[b] - subCats[a]);

        sortedSubs.forEach(subName => {
            const subSales = subCats[subName];
            const subPct = subSales / catSales;
            const globalPct = subSales / grandTotal;

            const subNode = document.createElement('div');
            subNode.className = 'treemap-node';
            subNode.style.flex = `${subPct * 100} 1 0%`;
            subNode.style.background = catColors[catName] || 'var(--primary)';
            subNode.innerHTML = `
                <div class="node-title">${subName}</div>
                <div class="node-value">₹${Math.round(subSales).toLocaleString('en-IN')}</div>
                <div class="node-share">${Math.round(globalPct * 100)}% Global Share</div>
            `;
            
            // Filter on click
            subNode.addEventListener('click', () => {
                activeFilters.category = catName;
                activeFilters.subCategory = subName;
                
                document.getElementById('category-filter').value = catName;
                document.getElementById('subcat-filter').value = subName;
                
                refreshDashboard();
            });

            catBlock.appendChild(subNode);
        });

        container.appendChild(catBlock);
    });
}

// --- 4. REGIONAL ANALYSIS TAB VISUALIZATIONS ---
function renderRegionsTab(colors, destroyChart) {
    // 1. Profit Comparison grouped bars
    destroyChart('chart-regions-profit-comp');
    const regData = dataUtils.getSalesByRegion(filteredData);
    const ctxComp = document.getElementById('chart-regions-profit-comp').getContext('2d');
    activeCharts['chart-regions-profit-comp'] = new Chart(ctxComp, {
        type: 'bar',
        data: {
            labels: regData.map(d => d.region),
            datasets: [
                {
                    label: 'Revenue',
                    data: regData.map(d => d.revenue),
                    backgroundColor: colors.primary,
                    borderRadius: 5
                },
                {
                    label: 'Profit',
                    data: regData.map(d => d.profit),
                    backgroundColor: colors.success,
                    borderRadius: 5
                }
            ]
        },
        options: getCommonChartOptions(colors)
    });

    // 2. Sales by State visual list with progress bars
    const stateListEl = document.getElementById('state-perf-list');
    stateListEl.innerHTML = '';
    const stateData = dataUtils.getSalesByState(filteredData);
    
    if (stateData.length === 0) {
        stateListEl.innerHTML = '<div style="margin:auto; color:var(--text-muted);">No state details found</div>';
    } else {
        const maxStateSales = Math.max(...stateData.map(d => d.sales));
        stateData.forEach(row => {
            const pctOfMax = maxStateSales > 0 ? (row.sales / maxStateSales) * 100 : 0;
            const item = document.createElement('div');
            item.className = 'state-perf-item';
            item.innerHTML = `
                <div class="state-perf-info">
                    <span class="state-perf-name">${row.state} <small style="color:var(--text-muted);">(${row.region})</small></span>
                    <span class="state-perf-val">₹${Math.round(row.sales).toLocaleString('en-IN')}</span>
                </div>
                <div class="state-perf-progress-wrap">
                    <div class="state-perf-bar" style="width: ${pctOfMax}%; background-color: ${colors.primary};"></div>
                </div>
            `;
            stateListEl.appendChild(item);
        });
    }

    // 3. Sales by City (Top 15 Horizontal Bar)
    destroyChart('chart-regions-city');
    const cityData = dataUtils.getSalesByCity(filteredData).slice(0, 15);
    const ctxCity = document.getElementById('chart-regions-city').getContext('2d');
    activeCharts['chart-regions-city'] = new Chart(ctxCity, {
        type: 'bar',
        data: {
            labels: cityData.map(d => d.city),
            datasets: [{
                label: 'Sales (₹)',
                data: cityData.map(d => d.sales),
                backgroundColor: colors.info,
                borderRadius: 5
            }]
        },
        options: getCommonChartOptions(colors, 'y')
    });
}

// --- Custom Interactive US SVG Region Map Generator ---
function renderMap() {
    const container = document.getElementById('usa-svg-map');
    if (!container) return;

    // interlocked paths coordinates dividing canvas 500x300
    container.innerHTML = `
    <svg viewBox="0 0 500 280" width="100%">
        <!-- West Region -->
        <path d="M 20,40 L 140,20 L 170,80 L 130,220 L 20,190 Z" class="map-region-path" data-region="West" />
        <text x="75" y="115" fill="var(--text-primary)" font-weight="700" font-size="13" pointer-events="none" text-anchor="middle">West</text>
        <text x="75" y="132" class="map-region-text" data-region-text="West" fill="var(--text-muted)" font-size="10" pointer-events="none" text-anchor="middle">₹0</text>
        
        <!-- North Region -->
        <path d="M 140,20 L 290,30 L 280,180 L 240,240 L 130,220 L 170,80 Z" class="map-region-path" data-region="North" />
        <text x="200" y="125" fill="var(--text-primary)" font-weight="700" font-size="13" pointer-events="none" text-anchor="middle">North</text>
        <text x="200" y="142" class="map-region-text" data-region-text="North" fill="var(--text-muted)" font-size="10" pointer-events="none" text-anchor="middle">₹0</text>
        
        <!-- East Region -->
        <path d="M 290,30 L 470,50 L 460,140 L 350,180 L 280,110 Z" class="map-region-path" data-region="East" />
        <text x="375" y="95" fill="var(--text-primary)" font-weight="700" font-size="13" pointer-events="none" text-anchor="middle">East</text>
        <text x="375" y="112" class="map-region-text" data-region-text="East" fill="var(--text-muted)" font-size="10" pointer-events="none" text-anchor="middle">₹0</text>
        
        <!-- South Region -->
        <path d="M 280,110 L 350,180 L 460,140 L 440,250 L 240,240 L 280,180 Z" class="map-region-path" data-region="South" />
        <text x="350" y="200" fill="var(--text-primary)" font-weight="700" font-size="13" pointer-events="none" text-anchor="middle">South</text>
        <text x="350" y="217" class="map-region-text" data-region-text="South" fill="var(--text-muted)" font-size="10" pointer-events="none" text-anchor="middle">₹0</text>
    </svg>
    `;

    // Bind map clicks to toggle Region filter
    container.querySelectorAll('.map-region-path').forEach(path => {
        path.addEventListener('click', (e) => {
            const reg = e.target.dataset.region;
            
            if (activeFilters.region === reg) {
                activeFilters.region = 'All'; // Toggle off
            } else {
                activeFilters.region = reg; // Toggle on
            }
            
            document.getElementById('region-filter').value = activeFilters.region;
            refreshDashboard();
        });
    });

    updateMapDisplay();
}

// --- Update Map colors and text volumes based on currently filtered sales ---
function updateMapDisplay() {
    const mapWrapper = document.getElementById('usa-svg-map');
    if (!mapWrapper) return;
    
    // Group sales of the raw data (without regional filter itself, to show proportion)
    const unfilteredRegData = {};
    rawData.forEach(row => {
        // Apply all filters *except* region
        if (activeFilters.startDate && row.orderDate < activeFilters.startDate) return;
        if (activeFilters.endDate && row.orderDate > activeFilters.endDate) return;
        if (activeFilters.category !== 'All' && row.category !== activeFilters.category) return;
        if (activeFilters.subCategory !== 'All' && row.subCategory !== activeFilters.subCategory) return;
        if (activeFilters.productName !== 'All' && row.productName !== activeFilters.productName) return;
        if (activeFilters.customerName !== 'All' && row.customerName !== activeFilters.customerName) return;
        if (activeFilters.paymentMode !== 'All' && row.paymentMode !== activeFilters.paymentMode) return;
        
        unfilteredRegData[row.region] = (unfilteredRegData[row.region] || 0) + row.sales;
    });

    const maxSales = Math.max(...Object.values(unfilteredRegData), 1);

    // Apply color-fills and label totals
    mapWrapper.querySelectorAll('.map-region-path').forEach(path => {
        const reg = path.dataset.region;
        const sales = unfilteredRegData[reg] || 0;
        const intensity = sales / maxSales;
        
        // Active borders highlight
        if (activeFilters.region === reg) {
            path.classList.add('active');
        } else {
            path.classList.remove('active');
        }
        
        // Dynamic opacity of Primary color
        const theme = getThemeColors();
        const baseColor = theme.primary; // HEX
        
        path.style.fill = `rgba(${hexToRgb(baseColor)}, ${Math.max(0.15, intensity)})`;
        
        const label = mapWrapper.querySelector(`[data-region-text="${reg}"]`);
        if (label) {
            label.textContent = `₹${Math.round(sales).toLocaleString('en-IN')}`;
        }
    });
}

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const cleanHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

// --- 5. CUSTOMER BEHAVIOR TAB VISUALIZATIONS ---
function renderCustomersTab(colors, destroyChart) {
    // 1. Segments Distribution
    destroyChart('chart-customers-segments');
    const segData = dataUtils.getCustomerSegmentation(filteredData);
    const ctxSeg = document.getElementById('chart-customers-segments').getContext('2d');
    activeCharts['chart-customers-segments'] = new Chart(ctxSeg, {
        type: 'pie',
        data: {
            labels: segData.map(d => d.segment),
            datasets: [{
                data: segData.map(d => d.count),
                backgroundColor: [colors.success, colors.primary, colors.warning, colors.danger],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colors.text }
                }
            }
        }
    });

    // 2. Retention (New vs Returning)
    destroyChart('chart-customers-retention');
    const retData = dataUtils.getNewVsReturningCustomers(filteredData, rawData);
    const ctxRet = document.getElementById('chart-customers-retention').getContext('2d');
    activeCharts['chart-customers-retention'] = new Chart(ctxRet, {
        type: 'doughnut',
        data: {
            labels: retData.map(d => d.name),
            datasets: [{
                data: retData.map(d => d.value),
                backgroundColor: [colors.primary, colors.info],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colors.text }
                }
            }
        }
    });

    // 3. Customers Performance Table
    const tbody = document.querySelector('#table-customer-performance tbody');
    tbody.innerHTML = '';
    const custData = dataUtils.getSalesByCustomer(filteredData);

    if (custData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No customer profiles found</td></tr>';
        return;
    }

    custData.forEach(row => {
        const marginPct = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.title = 'Double click to open profile';
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--primary);">${row.id}</td>
            <td><strong>${row.name}</strong></td>
            <td>₹${row.revenue.toLocaleString('en-IN')}</td>
            <td>${row.orderCount}</td>
            <td>${row.items}</td>
            <td style="color:${marginPct >= 0 ? colors.success : colors.danger}; font-weight:600;">${marginPct.toFixed(1)}%</td>
        `;
        
        tr.addEventListener('dblclick', () => {
            openDetailModal('customer', row.id);
        });
        
        tbody.appendChild(tr);
    });
}

// --- 6. PROFIT ANALYSIS TAB VISUALIZATIONS ---
function renderProfitTab(colors, destroyChart) {
    // 1. Revenue vs Profit Scatter Plot
    destroyChart('chart-profit-scatter');
    const ctxScatter = document.getElementById('chart-profit-scatter').getContext('2d');
    activeCharts['chart-profit-scatter'] = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Transactions',
                data: filteredData.map(row => ({ x: row.revenue, y: row.profit })),
                backgroundColor: colors.primaryGlow,
                borderColor: colors.primary,
                borderWidth: 1,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Net Revenue (₹)', color: colors.text },
                    grid: { color: colors.grid },
                    ticks: { color: colors.muted }
                },
                y: {
                    title: { display: true, text: 'Profit (₹)', color: colors.text },
                    grid: { color: colors.grid },
                    ticks: { color: colors.muted }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // 2. Profit Margin by Category
    destroyChart('chart-profit-category');
    const catData = dataUtils.getSalesByCategory(filteredData);
    const ctxCat = document.getElementById('chart-profit-category').getContext('2d');
    activeCharts['chart-profit-category'] = new Chart(ctxCat, {
        type: 'bar',
        data: {
            labels: catData.map(d => d.category),
            datasets: [{
                label: 'Profit Margin %',
                data: catData.map(d => d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0),
                backgroundColor: colors.success,
                borderRadius: 5
            }]
        },
        options: getCommonChartOptions(colors)
    });

    // 3. Profit Trends Over Time
    destroyChart('chart-profit-trend');
    const trendData = dataUtils.getSalesByMonth(filteredData);
    const ctxTrend = document.getElementById('chart-profit-trend').getContext('2d');
    activeCharts['chart-profit-trend'] = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: trendData.map(d => d.month),
            datasets: [{
                label: 'Net Profit (₹)',
                data: trendData.map(d => d.profit),
                borderColor: colors.success,
                backgroundColor: colors.successGlow,
                fill: true,
                tension: 0.35,
                borderWidth: 3
            }]
        },
        options: getCommonChartOptions(colors)
    });

    // 4. Profit vs Discount Scatter
    destroyChart('chart-profit-discount');
    const ctxDisc = document.getElementById('chart-profit-discount').getContext('2d');
    activeCharts['chart-profit-discount'] = new Chart(ctxDisc, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Transactions',
                data: filteredData.map(row => ({ x: row.discount * 100, y: row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0 })),
                backgroundColor: colors.dangerGlow,
                borderColor: colors.danger,
                borderWidth: 1,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Discount Rate (%)', color: colors.text },
                    grid: { color: colors.grid },
                    ticks: { color: colors.muted }
                },
                y: {
                    title: { display: true, text: 'Profit Margin (%)', color: colors.text },
                    grid: { color: colors.grid },
                    ticks: { color: colors.muted }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --- 7. BUSINESS INSIGHTS DYNAMIC GENERATION ---
function renderInsightsTab() {
    const listRevenue = document.getElementById('insight-list-revenue');
    const listCustomer = document.getElementById('insight-list-customer');
    const listDiscounts = document.getElementById('insight-list-discounts');
    
    if (!listRevenue || !listCustomer || !listDiscounts) return;

    // Reset
    listRevenue.innerHTML = '';
    listCustomer.innerHTML = '';
    listDiscounts.innerHTML = '';

    if (filteredData.length === 0) {
        document.getElementById('insight-top-month').textContent = '--';
        document.getElementById('insight-top-product').textContent = '--';
        document.getElementById('insight-worst-product').textContent = '--';
        document.getElementById('insight-top-cat').textContent = '--';
        return;
    }

    // Calculations
    const months = dataUtils.getSalesByMonth(filteredData);
    const topMonth = months.reduce((max, d) => d.revenue > max.revenue ? d : max, { revenue: 0 });
    
    const products = dataUtils.getSalesByProduct(filteredData);
    const topProduct = products[0] || { product: '--', sales: 0 };
    const worstProduct = products[products.length - 1] || { product: '--', sales: 0 };
    
    const categories = dataUtils.getSalesByCategory(filteredData);
    // Find most profitable category (highest profit margin)
    const topCat = categories.reduce((max, d) => {
        const margin = d.revenue > 0 ? (d.profit / d.revenue) : 0;
        const maxMargin = max.revenue > 0 ? (max.profit / max.revenue) : 0;
        return margin > maxMargin ? d : max;
    }, { category: '--', revenue: 0, profit: 0 });

    // Renders Hero KPI
    document.getElementById('insight-top-month').textContent = topMonth.month || '--';
    document.getElementById('insight-top-month-val').textContent = `₹${Math.round(topMonth.revenue).toLocaleString('en-IN')}`;
    
    document.getElementById('insight-top-product').textContent = topProduct.product;
    document.getElementById('insight-top-product-val').textContent = `₹${Math.round(topProduct.sales).toLocaleString('en-IN')}`;
    
    document.getElementById('insight-worst-product').textContent = worstProduct.product;
    document.getElementById('insight-worst-product-val').textContent = `₹${Math.round(worstProduct.sales).toLocaleString('en-IN')}`;
    
    const topCatMargin = topCat.revenue > 0 ? (topCat.profit / topCat.revenue) * 100 : 0;
    document.getElementById('insight-top-cat').textContent = topCat.category;
    document.getElementById('insight-top-cat-margin').textContent = `${topCatMargin.toFixed(1)}% Margin`;

    // Bullet Insights Generation
    // 1. Revenue & Pricing
    const totalRev = dataUtils.getTotalRevenue(filteredData);
    const quantity = dataUtils.getQuantitySold(filteredData);
    const avgPrice = quantity > 0 ? (totalRev / quantity) : 0;
    
    const revLi1 = document.createElement('li');
    revLi1.innerHTML = `Peak monthly performance occurred in <strong>${topMonth.month}</strong> representing <strong>₹${Math.round(topMonth.revenue).toLocaleString('en-IN')}</strong> in net revenue.`;
    listRevenue.appendChild(revLi1);

    const revLi2 = document.createElement('li');
    revLi2.innerHTML = `Average unit selling price across current filters is <strong>₹${avgPrice.toFixed(2)}</strong>.`;
    listRevenue.appendChild(revLi2);
    
    if (months.length > 1) {
        const firstM = months[0].revenue;
        const lastM = months[months.length - 1].revenue;
        const growth = firstM > 0 ? ((lastM - firstM) / firstM) * 100 : 0;
        const revLi3 = document.createElement('li');
        revLi3.innerHTML = `Overall filter-span revenue trend shifted by <strong>${growth.toFixed(1)}%</strong> from first period (₹${Math.round(firstM).toLocaleString('en-IN')}) to last (₹${Math.round(lastM).toLocaleString('en-IN')}).`;
        listRevenue.appendChild(revLi3);
    }

    // 2. Customer & Regions
    const regionData = dataUtils.getSalesByRegion(filteredData);
    const topReg = regionData.reduce((max, d) => d.revenue > max.revenue ? d : max, { region: '--', revenue: 0 });
    const regLi = document.createElement('li');
    regLi.innerHTML = `<strong>${topReg.region} Region</strong> remains our strongest geographic sector, generating <strong>₹${Math.round(topReg.revenue).toLocaleString('en-IN')}</strong> in sales.`;
    listCustomer.appendChild(regLi);

    const customerStats = dataUtils.getSalesByCustomer(filteredData);
    const topCustomer = customerStats[0] || { name: '--', revenue: 0 };
    const custLi = document.createElement('li');
    custLi.innerHTML = `Top Account <strong>${topCustomer.name}</strong> contributed <strong>₹${Math.round(topCustomer.revenue).toLocaleString('en-IN')}</strong>, indicating core customer value.`;
    listCustomer.appendChild(custLi);

    const totalCusts = customerStats.length;
    const top10PercentCount = Math.max(1, Math.round(totalCusts * 0.1));
    const top10Sales = customerStats.slice(0, top10PercentCount).reduce((sum, c) => sum + c.revenue, 0);
    const concentration = totalRev > 0 ? (top10Sales / totalRev) * 100 : 0;
    const custLi2 = document.createElement('li');
    custLi2.innerHTML = `<strong>Customer concentration rate:</strong> the top 10% of customers account for <strong>${concentration.toFixed(1)}%</strong> of total revenues.`;
    listCustomer.appendChild(custLi2);

    // 3. Discount impact
    const discountedTrans = filteredData.filter(d => d.discount > 0);
    const nonDiscountedTrans = filteredData.filter(d => d.discount === 0);
    
    const avgDiscMargin = dataUtils.getProfitMargin(discountedTrans);
    const avgNonDiscMargin = dataUtils.getProfitMargin(nonDiscountedTrans);
    
    const discLi1 = document.createElement('li');
    discLi1.innerHTML = `<strong>Discounted items</strong> (discount > 0%) yielded an average profit margin of <strong>${avgDiscMargin.toFixed(1)}%</strong>.`;
    listDiscounts.appendChild(discLi1);

    const discLi2 = document.createElement('li');
    discLi2.innerHTML = `<strong>Non-discounted items</strong> yielded an average profit margin of <strong>${avgNonDiscMargin.toFixed(1)}%</strong> (a margin gap of <strong>${(avgNonDiscMargin - avgDiscMargin).toFixed(1)}%</strong>).`;
    listDiscounts.appendChild(discLi2);

    const heavyDiscountTrans = filteredData.filter(d => d.discount >= 0.3);
    const heavyDiscPct = filteredData.length > 0 ? (heavyDiscountTrans.length / filteredData.length) * 100 : 0;
    const discLi3 = document.createElement('li');
    discLi3.innerHTML = `<strong>Discount Leakage Rate:</strong> <strong>${heavyDiscPct.toFixed(1)}%</strong> of all orders were sold with heavy discounts (>= 30%), significantly impacting regional profitability.`;
    listDiscounts.appendChild(discLi3);
}

// --- Common Chart Options Configuration Helper ---
function getCommonChartOptions(colors, indexAxis = 'x') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: indexAxis,
        scales: {
            x: {
                grid: { color: colors.grid },
                ticks: { color: colors.muted }
            },
            y: {
                beginAtZero: true,
                grid: { color: colors.grid },
                ticks: { color: colors.muted }
            }
        },
        plugins: {
            legend: {
                labels: { color: colors.text }
            }
        }
    };
}

// --- Drill-Through Modal Trigger ---
function openDetailModal(type, key) {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;
    
    const colors = getThemeColors();
    
    // Clear previous modal chart
    if (modalChartInstance) {
        modalChartInstance.destroy();
        modalChartInstance = null;
    }
    
    if (type === 'customer') {
        const customerData = rawData.filter(d => d.customerID === key);
        if (customerData.length === 0) return;
        
        const customerName = customerData[0].customerName;
        document.getElementById('modal-title').textContent = `Customer Profile: ${customerName} (${key})`;
        
        const rev = dataUtils.getTotalRevenue(customerData);
        const orders = dataUtils.getTotalOrders(customerData);
        const margin = dataUtils.getProfitMargin(customerData);
        
        document.getElementById('modal-kpi-revenue').textContent = `₹${Math.round(rev).toLocaleString('en-IN')}`;
        document.getElementById('modal-kpi-orders').textContent = orders;
        document.getElementById('modal-kpi-margin').textContent = `${margin.toFixed(1)}%`;
        
        // 1. Modal trend chart
        const mTrend = dataUtils.getSalesByMonth(customerData);
        const ctx = document.getElementById('chart-modal-trend').getContext('2d');
        modalChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: mTrend.map(d => d.month),
                datasets: [{
                    label: 'Net Revenue (₹)',
                    data: mTrend.map(d => d.revenue),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryGlow,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: colors.muted }, grid: { display: false } },
                    y: { ticks: { color: colors.muted }, grid: { color: colors.grid } }
                },
                plugins: { legend: { display: false } }
            }
        });
        
        // 2. Modal Table Transactions list
        const tbody = document.querySelector('#table-modal-transactions tbody');
        tbody.innerHTML = '';
        customerData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.orderID}</td>
                <td>${row.orderDate}</td>
                <td>${row.productName}</td>
                <td>${row.quantity}</td>
                <td>${Math.round(row.discount * 100)}%</td>
                <td>₹${Math.round(row.revenue).toLocaleString('en-IN')}</td>
                <td style="color:${row.profit >= 0 ? colors.success : colors.danger}; font-weight:600;">₹${Math.round(row.profit).toLocaleString('en-IN')}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    modal.classList.add('open');
}

// --- Bind Interactive UI Action Listeners ---
function bindEvents() {
    // 1. Sidebar Tab Switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const navItem = e.currentTarget;
            const tabId = navItem.dataset.tab;
            
            document.querySelectorAll('.nav-item').forEach(li => li.classList.remove('active'));
            navItem.classList.add('active');
            
            // Switch panels
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Page title descriptions
            const titles = {
                overview: { title: "Executive Overview", sub: "Core financial aggregates track month-over-month" },
                sales: { title: "Sales Analysis Dashboard", sub: "Fiscal quarters and temporal trends mapping" },
                products: { title: "Product Performance", sub: "Analyze sales ranking, categories and treemap divisions" },
                regions: { title: "Regional Geography", sub: "Interactive SVG maps, states and city breakdown charts" },
                customers: { title: "Customer Behavior", sub: "Customer metrics and Loyalty Segmentation matrix" },
                profit: { title: "Profit Margin Analysis", sub: "Revenue correlation patterns, discount effects, and margin leaks" },
                insights: { title: "Dynamic Business Insights", sub: "Automated analysis scanning active filters" },
                'data-manager': { title: "File Upload & SQL Console", sub: "Import spreadsheet datasets and execute direct memory queries" }
            };
            
            document.getElementById('dynamic-page-title').textContent = titles[tabId].title;
            document.getElementById('dynamic-page-subtitle').textContent = titles[tabId].sub;
            
            activeTab = tabId;
            renderActiveTabVisuals();
        });
    });

    // 2. Theme Switcher Trigger
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const body = document.body;
        const sun = document.querySelector('.sun-icon');
        const moon = document.querySelector('.moon-icon');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            sun.style.display = 'block';
            moon.style.display = 'none';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            sun.style.display = 'none';
            moon.style.display = 'block';
        }
        
        // Re-render and apply color variables changes on active charts
        renderActiveTabVisuals();
        updateMapDisplay();
    });

    // 3. Collapsible Filter Toggle
    document.getElementById('filter-toggle-btn').addEventListener('click', () => {
        const panel = document.getElementById('filters-panel');
        panel.classList.toggle('show');
    });

    // 4. Reset Slicers button
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        activeFilters = {
            startDate: '',
            endDate: '',
            region: 'All',
            category: 'All',
            subCategory: 'All',
            productName: 'All',
            customerName: 'All',
            paymentMode: 'All'
        };
        
        document.getElementById('global-search').value = '';
        
        // Sync Dropdowns
        document.getElementById('start-date-filter').value = '';
        document.getElementById('end-date-filter').value = '';
        document.getElementById('region-filter').value = 'All';
        document.getElementById('category-filter').value = 'All';
        document.getElementById('subcat-filter').value = 'All';
        document.getElementById('product-filter').value = 'All';
        document.getElementById('customer-filter').value = 'All';
        document.getElementById('payment-filter').value = 'All';
        
        refreshDashboard();
    });

    // 5. Dropdown Slicer Listeners
    const bindFilterSelect = (elId, filterKey) => {
        const select = document.getElementById(elId);
        if (select) {
            select.addEventListener('change', (e) => {
                activeFilters[filterKey] = e.target.value;
                
                // If Category changes, limit subcat options to items of this category
                if (filterKey === 'category') {
                    const catVal = e.target.value;
                    const subcatSelect = document.getElementById('subcat-filter');
                    
                    if (catVal === 'All') {
                        // Restore all sub-categories
                        const fillDropdown = (elId, list) => {
                            const sub = document.getElementById(elId);
                            sub.innerHTML = sub.options[0].outerHTML;
                            list.forEach(val => {
                                const opt = document.createElement('option');
                                opt.value = val;
                                opt.textContent = val;
                                sub.appendChild(opt);
                            });
                        };
                        fillDropdown('subcat-filter', dataUtils.getSubCategoriesList(rawData));
                        activeFilters.subCategory = 'All';
                    } else {
                        // Filter subcategories list
                        const subCatsOfCat = Object.keys(rawData.reduce((acc, row) => {
                            if (row.category === catVal) acc[row.subCategory] = true;
                            return acc;
                        }, {}));
                        
                        subcatSelect.innerHTML = '<option value="All">All Sub-Categories</option>';
                        subCatsOfCat.forEach(s => {
                            const opt = document.createElement('option');
                            opt.value = s;
                            opt.textContent = s;
                            subcatSelect.appendChild(opt);
                        });
                        activeFilters.subCategory = 'All';
                    }
                }
                
                refreshDashboard();
            });
        }
    };

    bindFilterSelect('region-filter', 'region');
    bindFilterSelect('category-filter', 'category');
    bindFilterSelect('subcat-filter', 'subCategory');
    bindFilterSelect('product-filter', 'productName');
    bindFilterSelect('customer-filter', 'customerName');
    bindFilterSelect('payment-filter', 'paymentMode');

    // Date range picker listeners
    document.getElementById('start-date-filter').addEventListener('change', (e) => {
        activeFilters.startDate = e.target.value;
        refreshDashboard();
    });
    document.getElementById('end-date-filter').addEventListener('change', (e) => {
        activeFilters.endDate = e.target.value;
        refreshDashboard();
    });

    // Search bar event typing
    document.getElementById('global-search').addEventListener('input', () => {
        refreshDashboard();
    });

    // 6. CSV/Excel File Exports
    document.getElementById('export-csv').addEventListener('click', () => {
        exportDataFile('csv');
    });
    document.getElementById('export-excel').addEventListener('click', () => {
        exportDataFile('xlsx');
    });

    // 7. Modal Closing
    document.getElementById('modal-close-btn').addEventListener('click', () => {
        document.getElementById('detail-modal').classList.remove('open');
    });
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') {
            document.getElementById('detail-modal').classList.remove('open');
        }
    });

    // 8. SQL Console events
    document.getElementById('run-sql-btn').addEventListener('click', runTerminalQuery);
    document.getElementById('reset-sql-db-btn').addEventListener('click', async () => {
        showLoading('Resetting database metrics...');
        try {
            const response = await fetch('/api/sales/reset', { method: 'POST' });
            if (!response.ok) throw new Error('Reset failed');
            const data = await response.json();
            
            // Re-fetch database to get reset data
            const fetchResponse = await fetch('/api/sales');
            rawData = await fetchResponse.json();
            dbMock.init(rawData);
            populateSlicers();
            refreshDashboard();
            alert(`Database restored back to default state (${data.count || rawData.length} records)`);
        } catch (error) {
            console.error('Reset error:', error);
            alert('Failed to reset database on the API server.');
        } finally {
            hideLoading();
        }
    });
    
    // Preset Queries click
    document.querySelectorAll('.preset-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            const sql = e.target.dataset.query;
            document.getElementById('sql-query-input').value = sql;
            runTerminalQuery();
        });
    });

    // 9. File Upload Dropzone
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('data-file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        const file = e.dataTransfer.files[0];
        if (file) handleUploadFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleUploadFile(file);
    });
}

// --- Run terminal Mock SQL query and display results ---
async function runTerminalQuery() {
    const queryEl = document.getElementById('sql-query-input');
    const resultsBox = document.getElementById('sql-results-box');
    const timeEl = document.getElementById('sql-exec-time');
    const tbody = document.querySelector('#table-sql-results tbody');
    const thead = document.querySelector('#table-sql-results thead');
    
    const query = queryEl.value.trim();
    if (!query) return;

    resultsBox.style.display = 'block';
    timeEl.textContent = 'Executing...';
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const start = performance.now();
    try {
        const results = await dbMock.query(query);
        const end = performance.now();
        timeEl.textContent = `Time: ${Math.round(end - start)}ms | Rows: ${results.length}`;

        if (results.length === 0) {
            tbody.innerHTML = '<tr><td style="text-align:center;">Empty result set</td></tr>';
            return;
        }

        // Headers
        const cols = Object.keys(results[0]);
        const trHead = document.createElement('tr');
        cols.forEach(c => {
            const th = document.createElement('th');
            th.textContent = c;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Body rows
        results.forEach(row => {
            const tr = document.createElement('tr');
            cols.forEach(c => {
                const td = document.createElement('td');
                const val = row[c];
                td.textContent = (typeof val === 'number') ? val.toLocaleString() : val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

    } catch (err) {
        timeEl.textContent = 'Error';
        thead.innerHTML = '<tr><th style="color:var(--danger); text-align:left;">SQL Compilation Error</th></tr>';
        tbody.innerHTML = `<tr><td style="color:var(--danger); font-family:monospace; white-space:pre-wrap;">${err.message}</td></tr>`;
    }
}

// --- Upload Parser csv / xlsx ---
function handleUploadFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    const processResult = (parsedRows) => {
        // Validation Schema mapping fields: Sales, Date
        const cleanRows = parsedRows.filter(row => {
            const hasDate = row['Order Date'] || row['OrderDate'] || row['date'] || row['Date'];
            const hasSales = row['Sales'] || row['sales'] || row['revenue'] || row['Revenue'];
            return hasDate && hasSales;
        }).map((row, index) => {
            const dateVal = row['Order Date'] || row['OrderDate'] || row['date'] || row['Date'];
            const salesVal = Number(row['Sales'] || row['sales'] || row['revenue'] || row['Revenue']) || 0;
            const quantityVal = Number(row['Quantity'] || row['quantity'] || row['qty']) || 1;
            const discountVal = Number(row['Discount'] || row['discount'] || 0) || 0;
            const costVal = Number(row['Cost'] || row['cost']) || (salesVal * 0.7);
            const profitVal = Number(row['Profit'] || row['profit']) || (salesVal - costVal);
            
            return {
                orderID: row['Order ID'] || row['OrderID'] || `IMPORT-${100000 + index}`,
                orderDate: String(dateVal).trim(),
                shipDate: String(row['Ship Date'] || row['ShipDate'] || dateVal).trim(),
                customerID: row['Customer ID'] || row['CustomerID'] || 'CUST-IMP',
                customerName: row['Customer Name'] || row['CustomerName'] || 'Imported Customer',
                productID: row['Product ID'] || row['ProductID'] || 'PROD-IMP',
                productName: row['Product Name'] || row['ProductName'] || 'Imported SKU Item',
                category: row['Category'] || row['category'] || 'Other',
                subCategory: row['Sub-Category'] || row['SubCategory'] || 'Imported',
                region: row['Region'] || row['region'] || 'East',
                state: row['State'] || row['state'] || 'New York',
                city: row['City'] || row['city'] || 'New York City',
                sales: salesVal,
                quantity: quantityVal,
                discount: discountVal,
                revenue: salesVal,
                cost: costVal,
                profit: profitVal,
                paymentMode: row['Payment Mode'] || row['PaymentMode'] || 'Cash'
            };
        });

        if (cleanRows.length > 0) {
            showLoading('Syncing imported records to API server...');
            fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanRows)
            })
            .then(async (response) => {
                if (!response.ok) throw new Error('Upload failed');
                const data = await response.json();
                
                // Retrieve updated dataset
                const fetchResponse = await fetch('/api/sales');
                rawData = await fetchResponse.json();
                dbMock.init(rawData); // Sync mock DB
                populateSlicers();
                refreshDashboard();
                alert(`Success: Ingested & Synced ${data.count || cleanRows.length} valid sales records!`);
            })
            .catch(error => {
                console.error('Upload sync error:', error);
                alert('Success locally, but failed to sync records to the API server.');
                // Fallback to local
                rawData = cleanRows;
                dbMock.init(rawData);
                populateSlicers();
                refreshDashboard();
            })
            .finally(() => {
                hideLoading();
            });
        } else {
            alert("Error: No valid sales records found. Ensure sheet has 'Order Date' and 'Sales' columns.");
        }
    };

    if (extension === 'csv') {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                processResult(results.data);
            }
        });
    } else if (extension === 'xlsx' || extension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            processResult(json);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("Unsupported file format. Please upload a .csv or .xlsx file.");
    }
}

// --- Export CSV / Excel sheets ---
function exportDataFile(type) {
    if (filteredData.length === 0) {
        alert("No data to export");
        return;
    }
    
    if (type === 'csv') {
        const csv = Papa.unparse(filteredData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (type === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "FilteredSales");
        XLSX.writeFile(workbook, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
}

// --- Start the dashboard ---
document.addEventListener('DOMContentLoaded', init);
