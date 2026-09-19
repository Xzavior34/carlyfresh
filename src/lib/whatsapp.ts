/**
 * WhatsApp Helper Utilities for CarlyFresh
 * Provides structured message formatting for orders and direct click-to-chat URLs
 */

import { formatNaira } from "./formatters";

export interface WhatsAppOrderData {
  id: string;
  order_number?: string | number | null;
  created_at?: string | null;
  status?: string | null;
  total_amount?: number | string | null;
  delivery_address?: string | null;
  delivery_window?: string | null;
  items?: any[] | null;
  buyer?: { full_name?: string | null; phone?: string | null; business_name?: string | null } | null;
  vendor?: { full_name?: string | null; phone?: string | null; business_name?: string | null } | null;
  driver?: { full_name?: string | null; phone?: string | null } | null;
}

/**
 * Normalizes phone numbers to international format without + (e.g. 08012345678 -> 2348012345678)
 */
export function normalizePhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "234" + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Formats a clean, readable WhatsApp receipt and tracking message for any order
 */
export function formatOrderWhatsAppMessage(order: WhatsAppOrderData): string {
  const orderNum = order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`;
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  const statusLabel = (order.status || "Pending").toUpperCase().replace(/_/g, " ");
  const amountStr = formatNaira(Number(order.total_amount || 0));

  // Extract items
  const itemsList: string[] = [];
  if (Array.isArray(order.items)) {
    order.items.forEach((item: any) => {
      const name = item?.name || item?.product?.name || "Item";
      const qty = item?.quantity || 1;
      const unit = item?.unit ? ` ${item.unit}` : "";
      const price = item?.price ? ` - ${formatNaira(Number(item.price) * Number(qty))}` : "";
      itemsList.push(`• ${name} (x${qty}${unit})${price}`);
    });
  }

  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://carlyfresh.com";
  const trackingLink = `${appBaseUrl}/orders/${order.id}`;

  let msg = `🛒 *CarlyFresh Order Details*\n`;
  msg += `────────────────────────\n`;
  msg += `📋 *Order ID:* ${orderNum}\n`;
  msg += `📅 *Date:* ${dateStr}\n`;
  msg += `🏷️ *Status:* ${statusLabel}\n`;
  msg += `💰 *Total Amount:* ${amountStr}\n\n`;

  if (itemsList.length > 0) {
    msg += `📦 *Items Purchased:*\n`;
    msg += `${itemsList.join("\n")}\n\n`;
  }

  if (order.delivery_address) {
    msg += `📍 *Delivery Address:* ${order.delivery_address}\n`;
  }

  if (order.delivery_window) {
    msg += `🕒 *Delivery Window:* ${order.delivery_window}\n`;
  }

  if (order.buyer?.full_name || order.buyer?.phone) {
    const buyerPhone = order.buyer?.phone ? ` (${order.buyer.phone})` : "";
    msg += `👤 *Customer:* ${order.buyer?.full_name || "Customer"}${buyerPhone}\n`;
  }

  if (order.vendor?.business_name || order.vendor?.full_name) {
    msg += `🏪 *Vendor:* ${order.vendor?.business_name || order.vendor?.full_name}\n`;
  }

  if (order.driver?.full_name) {
    msg += `🚗 *Assigned Driver:* ${order.driver.full_name}\n`;
  }

  msg += `\n🔗 *Track Live Order:* ${trackingLink}\n`;
  msg += `────────────────────────\n`;
  msg += `_Fresh groceries delivered directly to your doorstep with CarlyFresh!_`;

  return msg;
}

/**
 * Builds a direct wa.me link with pre-filled message text
 */
export function getWhatsAppUrl(phone?: string | null, text?: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const encodedText = text ? encodeURIComponent(text) : "";
  if (normalized) {
    return `https://wa.me/${normalized}${encodedText ? `?text=${encodedText}` : ""}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Opens WhatsApp in a new tab with the formatted order details
 */
export function openWhatsAppOrderDetails(order: WhatsAppOrderData, recipientPhone?: string | null): void {
  const message = formatOrderWhatsAppMessage(order);
  const url = getWhatsAppUrl(recipientPhone, message);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
