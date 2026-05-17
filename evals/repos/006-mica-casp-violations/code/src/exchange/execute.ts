// Order execution path.
// VIOLATION (MICA-005): executeOrder commits a match to the order book
// and settles it without calling a market-abuse / surveillance hook.
// MiCA Article 92 requires effective detection arrangements on the hot
// path.

import { orderBook, settlement } from "@/lib/exchange";
import type { Order } from "@/lib/types";

export async function executeOrder(order: Order) {
  await orderBook.match(order);
  await settlement.settle(order);
  return { status: "filled" };
}
