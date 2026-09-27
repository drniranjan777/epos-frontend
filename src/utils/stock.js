/** 'out' when nothing is left, 'low' at or below the minimum level, otherwise 'ok'. */
export function stockStatus(product) {
  const qty = Number(product.stockQuantity);
  if (qty <= 0) return 'out';
  if (qty <= Number(product.minStockLevel)) return 'low';
  return 'ok';
}
