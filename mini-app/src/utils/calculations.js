/**
 * ClearSignal Trade Analysis Calculations
 * All calculations are transparent and documented
 */

/**
 * Calculate Net PnL from trades
 * Formula: Σ(sell × price) − Σ(buy × price) − total_fees
 */
export function calculateNetPnL(trades) {
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let totalFees = 0;

    trades.forEach(trade => {
        const value = trade.price * trade.amount;
        if (trade.action === 'buy') {
            totalBuyValue += value;
        } else {
            totalSellValue += value;
        }
        totalFees += trade.fee || 0;
    });

    const netPnL = totalSellValue - totalBuyValue - totalFees;
    const pnlPercent = totalBuyValue > 0 ? (netPnL / totalBuyValue) * 100 : 0;

    return {
        netPnL,
        pnlPercent,
        totalBuyValue,
        totalSellValue,
        totalFees
    };
}

/**
 * Calculate HODL Return (what if you just bought & held?)
 * Formula: (final_price / first_buy_price − 1) × total_invested
 */
export function calculateHODLReturn(trades, currentPrices) {
    // Group by symbol
    const symbolData = {};

    trades.forEach(trade => {
        if (!symbolData[trade.symbol]) {
            symbolData[trade.symbol] = {
                firstBuyPrice: null,
                totalInvested: 0,
                totalAmount: 0
            };
        }

        if (trade.action === 'buy') {
            if (symbolData[trade.symbol].firstBuyPrice === null) {
                symbolData[trade.symbol].firstBuyPrice = trade.price;
            }
            symbolData[trade.symbol].totalInvested += trade.price * trade.amount;
            symbolData[trade.symbol].totalAmount += trade.amount;
        }
    });

    let totalInvested = 0;
    let hodlValue = 0;

    Object.entries(symbolData).forEach(([symbol, data]) => {
        if (data.firstBuyPrice && data.totalAmount > 0) {
            totalInvested += data.totalInvested;
            const currentPrice = currentPrices[symbol] || data.firstBuyPrice;
            hodlValue += data.totalAmount * currentPrice;
        }
    });

    const hodlReturn = hodlValue - totalInvested;
    const hodlPercent = totalInvested > 0 ? (hodlReturn / totalInvested) * 100 : 0;

    return {
        hodlReturn,
        hodlPercent,
        totalInvested,
        hodlValue
    };
}

/**
 * Calculate Fee Leak (total cost of trading)
 * Formula: total_fees + (trade_value × slippage%) + (trades × gas_fee)
 */
export function calculateFeeLeak(trades, options = {}) {
    const slippagePercent = options.slippagePercent ?? 0.5;
    const gasFeePerTrade = options.gasFeePerTrade ?? 0.50;

    let totalFees = 0;
    let totalTradeValue = 0;
    let estimatedFeeCount = 0;

    trades.forEach(trade => {
        totalFees += trade.fee || 0;
        totalTradeValue += trade.value;
        if (trade.feeEstimated) estimatedFeeCount++;
    });

    const estimatedSlippage = totalTradeValue * (slippagePercent / 100);
    const estimatedGas = trades.length * gasFeePerTrade;
    const totalFeeLeak = totalFees + estimatedSlippage + estimatedGas;

    return {
        totalFees,
        estimatedSlippage,
        estimatedGas,
        totalFeeLeak,
        estimatedFeeCount,
        isEstimate: estimatedFeeCount > 0 || slippagePercent > 0 || gasFeePerTrade > 0
    };
}

/**
 * Calculate Win Rate (percentage of profitable trades)
 */
export function calculateWinRate(trades) {
    // Pair buy/sell trades for each symbol
    const closedTrades = [];
    const openPositions = {};

    // Sort by date to process in order
    const sortedTrades = [...trades].sort((a, b) => a.date - b.date);

    sortedTrades.forEach(trade => {
        const symbol = trade.symbol;

        if (trade.action === 'buy') {
            if (!openPositions[symbol]) {
                openPositions[symbol] = [];
            }
            openPositions[symbol].push({
                buyPrice: trade.price,
                amount: trade.amount,
                buyValue: trade.value
            });
        } else if (trade.action === 'sell') {
            if (openPositions[symbol] && openPositions[symbol].length > 0) {
                let remainingSellAmount = trade.amount;

                while (remainingSellAmount > 0 && openPositions[symbol].length > 0) {
                    const position = openPositions[symbol][0];
                    const closeAmount = Math.min(remainingSellAmount, position.amount);

                    const buyValue = position.buyPrice * closeAmount;
                    const sellValue = trade.price * closeAmount;
                    const profit = sellValue - buyValue;

                    closedTrades.push({
                        symbol,
                        buyPrice: position.buyPrice,
                        sellPrice: trade.price,
                        amount: closeAmount,
                        profit,
                        profitPercent: (profit / buyValue) * 100
                    });

                    position.amount -= closeAmount;
                    remainingSellAmount -= closeAmount;

                    if (position.amount <= 0.0001) {
                        openPositions[symbol].shift();
                    }
                }
            }
        }
    });

    const winningTrades = closedTrades.filter(t => t.profit > 0);
    const losingTrades = closedTrades.filter(t => t.profit <= 0);

    const winRate = closedTrades.length > 0
        ? (winningTrades.length / closedTrades.length) * 100
        : 0;

    return {
        winRate,
        totalClosed: closedTrades.length,
        winning: winningTrades.length,
        losing: losingTrades.length,
        closedTrades
    };
}

/**
 * Calculate Maximum Drawdown (peak to trough)
 */
export function calculateMaxDrawdown(trades) {
    if (trades.length === 0) {
        return { maxDrawdown: 0, maxDrawdownPercent: 0 };
    }

    // Calculate cumulative portfolio value over time
    let cumulativeValue = 0;
    let peakValue = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    const sortedTrades = [...trades].sort((a, b) => a.date - b.date);

    sortedTrades.forEach(trade => {
        if (trade.action === 'buy') {
            cumulativeValue -= trade.value + (trade.fee || 0);
        } else {
            cumulativeValue += trade.value - (trade.fee || 0);
        }

        if (cumulativeValue > peakValue) {
            peakValue = cumulativeValue;
        }

        const drawdown = peakValue - cumulativeValue;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
            maxDrawdownPercent = peakValue > 0 ? (drawdown / peakValue) * 100 : 0;
        }
    });

    return {
        maxDrawdown,
        maxDrawdownPercent
    };
}

/**
 * Calculate all metrics at once
 */
export function calculateAllMetrics(trades, currentPrices, options = {}) {
    const pnl = calculateNetPnL(trades);
    const hodl = calculateHODLReturn(trades, currentPrices);
    const feeLeak = calculateFeeLeak(trades, options);
    const winRate = calculateWinRate(trades);
    const drawdown = calculateMaxDrawdown(trades);

    const effectiveReturn = pnl.totalBuyValue > 0
        ? (pnl.netPnL / pnl.totalBuyValue) * 100
        : 0;

    return {
        pnl,
        hodl,
        feeLeak,
        winRate,
        drawdown,
        effectiveReturn,
        summary: {
            netPnL: pnl.netPnL,
            netPnLPercent: pnl.pnlPercent,
            hodlReturn: hodl.hodlReturn,
            hodlPercent: hodl.hodlPercent,
            vsHodl: pnl.pnlPercent - hodl.hodlPercent,
            totalFees: feeLeak.totalFeeLeak,
            winRate: winRate.winRate,
            maxDrawdown: drawdown.maxDrawdownPercent
        }
    };
}

/**
 * Format currency for display
 */
export function formatCurrency(value, decimals = 2) {
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    return `${isNegative ? '-' : ''}$${formatted}`;
}

/**
 * Format percentage for display
 */
export function formatPercent(value, decimals = 1) {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}
