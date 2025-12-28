import Papa from 'papaparse';

/**
 * Parse CSV file and validate trade data
 * @param {File} file - The CSV file to parse
 * @returns {Promise<{trades: Array, errors: Array, warnings: Array}>}
 */
export async function parseCSV(file) {
    return new Promise((resolve) => {
        const errors = [];
        const warnings = [];
        const trades = [];

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.toLowerCase().trim(),
            complete: (results) => {
                if (results.data.length === 0) {
                    errors.push({ message: 'No trades found. Check your CSV format?' });
                    resolve({ trades: [], errors, warnings });
                    return;
                }

                const now = new Date();

                results.data.forEach((row, index) => {
                    const lineNum = index + 2; // +2 for header and 1-indexed

                    // Validate required fields
                    if (!row.date || !row.symbol || !row.action || !row.price || !row.amount) {
                        errors.push({
                            line: lineNum,
                            message: `Missing required fields (date, symbol, action, price, amount)`
                        });
                        return;
                    }

                    // Parse date
                    const tradeDate = new Date(row.date);
                    if (isNaN(tradeDate.getTime())) {
                        errors.push({ line: lineNum, message: `Invalid date format: ${row.date}` });
                        return;
                    }

                    // Check for future date
                    if (tradeDate > now) {
                        errors.push({ line: lineNum, message: `Trade date in future: ${row.date}` });
                        return;
                    }

                    // Normalize action
                    const action = row.action.toLowerCase().trim();
                    if (action !== 'buy' && action !== 'sell') {
                        errors.push({ line: lineNum, message: `Invalid action: ${row.action}. Use 'buy' or 'sell'.` });
                        return;
                    }

                    // Parse numeric values
                    const price = parseFloat(row.price);
                    const amount = parseFloat(row.amount);
                    const feeUsd = row.fee_usd ? parseFloat(row.fee_usd) : null;

                    if (isNaN(price) || price < 0) {
                        errors.push({ line: lineNum, message: `Invalid price: ${row.price}` });
                        return;
                    }

                    if (isNaN(amount) || amount <= 0) {
                        errors.push({ line: lineNum, message: `Invalid amount: ${row.amount}` });
                        return;
                    }

                    // Check for fee
                    let feeEstimated = false;
                    let fee = feeUsd;
                    if (feeUsd === null || isNaN(feeUsd)) {
                        // Estimate fee: 0.3% + $0.50
                        const tradeValue = price * amount;
                        fee = tradeValue * 0.003 + 0.50;
                        feeEstimated = true;
                    }

                    trades.push({
                        date: tradeDate,
                        symbol: row.symbol.toUpperCase().trim(),
                        action,
                        price,
                        amount,
                        fee,
                        feeEstimated,
                        value: price * amount,
                        lineNumber: lineNum
                    });
                });

                // Check for mismatched buys/sells
                const symbolBalances = {};
                trades.forEach(trade => {
                    if (!symbolBalances[trade.symbol]) {
                        symbolBalances[trade.symbol] = 0;
                    }
                    if (trade.action === 'buy') {
                        symbolBalances[trade.symbol] += trade.amount;
                    } else {
                        symbolBalances[trade.symbol] -= trade.amount;
                    }
                });

                const openPositions = Object.entries(symbolBalances)
                    .filter(([_, balance]) => Math.abs(balance) > 0.0001)
                    .map(([symbol, balance]) => ({ symbol, balance }));

                if (openPositions.length > 0) {
                    warnings.push({
                        type: 'open_positions',
                        message: `${openPositions.length} open position(s) (not closed). PnL may be incomplete.`,
                        details: openPositions
                    });
                }

                // Check for estimated fees
                const estimatedFeeCount = trades.filter(t => t.feeEstimated).length;
                if (estimatedFeeCount > 0) {
                    warnings.push({
                        type: 'estimated_fees',
                        message: `${estimatedFeeCount} trade(s) with estimated fees (no fee_usd provided).`
                    });
                }

                // Sort trades by date
                trades.sort((a, b) => a.date - b.date);

                resolve({ trades, errors, warnings });
            },
            error: (error) => {
                errors.push({ message: `CSV parsing error: ${error.message}` });
                resolve({ trades: [], errors, warnings });
            }
        });
    });
}

/**
 * Format date for display
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
