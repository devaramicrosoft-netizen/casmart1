export const RATES = { GBP: 1, USD: 1.27, IDR: 20500 };
export const SYMBOLS = { GBP: '£', USD: '$', IDR: 'Rp' };

export function formatPrice(gbpAmount, currency) {
  const converted = gbpAmount * RATES[currency];
  if (currency === 'IDR') {
    return 'Rp ' + Math.round(converted).toLocaleString('id-ID');
  }
  return SYMBOLS[currency] + converted.toFixed(2);
}
