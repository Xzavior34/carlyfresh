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
export function formatOrderWhatsAppMessage(
  order: WhatsAppOrderData,
  context: "general" | "to_vendor" | "to_buyer" | "to_driver" = "general"
): string {
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

  // Extract items with quantities and subtotals
  const itemsList: string[] = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach((item: any, idx: number) => {
      const name = item?.name || item?.product_name || item?.title || item?.product?.name || `Item ${idx + 1}`;
      const qty = item?.quantity || 1;
      const unit = item?.unit ? ` ${item.unit}` : "";
      const priceVal = Number(item?.price || item?.unit_price || 0);
      const priceStr = priceVal > 0 ? ` ➔ ${formatNaira(priceVal * Number(qty))}` : "";
      itemsList.push(`• *${name}* × ${qty}${unit}${priceStr}`);
    });
  }

  const appBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://carlyfresh.com";
  const trackingLink = `${appBaseUrl}/orders/${order.id}`;

  let header = `🛒 *CARLYFRESH ORDER SUMMARY*`;
  if (context === "to_vendor") {
    header = `🛒 *NEW ORDER NOTIFICATION — CarlyFresh*\n_Hello Seller, here are the full details for the new order placed at your store:_`;
  } else if (context === "to_buyer") {
    header = `🛒 *YOUR CARLYFRESH ORDER RECEIPT*\n_Hello, here is the confirmation & receipt for your recent order:_`;
  } else if (context === "to_driver") {
    header = `🚚 *CARLYFRESH DELIVERY JOB DETAILS*\n_Hello Driver, here are the pickup and dropoff details for this job:_`;
  }

  let msg = `${header}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *Order Number:* ${orderNum}\n`;
  msg += `📅 *Date & Time:* ${dateStr}\n`;
  msg += `🏷️ *Current Status:* ${statusLabel}\n`;
  msg += `💰 *Total Amount:* ${amountStr}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (itemsList.length > 0) {
    msg += `📦 *Items Ordered (${itemsList.length}):*\n`;
    msg += `${itemsList.join("\n")}\n\n`;
  }

  msg += `📍 *Delivery Details:*\n`;
  msg += `• *Address:* ${order.delivery_address || "Store / Kitchen Pickup"}\n`;
  if (order.delivery_window) {
    msg += `• *Time Slot:* ${order.delivery_window}\n`;
  }

  if (order.buyer?.full_name || order.buyer?.phone) {
    const buyerPhone = order.buyer?.phone ? ` (${order.buyer.phone})` : "";
    msg += `• *Customer:* ${order.buyer?.full_name || "Customer"}${buyerPhone}\n`;
  }

  if (order.vendor?.business_name || order.vendor?.full_name) {
    const vendorPhone = order.vendor?.phone ? ` (${order.vendor.phone})` : "";
    msg += `• *Vendor Store:* ${order.vendor?.business_name || order.vendor?.full_name}${vendorPhone}\n`;
  }

  if (order.driver?.full_name) {
    const driverPhone = order.driver?.phone ? ` (${order.driver.phone})` : "";
    msg += `• *Assigned Driver:* ${order.driver.full_name}${driverPhone}\n`;
  }

  msg += `\n🔗 *Track Live Order & Status:*\n${trackingLink}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Thank you for using CarlyFresh! Fresh groceries delivered fast._`;

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
export function openWhatsAppOrderDetails(
  order: WhatsAppOrderData,
  recipientPhone?: string | null,
  context: "general" | "to_vendor" | "to_buyer" | "to_driver" = "general"
): void {
  const message = formatOrderWhatsAppMessage(order, context);
  const url = getWhatsAppUrl(recipientPhone, message);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
