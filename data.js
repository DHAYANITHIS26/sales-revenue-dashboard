/**
 * Sales & Revenue Data Generator and Aggregators
 */

// Seeded random generator for deterministic results
function createRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

const random = createRandom(42); // Seeded random for consistent generation

// Helper to choose random item from array
const choose = (arr) => arr[Math.floor(random() * arr.length)];
// Helper to choose random range
const randomRange = (min, max) => min + random() * (max - min);

// Reference Data
const customers = [
    { id: "CUST-1001", name: "Alice Johnson" },
    { id: "CUST-1002", name: "Bob Smith" },
    { id: "CUST-1003", name: "Charlie Brown" },
    { id: "CUST-1004", name: "Diana Prince" },
    { id: "CUST-1005", name: "Evan Wright" },
    { id: "CUST-1006", name: "Fiona Gallagher" },
    { id: "CUST-1007", name: "George Clark" },
    { id: "CUST-1008", name: "Hannah Abbott" },
    { id: "CUST-1009", name: "Ian Malcolm" },
    { id: "CUST-1010", name: "Julia Roberts" },
    { id: "CUST-1011", name: "Kevin Bacon" },
    { id: "CUST-1012", name: "Laura Croft" },
    { id: "CUST-1013", name: "Michael Scott" },
    { id: "CUST-1014", name: "Nancy Wheeler" },
    { id: "CUST-1015", name: "Oliver Queen" },
    { id: "CUST-1016", name: "Penelope Featherington" },
    { id: "CUST-1017", name: "Quentin Tarantino" },
    { id: "CUST-1018", name: "Rachel Green" },
    { id: "CUST-1019", name: "Steve Rogers" },
    { id: "CUST-1020", name: "Tony Stark" },
    { id: "CUST-1021", name: "Ursula Buffay" },
    { id: "CUST-1022", name: "Victor Stone" },
    { id: "CUST-1023", name: "Wanda Maximoff" },
    { id: "CUST-1024", name: "Xavier Woods" },
    { id: "CUST-1025", name: "Yvonne Strahovski" },
    { id: "CUST-1026", name: "Zachary Levi" },
    { id: "CUST-1027", name: "Arthur Dent" },
    { id: "CUST-1028", name: "Bruce Wayne" },
    { id: "CUST-1029", name: "Clark Kent" },
    { id: "CUST-1030", name: "David Miller" }
];

const products = {
    "Technology": {
        "Laptops": [
            { id: "PROD-TEC-1001", name: "Titan Precision Laptop", price: 1499.99, margin: 0.35 },
            { id: "PROD-TEC-1002", name: "Aero ultralight Notebook", price: 999.99, margin: 0.30 },
            { id: "PROD-TEC-1003", name: "Nebula Creator Workstation", price: 2499.99, margin: 0.40 }
        ],
        "Phones": [
            { id: "PROD-TEC-2001", name: "Quantum Phone Pro", price: 899.99, margin: 0.45 },
            { id: "PROD-TEC-2002", name: "Horizon Budget Smartphone", price: 349.99, margin: 0.25 }
        ],
        "Headphones": [
            { id: "PROD-TEC-3001", name: "SonicShield ANC Headphones", price: 249.99, margin: 0.55 },
            { id: "PROD-TEC-3002", name: "Pulse Wireless Earbuds", price: 99.99, margin: 0.50 }
        ],
        "Monitors": [
            { id: "PROD-TEC-4001", name: "Apex 34-inch Curved Monitor", price: 599.99, margin: 0.30 },
            { id: "PROD-TEC-4002", name: "Vivid HD Office Display", price: 199.99, margin: 0.25 }
        ],
        "Keyboards": [
            { id: "PROD-TEC-5001", name: "Tactile Mech Keyboard", price: 129.99, margin: 0.60 },
            { id: "PROD-TEC-5002", name: "Slim Wireless Keyboard", price: 49.99, margin: 0.50 }
        ]
    },
    "Furniture": {
        "Chairs": [
            { id: "PROD-FUR-1001", name: "ErgoFlow Mesh Task Chair", price: 299.99, margin: 0.25 },
            { id: "PROD-FUR-1002", name: "Executive Leather Recliner", price: 499.99, margin: 0.30 }
        ],
        "Tables": [
            { id: "PROD-FUR-2001", name: "Solid Oak Workstation Desk", price: 699.99, margin: 0.20 },
            { id: "PROD-FUR-2002", name: "Compact Writing Desk", price: 179.99, margin: 0.18 }
        ],
        "Bookcases": [
            { id: "PROD-FUR-3001", name: "Modular 5-Tier Bookshelf", price: 229.99, margin: 0.22 },
            { id: "PROD-FUR-3002", name: "Minimalist Wall Shelving", price: 119.99, margin: 0.20 }
        ]
    },
    "Office Supplies": {
        "Paper": [
            { id: "PROD-OFF-1001", name: "Laser Copy Paper Ream", price: 12.99, margin: 0.70 },
            { id: "PROD-OFF-1002", name: "Premium Cardstock Pack", price: 24.99, margin: 0.65 }
        ],
        "Binders": [
            { id: "PROD-OFF-2001", name: "Heavy Duty 3-Ring Binder", price: 8.99, margin: 0.75 },
            { id: "PROD-OFF-2002", name: "ClearView Presentation Folder", price: 4.49, margin: 0.80 }
        ],
        "Pens": [
            { id: "PROD-OFF-3001", name: "Smooth-Glide Gel Pens 12pk", price: 14.99, margin: 0.70 },
            { id: "PROD-OFF-3002", name: "Classic Ballpoint Pens 50pk", price: 7.99, margin: 0.65 }
        ]
    }
};

const regions = {
    "East": [
        { state: "West Bengal", cities: ["Kolkata", "Darjeeling", "Howrah"] },
        { state: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela"] },
        { state: "Bihar", cities: ["Patna", "Gaya", "Muzaffarpur"] }
    ],
    "West": [
        { state: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur"] },
        { state: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara"] },
        { state: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur"] }
    ],
    "South": [
        { state: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubballi"] },
        { state: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai"] },
        { state: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad"] }
    ],
    "North": [
        { state: "Delhi", cities: ["New Delhi", "Dwarka", "Rohini"] },
        { state: "Uttar Pradesh", cities: ["Noida", "Lucknow", "Kanpur"] },
        { state: "Punjab", cities: ["Ludhiana", "Amritsar", "Chandigarh"] }
    ]
};

const paymentModes = ["Credit Card", "Debit Card", "PayPal", "Cash"];

// Generate mock transactions
function generateMockTransactions(count = 250) {
    const transactions = [];
    const baseStartDate = new Date("2024-01-01").getTime();
    const baseEndDate = new Date("2025-12-31").getTime();

    for (let i = 1; i <= count; i++) {
        // Dynamic dates (seasonal trend: higher volume in Q4 (Oct, Nov, Dec))
        let timeOffset = random() * (baseEndDate - baseStartDate);
        const testDate = new Date(baseStartDate + timeOffset);
        const month = testDate.getMonth();
        // Give Q4 a boost by shifting some dates towards Q4
        if (random() < 0.25 && month < 9) {
            testDate.setMonth(choose([9, 10, 11]));
        }

        const dateStr = testDate.toISOString().split('T')[0];

        // Ship date 1 to 5 days later
        const shipDateObj = new Date(testDate);
        shipDateObj.setDate(shipDateObj.getDate() + Math.floor(randomRange(1, 6)));
        const shipDateStr = shipDateObj.toISOString().split('T')[0];

        const customer = choose(customers);
        const category = choose(Object.keys(products));
        const subCat = choose(Object.keys(products[category]));
        const productInfo = choose(products[category][subCat]);

        const regionKey = choose(Object.keys(regions));
        const regionDetails = choose(regions[regionKey]);
        const state = regionDetails.state;
        const city = choose(regionDetails.cities);

        const qty = Math.floor(randomRange(1, 9));
        // High price items get lower discount, low price items get higher discount occasionally
        let disc = 0;
        if (random() < 0.4) {
            disc = choose([0.1, 0.15, 0.2, 0.3, 0.5]);
            // Limit high discounts on expensive Laptops
            if (productInfo.price > 1000 && disc > 0.2) disc = 0.1;
        }

        // Calculations
        const baseSalesVal = productInfo.price * qty;
        const sales = Math.round(baseSalesVal * 100) / 100;
        const discountAmt = Math.round((sales * disc) * 100) / 100;
        const revenue = Math.round((sales - discountAmt) * 100) / 100;
        
        // Cost calculations: Base Cost * Qty
        const baseCostVal = productInfo.price * (1 - productInfo.margin) * qty;
        const cost = Math.round(baseCostVal * 100) / 100;
        const profit = Math.round((revenue - cost) * 100) / 100;

        transactions.push({
            orderID: `IN-202${testDate.getFullYear() % 10}-${100000 + i}`,
            orderDate: dateStr,
            shipDate: shipDateStr,
            customerID: customer.id,
            customerName: customer.name,
            productID: productInfo.id,
            productName: productInfo.name,
            category: category,
            subCategory: subCat,
            region: regionKey,
            state: state,
            city: city,
            sales: sales,
            quantity: qty,
            discount: disc,
            revenue: revenue,
            cost: cost,
            profit: profit,
            paymentMode: choose(paymentModes)
        });
    }

    // Sort by order date ascending
    return transactions.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
}

// Generate our base dataset
const salesData = generateMockTransactions(260);

// Advanced aggregation utilities
const dataUtils = {
    // Basic sums
    getTotalSales: (data) => data.reduce((sum, item) => sum + item.sales, 0),
    getTotalRevenue: (data) => data.reduce((sum, item) => sum + item.revenue, 0),
    getTotalProfit: (data) => data.reduce((sum, item) => sum + item.profit, 0),
    getTotalOrders: (data) => new Set(data.map(item => item.orderID)).size,
    getTotalCustomers: (data) => new Set(data.map(item => item.customerID)).size,
    getQuantitySold: (data) => data.reduce((sum, item) => sum + item.quantity, 0),
    getAverageOrderValue: (data) => {
        const totalRev = data.reduce((sum, item) => sum + item.revenue, 0);
        const uniqueOrders = new Set(data.map(item => item.orderID)).size;
        return uniqueOrders > 0 ? (totalRev / uniqueOrders) : 0;
    },
    getProfitMargin: (data) => {
        const totalRev = data.reduce((sum, item) => sum + item.revenue, 0);
        const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
        return totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
    },

    // Trends
    getSalesByMonth: (data) => {
        const months = {};
        data.forEach(item => {
            const mKey = item.orderDate.substring(0, 7); // YYYY-MM
            if (!months[mKey]) months[mKey] = { sales: 0, revenue: 0, profit: 0, count: 0 };
            months[mKey].sales += item.sales;
            months[mKey].revenue += item.revenue;
            months[mKey].profit += item.profit;
            months[mKey].count += 1;
        });
        return Object.keys(months).sort().map(m => ({
            month: m,
            sales: Math.round(months[m].sales),
            revenue: Math.round(months[m].revenue),
            profit: Math.round(months[m].profit)
        }));
    },

    getSalesByYear: (data) => {
        const years = {};
        data.forEach(item => {
            const yKey = item.orderDate.substring(0, 4); // YYYY
            if (!years[yKey]) years[yKey] = { sales: 0, revenue: 0, profit: 0 };
            years[yKey].sales += item.sales;
            years[yKey].revenue += item.revenue;
            years[yKey].profit += item.profit;
        });
        return Object.keys(years).sort().map(y => ({
            year: y,
            sales: Math.round(years[y].sales),
            revenue: Math.round(years[y].revenue),
            profit: Math.round(years[y].profit)
        }));
    },

    getSalesByQuarter: (data) => {
        const quarters = {};
        data.forEach(item => {
            const date = new Date(item.orderDate);
            const y = date.getFullYear();
            const q = Math.floor(date.getMonth() / 3) + 1;
            const qKey = `${y}-Q${q}`;
            if (!quarters[qKey]) quarters[qKey] = { sales: 0, revenue: 0, profit: 0 };
            quarters[qKey].sales += item.sales;
            quarters[qKey].revenue += item.revenue;
            quarters[qKey].profit += item.profit;
        });
        return Object.keys(quarters).sort().map(q => ({
            quarter: q,
            sales: Math.round(quarters[q].sales),
            revenue: Math.round(quarters[q].revenue),
            profit: Math.round(quarters[q].profit)
        }));
    },

    getDailySales: (data) => {
        const days = {};
        data.forEach(item => {
            if (!days[item.orderDate]) days[item.orderDate] = { sales: 0, revenue: 0, profit: 0 };
            days[item.orderDate].sales += item.sales;
            days[item.orderDate].revenue += item.revenue;
            days[item.orderDate].profit += item.profit;
        });
        return Object.keys(days).sort().map(d => ({
            date: d,
            sales: Math.round(days[d].sales),
            revenue: Math.round(days[d].revenue),
            profit: Math.round(days[d].profit)
        }));
    },

    // Products
    getSalesByProduct: (data) => {
        const products = {};
        data.forEach(item => {
            if (!products[item.productName]) products[item.productName] = { sales: 0, revenue: 0, profit: 0, units: 0 };
            products[item.productName].sales += item.sales;
            products[item.productName].revenue += item.revenue;
            products[item.productName].profit += item.profit;
            products[item.productName].units += item.quantity;
        });
        return Object.keys(products).map(p => ({
            product: p,
            sales: Math.round(products[p].sales),
            revenue: Math.round(products[p].revenue),
            profit: Math.round(products[p].profit),
            units: products[p].units
        })).sort((a, b) => b.sales - a.sales);
    },

    getSalesByCategory: (data) => {
        const categories = {};
        data.forEach(item => {
            if (!categories[item.category]) categories[item.category] = { sales: 0, revenue: 0, profit: 0 };
            categories[item.category].sales += item.sales;
            categories[item.category].revenue += item.revenue;
            categories[item.category].profit += item.profit;
        });
        const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
        return Object.keys(categories).map(c => ({
            category: c,
            sales: Math.round(categories[c].sales),
            revenue: Math.round(categories[c].revenue),
            profit: Math.round(categories[c].profit),
            share: totalRevenue > 0 ? Math.round((categories[c].revenue / totalRevenue) * 1000) / 10 : 0
        }));
    },

    getSalesBySubCategory: (data) => {
        const subCats = {};
        data.forEach(item => {
            if (!subCats[item.subCategory]) subCats[item.subCategory] = { sales: 0, revenue: 0, profit: 0, category: item.category };
            subCats[item.subCategory].sales += item.sales;
            subCats[item.subCategory].revenue += item.revenue;
            subCats[item.subCategory].profit += item.profit;
        });
        return Object.keys(subCats).map(s => ({
            subCategory: s,
            category: subCats[s].category,
            sales: Math.round(subCats[s].sales),
            revenue: Math.round(subCats[s].revenue),
            profit: Math.round(subCats[s].profit)
        })).sort((a, b) => b.sales - a.sales);
    },

    // Regional
    getSalesByRegion: (data) => {
        const regions = {};
        data.forEach(item => {
            if (!regions[item.region]) regions[item.region] = { sales: 0, revenue: 0, profit: 0 };
            regions[item.region].sales += item.sales;
            regions[item.region].revenue += item.revenue;
            regions[item.region].profit += item.profit;
        });
        return Object.keys(regions).map(r => ({
            region: r,
            sales: Math.round(regions[r].sales),
            revenue: Math.round(regions[r].revenue),
            profit: Math.round(regions[r].profit)
        }));
    },

    getSalesByState: (data) => {
        const states = {};
        data.forEach(item => {
            if (!states[item.state]) states[item.state] = { sales: 0, revenue: 0, profit: 0, region: item.region };
            states[item.state].sales += item.sales;
            states[item.state].revenue += item.revenue;
            states[item.state].profit += item.profit;
        });
        return Object.keys(states).map(s => ({
            state: s,
            region: states[s].region,
            sales: Math.round(states[s].sales),
            revenue: Math.round(states[s].revenue),
            profit: Math.round(states[s].profit)
        })).sort((a, b) => b.sales - a.sales);
    },

    getSalesByCity: (data) => {
        const cities = {};
        data.forEach(item => {
            if (!cities[item.city]) cities[item.city] = { sales: 0, revenue: 0, profit: 0, state: item.state, region: item.region };
            cities[item.city].sales += item.sales;
            cities[item.city].revenue += item.revenue;
            cities[item.city].profit += item.profit;
        });
        return Object.keys(cities).map(c => ({
            city: c,
            state: cities[c].state,
            region: cities[c].region,
            sales: Math.round(cities[c].sales),
            revenue: Math.round(cities[c].revenue),
            profit: Math.round(cities[c].profit)
        })).sort((a, b) => b.sales - a.sales);
    },

    // Customers
    getSalesByCustomer: (data) => {
        const custs = {};
        data.forEach(item => {
            if (!custs[item.customerID]) {
                custs[item.customerID] = {
                    name: item.customerName,
                    sales: 0,
                    revenue: 0,
                    profit: 0,
                    orders: new Set(),
                    items: 0
                };
            }
            custs[item.customerID].sales += item.sales;
            custs[item.customerID].revenue += item.revenue;
            custs[item.customerID].profit += item.profit;
            custs[item.customerID].orders.add(item.orderID);
            custs[item.customerID].items += item.quantity;
        });
        return Object.keys(custs).map(c => ({
            id: c,
            name: custs[c].name,
            sales: Math.round(custs[c].sales),
            revenue: Math.round(custs[c].revenue),
            profit: Math.round(custs[c].profit),
            orderCount: custs[c].orders.size,
            items: custs[c].items
        })).sort((a, b) => b.revenue - a.revenue);
    },

    getCustomerSegmentation: (data) => {
        const customerStats = dataUtils.getSalesByCustomer(data);
        const segments = { "Platinum": 0, "Gold": 0, "Silver": 0, "Bronze": 0 };
        customerStats.forEach(c => {
            if (c.revenue >= 12000) segments["Platinum"]++;
            else if (c.revenue >= 6000) segments["Gold"]++;
            else if (c.revenue >= 2500) segments["Silver"]++;
            else segments["Bronze"]++;
        });
        return Object.keys(segments).map(s => ({ segment: s, count: segments[s] }));
    },

    getNewVsReturningCustomers: (data, baseData = salesData) => {
        // A customer is "returning" if they have an order before the current transaction's date
        // For sub-filtered datasets, we analyze repeat behavior based on the entire historical DB (baseData)
        const orderHistory = {};
        // Sort entire dataset by date
        const sortedHistory = [...baseData].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        
        sortedHistory.forEach(item => {
            if (!orderHistory[item.customerID]) {
                orderHistory[item.customerID] = [];
            }
            orderHistory[item.customerID].push(item.orderDate);
        });

        let newCustCount = 0;
        let returningCustCount = 0;

        // In the filtered data, check how many orders are the first order vs subsequent orders
        // To simplify, let's look at the customer level for the filtered dataset:
        const currentCustomers = new Set(data.map(item => item.customerID));
        currentCustomers.forEach(cId => {
            const firstDate = orderHistory[cId]?.[0];
            // Check if the first date of this customer falls within the filtered dataset's date range
            const filteredCustOrders = data.filter(item => item.customerID === cId);
            const hasFirstOrderInFilter = filteredCustOrders.some(item => item.orderDate === firstDate);

            if (hasFirstOrderInFilter) {
                newCustCount++;
            } else {
                returningCustCount++;
            }
        });

        return [
            { name: "New Customers", value: newCustCount },
            { name: "Returning Customers", value: returningCustCount }
        ];
    },

    // Filter properties list
    getRegionsList: (data) => [...new Set(data.map(item => item.region))].sort(),
    getCategoriesList: (data) => [...new Set(data.map(item => item.category))].sort(),
    getSubCategoriesList: (data) => [...new Set(data.map(item => item.subCategory))].sort(),
    getProductsList: (data) => [...new Set(data.map(item => item.productName))].sort(),
    getCustomersList: (data) => [...new Set(data.map(item => item.customerName))].sort(),
    getPaymentModesList: (data) => [...new Set(data.map(item => item.paymentMode))].sort()
};

export { salesData, dataUtils };
