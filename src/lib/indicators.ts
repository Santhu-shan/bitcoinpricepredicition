export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Math.round(rsi * 10) / 10;
}

export function annualizedVolatilityPct(prices: number[]): number | null {
  if (prices.length < 3) return null;
  const rets: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    rets.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varR = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1);
  const vol = Math.sqrt(varR) * Math.sqrt(365) * 100;
  return Math.round(vol * 10) / 10;
}

