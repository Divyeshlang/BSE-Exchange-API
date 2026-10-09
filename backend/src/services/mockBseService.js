const SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "WIPRO", "SBIN", "TATAMOTORS"];

/**
 * Generate 3,000 simulated BSE trade records with realistic values
 * @returns {Array<Object>} List of 3,000 trade objects
 */
export function generateMockTrades() {
  const now = Date.now();
  const trades = [];

  for (let i = 1; i <= 3000; i++) {
    const tradeTime = new Date(now - (3000 - i) * 1000).toISOString();

    trades.push({
      tradeId: `TRD${String(i).padStart(6, '0')}`,
      client: `Client ${String((i % 25) + 1).padStart(2, '0')}`,
      symbol: SYMBOLS[i % SYMBOLS.length],
      quantity: (i % 500) + 1,
      price: Math.round((100 + ((i * 17.31) % 4900)) * 100) / 100,
      timestamp: tradeTime,
    });
  }

  return trades;
}

/**
 * Fetch simulated 3,000 BSE trade batch
 * @returns {Promise<Array<Object>>}
 */
export async function fetchMockTrades() {
  return generateMockTrades();
}
