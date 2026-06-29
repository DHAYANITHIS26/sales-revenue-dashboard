/**
 * Mock Database Service
 * Simulates SQL queries in the browser for local testing and syncing
 */

const dbMock = {
    salesDB: [],

    init: (data) => {
        dbMock.salesDB = [...data];
    },

    fetchSalesData: async () => {
        console.log("Fetching data from SalesDB...");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return dbMock.salesDB;
    },

    /**
     * Mini SQL Engine for executing queries against the mock database.
     * Supports basic SELECT, WHERE, GROUP BY, ORDER BY.
     */
    query: async (sql) => {
        // Simulating DB response delay
        await new Promise(resolve => setTimeout(resolve, 600));

        const cleanSql = sql.trim().replace(/\s+/g, ' ').replace(/;$/, '');
        const selectRegex = /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?$/i;
        const match = cleanSql.match(selectRegex);

        if (!match) {
            throw new Error("Syntax Error: Unsupported SQL syntax. Try:\n- SELECT * FROM Sales\n- SELECT Category, SUM(Revenue) FROM Sales GROUP BY Category\n- SELECT Region, SUM(Profit) FROM Sales GROUP BY Region ORDER BY Profit DESC\n- SELECT OrderID, CustomerName, Revenue FROM Sales WHERE Region = 'West' LIMIT 10");
        }

        let [_, selectFields, tableName, whereClause, groupByFields, orderByFields] = match;

        if (tableName.toLowerCase() !== 'sales') {
            throw new Error(`Table '${tableName}' not found. Available tables: 'Sales'`);
        }

        let data = [...dbMock.salesDB];

        // 1. Process WHERE Clause
        if (whereClause) {
            // Support simple patterns like: Field = 'Val' or Field > Num or Field LIKE 'Val'
            const filterMatch = whereClause.match(/(\w+)\s*(=|>|<|>=|<=|like)\s*(.+)/i);
            if (filterMatch) {
                let [__, field, op, val] = filterMatch;
                field = field.trim();
                val = val.trim().replace(/^'|'$/g, "").replace(/^"|"$/g, ""); // Strip quotes

                data = data.filter(row => {
                    const rowKey = Object.keys(row).find(k => k.toLowerCase() === field.toLowerCase());
                    if (!rowKey) return false;
                    const cellVal = row[rowKey];

                    if (op === '=') return String(cellVal).toLowerCase() === val.toLowerCase();
                    if (op === '>') return Number(cellVal) > Number(val);
                    if (op === '<') return Number(cellVal) < Number(val);
                    if (op === '>=') return Number(cellVal) >= Number(val);
                    if (op === '<=') return Number(cellVal) <= Number(val);
                    if (op.toLowerCase() === 'like') return String(cellVal).toLowerCase().includes(val.toLowerCase());
                    return false;
                });
            } else {
                throw new Error("WHERE clause error: Supports '=' or '>' or '<' or 'LIKE'. Example: WHERE Region = 'West'");
            }
        }

        // 2. Process GROUP BY
        if (groupByFields) {
            groupByFields = groupByFields.trim();
            const groupKeys = groupByFields.split(',').map(s => s.trim().toLowerCase());
            const selectItems = selectFields.split(',').map(s => s.trim());

            const grouped = {};
            data.forEach(row => {
                const groupVal = groupKeys.map(k => {
                    const rowKey = Object.keys(row).find(rk => rk.toLowerCase() === k);
                    return row[rowKey];
                }).join(' | ');

                if (!grouped[groupVal]) {
                    grouped[groupVal] = { _groupVal: groupVal, _rows: [] };
                }
                grouped[groupVal]._rows.push(row);
            });

            const results = [];
            Object.keys(grouped).forEach(gVal => {
                const groupObj = grouped[gVal];
                const newRow = {};

                // Map grouped keys back
                groupKeys.forEach((gk, idx) => {
                    const displayKey = selectItems.find(si => si.toLowerCase() === gk) || gk;
                    newRow[displayKey] = gVal.split(' | ')[idx];
                });

                // Run aggregations
                selectItems.forEach(item => {
                    const cleanItem = item.toLowerCase();
                    if (groupKeys.includes(cleanItem)) return;

                    const sumMatch = item.match(/sum\((\w+)\)/i);
                    const avgMatch = item.match(/avg\((\w+)\)/i);
                    const countMatch = item.match(/count\((\w+)\)/i);

                    if (sumMatch) {
                        const targetField = sumMatch[1];
                        const sumVal = groupObj._rows.reduce((sum, r) => {
                            const rKey = Object.keys(r).find(k => k.toLowerCase() === targetField.toLowerCase());
                            return sum + (Number(r[rKey]) || 0);
                        }, 0);
                        newRow[item] = Math.round(sumVal * 100) / 100;
                    } else if (avgMatch) {
                        const targetField = avgMatch[1];
                        const sumVal = groupObj._rows.reduce((sum, r) => {
                            const rKey = Object.keys(r).find(k => k.toLowerCase() === targetField.toLowerCase());
                            return sum + (Number(r[rKey]) || 0);
                        }, 0);
                        newRow[item] = Math.round((sumVal / groupObj._rows.length) * 100) / 100;
                    } else if (countMatch) {
                        newRow[item] = groupObj._rows.length;
                    }
                });

                results.push(newRow);
            });

            data = results;
        } else {
            // Regular SELECT subset
            if (selectFields !== '*') {
                const selectCols = selectFields.split(',').map(s => s.trim());
                data = data.map(row => {
                    const newRow = {};
                    selectCols.forEach(col => {
                        const actualKey = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase());
                        if (actualKey) {
                            newRow[col] = row[actualKey];
                        } else {
                            newRow[col] = null;
                        }
                    });
                    return newRow;
                });
            }
        }

        // 3. Process ORDER BY
        if (orderByFields) {
            const orderByMatch = orderByFields.trim().match(/(\w+|\S+)\s*(desc|asc)?/i);
            if (orderByMatch) {
                let [_, sortCol, direction] = orderByMatch;
                const desc = direction && direction.toLowerCase() === 'desc';

                data.sort((a, b) => {
                    const keyA = Object.keys(a).find(k => k.toLowerCase() === sortCol.toLowerCase());
                    const keyB = Object.keys(b).find(k => k.toLowerCase() === sortCol.toLowerCase());
                    let aVal = a[keyA];
                    let bVal = b[keyB];

                    if (typeof aVal === 'string') {
                        return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
                    } else {
                        return desc ? (Number(bVal) - Number(aVal)) : (Number(aVal) - Number(bVal));
                    }
                });
            }
        }

        return data;
    }
};

export { dbMock };
