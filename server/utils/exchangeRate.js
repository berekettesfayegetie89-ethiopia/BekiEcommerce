/**
 * ETB Exchange Rate Utility
 * In production, replace with a live FX API (e.g. Open Exchange Rates, fixer.io)
 * or use Chapa in ETB natively (recommended for Ethiopian merchants).
 */

const FALLBACK_ETB_PER_USD = 130; // Update this periodically

async function getUSDtoETB() {
  try {
    // Use a free tier FX API if you have a key
    // const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${process.env.OER_APP_ID}&symbols=ETB`);
    // const data = await res.json();
    // return data.rates.ETB;
    return Number(process.env.ETB_PER_USD) || FALLBACK_ETB_PER_USD;
  } catch {
    return FALLBACK_ETB_PER_USD;
  }
}

module.exports = { getUSDtoETB };
