/**
 * Counter QR payload parsing helpers.
 * @module domain/orders/qr
 */

/**
 * Parses a QR payload produced by `buildQrPayload`.
 *
 * @param {unknown} value - Raw QR payload or plain order reference.
 * @returns {{orderNumber: string|null, id: string|null, totalCents: number|null, paymentMethod: string|null, items: Array<{item_name: string, quantity: number}>}} Parsed payload.
 */
export function parseQrPayload(value) {
  const empty = { orderNumber: null, id: null, totalCents: null, paymentMethod: null, items: [] };
  if (typeof value !== "string") return empty;

  const raw = value.trim();
  if (!raw.startsWith("ORD:")) {
    return { ...empty, orderNumber: raw || null };
  }

  const result = { ...empty };
  for (const segment of raw.split("|")) {
    const separator = segment.indexOf(":");
    if (separator === -1) continue;
    const key = segment.slice(0, separator);
    const data = segment.slice(separator + 1);

    if (key === "ORD") result.orderNumber = data || null;
    if (key === "ID") result.id = data || null;
    if (key === "TOTAL") {
      const total = Number(data);
      result.totalCents = Number.isFinite(total) ? total : null;
    }
    if (key === "PAY") result.paymentMethod = data || null;
    if (key === "ITEMS" && data) {
      result.items = data.split(",").flatMap((entry) => {
        const match = entry.match(/^(.*)x(\d+)$/);
        if (!match) return [];
        return [{ item_name: match[1], quantity: Number(match[2]) }];
      });
    }
  }

  return result;
}
