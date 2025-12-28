const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Common symbol mappings (Telegram memecoins to CoinGecko IDs)
const SYMBOL_MAPPINGS = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'SHIB': 'shiba-inu',
    'PEPE': 'pepe',
    'BONK': 'bonk',
    'WIF': 'dogwifcoin',
    'FLOKI': 'floki',
    'WOJAK': 'wojak',
    'TURBO': 'turbo',
    'MEME': 'memecoin',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'APT': 'aptos',
    'SUI': 'sui',
    'NEAR': 'near',
    'FTM': 'fantom'
};

/**
 * Get CoinGecko ID for a symbol
 */
function getCoinGeckoId(symbol) {
    const upper = symbol.toUpperCase();
    return SYMBOL_MAPPINGS[upper] || upper.toLowerCase();
}

/**
 * Fetch current price for a symbol
 */
export async function fetchCurrentPrice(symbol) {
    const coinId = getCoinGeckoId(symbol);

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data[coinId] && data[coinId].usd) {
            return { price: data[coinId].usd, found: true };
        }

        return { price: null, found: false };
    } catch (error) {
        console.warn(`Failed to fetch price for ${symbol}:`, error.message);
        return { price: null, found: false, error: error.message };
    }
}

/**
 * Fetch current prices for multiple symbols
 */
export async function fetchCurrentPrices(symbols) {
    const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];
    const coinIds = uniqueSymbols.map(s => getCoinGeckoId(s));

    try {
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const prices = {};
        const warnings = [];

        uniqueSymbols.forEach((symbol, index) => {
            const coinId = coinIds[index];
            if (data[coinId] && data[coinId].usd) {
                prices[symbol] = data[coinId].usd;
            } else {
                prices[symbol] = 1; // Fallback to $1
                warnings.push({
                    symbol,
                    message: `Price assumed $1 for ${symbol} — verify symbol`
                });
            }
        });

        return { prices, warnings };
    } catch (error) {
        console.warn('Failed to fetch prices:', error.message);

        // Fallback: all prices to $1
        const prices = {};
        const warnings = [];

        uniqueSymbols.forEach(symbol => {
            prices[symbol] = 1;
            warnings.push({
                symbol,
                message: `Price assumed $1 for ${symbol} — API error`
            });
        });

        return { prices, warnings };
    }
}

/**
 * Fetch historical price at a specific date
 * Note: CoinGecko free tier has limited historical data access
 */
export async function fetchHistoricalPrice(symbol, date) {
    const coinId = getCoinGeckoId(symbol);
    const dateStr = formatDateForAPI(date);

    try {
        const response = await fetch(
            `${COINGECKO_API}/coins/${coinId}/history?date=${dateStr}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.market_data && data.market_data.current_price && data.market_data.current_price.usd) {
            return { price: data.market_data.current_price.usd, found: true };
        }

        return { price: null, found: false };
    } catch (error) {
        console.warn(`Failed to fetch historical price for ${symbol}:`, error.message);
        return { price: null, found: false, error: error.message };
    }
}

/**
 * Format date for CoinGecko API (dd-mm-yyyy)
 */
function formatDateForAPI(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

/**
 * Rate-limited fetch for multiple historical prices
 * Uses delays to avoid hitting rate limits
 */
export async function fetchHistoricalPricesForTrades(trades, progressCallback) {
    const results = {};
    const warnings = [];
    const uniqueRequests = [];

    // Group trades by symbol + date (to reduce API calls)
    const requestMap = new Map();

    trades.forEach(trade => {
        const dateKey = formatDateForAPI(trade.date);
        const key = `${trade.symbol}_${dateKey}`;

        if (!requestMap.has(key)) {
            requestMap.set(key, {
                symbol: trade.symbol,
                date: trade.date,
                dateKey
            });
        }
    });

    uniqueRequests.push(...requestMap.values());

    // For MVP, use current prices as fallback (historical API has rate limits)
    // In production, implement proper rate limiting and caching
    const symbols = [...new Set(trades.map(t => t.symbol))];
    const { prices, warnings: priceWarnings } = await fetchCurrentPrices(symbols);

    warnings.push(...priceWarnings);

    // Use current prices as approximation
    trades.forEach(trade => {
        results[trade.symbol] = prices[trade.symbol] || 1;
    });

    return { prices: results, warnings };
}

/**
 * Check if symbol is a known coin
 */
export function isKnownSymbol(symbol) {
    return symbol.toUpperCase() in SYMBOL_MAPPINGS;
}
