import { useCallback, useEffect, useMemo, useReducer } from 'react';

/**
 * Cart reducer for multi-item Stock IN / OUT / Transfer. Quantities (and Stock IN purchase
 * prices) are kept as strings while editing so partially typed decimals are not lost.
 */
export function cartReducer(lines, action) {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const quantity = action.quantity ?? 1;
      const existing = lines.find((l) => l.productId === product.id);
      if (existing) {
        // Adding the same part again bumps its quantity instead of duplicating the line.
        return lines.map((l) =>
          l.productId === product.id
            ? { ...l, quantity: String(Number(l.quantity || 0) + quantity) }
            : l,
        );
      }
      // The search only returns a purchase price to users who may change it on Stock IN.
      const previousPrice = product.purchasePrice == null ? null : Number(product.purchasePrice);
      return [
        ...lines,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          partNumber: product.partNumber ?? null,
          unitCode: product.unitCode,
          allowDecimal: Boolean(product.unitAllowDecimal),
          available: Number(product.stockQuantity),
          quantity: String(quantity),
          previousPrice,
          purchasePrice: previousPrice === null ? '' : String(previousPrice),
        },
      ];
    }
    case 'quantity':
      return lines.map((l) =>
        l.productId === action.productId ? { ...l, quantity: action.quantity } : l,
      );
    case 'price':
      return lines.map((l) =>
        l.productId === action.productId ? { ...l, purchasePrice: action.price } : l,
      );
    case 'remove':
      return lines.filter((l) => l.productId !== action.productId);
    case 'reset':
      return [];
    default:
      return lines;
  }
}

/**
 * Validation message for a line, or null. `capped` = quantity may not exceed stock;
 * `priced` = the line needs a purchase price (Stock IN).
 */
export function lineError(line, capped, priced = false) {
  const qty = Number(line.quantity);
  if (line.quantity === '' || Number.isNaN(qty) || qty <= 0) return 'Enter a quantity';
  if (!line.allowDecimal && !Number.isInteger(qty)) return `Whole ${line.unitCode} only`;
  if (capped && qty > line.available) return `Only ${line.available} available`;
  if (priced) {
    const price = Number(line.purchasePrice);
    if (!line.purchasePrice || Number.isNaN(price) || price < 0) return 'Enter the purchase price';
  }
  return null;
}

/** Price difference of a Stock IN line against the product's current price (0 = unchanged). */
export function priceChange(line) {
  const price = Number(line.purchasePrice);
  if (line.previousPrice == null || !line.purchasePrice || Number.isNaN(price)) return 0;
  return Math.round((price - line.previousPrice) * 100) / 100;
}

export const lineAmount = (line) =>
  Math.round((Number(line.quantity) || 0) * (Number(line.purchasePrice) || 0) * 100) / 100;

export function cartTotals(lines) {
  const units = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  const amount = lines.reduce((sum, l) => sum + lineAmount(l), 0);
  return {
    parts: lines.length,
    units: Math.round(units * 1000) / 1000,
    // Value of the entry before tax, at the purchase prices entered (Stock IN).
    amount: Math.round(amount * 100) / 100,
  };
}

function readDraft(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Cart state for one screen and branch. The draft is kept in sessionStorage so an
 * accidental navigation or reload does not lose a half-built entry.
 *
 * The key is read once: render the screen with `key={storageKey}` so switching branch
 * mounts a fresh cart instead of carrying lines (and their stock figures) across branches.
 *
 * @param {string} storageKey  unique per screen + branch
 * @param {boolean} capped     quantities limited to available stock (OUT, Transfer)
 * @param {boolean} [priced]   lines carry an editable purchase price (Stock IN)
 */
export function useStockCart(storageKey, capped, priced = false) {
  const [lines, dispatch] = useReducer(cartReducer, storageKey, readDraft);

  useEffect(() => {
    try {
      if (lines.length) sessionStorage.setItem(storageKey, JSON.stringify(lines));
      else sessionStorage.removeItem(storageKey);
    } catch {
      // Draft saving is a convenience only.
    }
  }, [storageKey, lines]);

  const errors = useMemo(
    () => Object.fromEntries(lines.map((l) => [l.productId, lineError(l, capped, priced)])),
    [lines, capped, priced],
  );

  return {
    lines,
    errors,
    totals: cartTotals(lines),
    isValid: lines.length > 0 && Object.values(errors).every((e) => !e),
    add: useCallback((product, quantity) => dispatch({ type: 'add', product, quantity }), []),
    setQuantity: useCallback(
      (productId, quantity) => dispatch({ type: 'quantity', productId, quantity }),
      [],
    ),
    setPrice: useCallback((productId, price) => dispatch({ type: 'price', productId, price }), []),
    remove: useCallback((productId) => dispatch({ type: 'remove', productId }), []),
    reset: useCallback(() => dispatch({ type: 'reset' }), []),
  };
}
