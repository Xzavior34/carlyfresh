import { describe, it, expect } from "vitest";
import { formatNaira, getStatusColor } from "@/lib/formatters";
import {
  normalizePhoneForWhatsApp,
  formatOrderWhatsAppMessage,
  getWhatsAppUrl,
  type WhatsAppOrderData,
} from "@/lib/whatsapp";

describe("formatters", () => {
  describe("formatNaira", () => {
    it("formats whole numbers correctly", () => {
      expect(formatNaira(5000)).toBe("₦5,000");
      expect(formatNaira(0)).toBe("₦0");
      expect(formatNaira(1250000)).toBe("₦1,250,000");
    });

    it("handles string numbers", () => {
      expect(formatNaira("3500")).toBe("₦3,500");
    });
  });

  describe("getStatusColor", () => {
    it("returns correct color classes for standard statuses", () => {
      expect(getStatusColor("delivered")).toContain("emerald");
      expect(getStatusColor("pending")).toContain("amber");
      expect(getStatusColor("cancelled")).toContain("red");
    });
  });
});

describe("whatsapp helpers", () => {
  describe("normalizePhoneForWhatsApp", () => {
    it("normalizes 11-digit local Nigerian numbers", () => {
      expect(normalizePhoneForWhatsApp("08012345678")).toBe("2348012345678");
      expect(normalizePhoneForWhatsApp("09098765432")).toBe("2349098765432");
    });

    it("normalizes numbers with international +234 prefix", () => {
      expect(normalizePhoneForWhatsApp("+2348012345678")).toBe("2348012345678");
      expect(normalizePhoneForWhatsApp("+234 801 234 5678")).toBe("2348012345678");
    });

    it("handles already normalized numbers", () => {
      expect(normalizePhoneForWhatsApp("2348012345678")).toBe("2348012345678");
    });

    it("handles empty or null gracefully", () => {
      expect(normalizePhoneForWhatsApp("")).toBe("");
      expect(normalizePhoneForWhatsApp(null)).toBe("");
      expect(normalizePhoneForWhatsApp(undefined)).toBe("");
    });
  });

  describe("getWhatsAppUrl", () => {
    it("generates wa.me link with phone number and text", () => {
      const url = getWhatsAppUrl("08012345678", "Hello World");
      expect(url).toContain("https://wa.me/2348012345678?text=Hello%20World");
    });

    it("generates fallback wa.me link without phone", () => {
      const url = getWhatsAppUrl(null, "Hello World");
      expect(url).toContain("https://wa.me/?text=Hello%20World");
    });
  });

  describe("formatOrderWhatsAppMessage", () => {
    const sampleOrder: WhatsAppOrderData = {
      id: "abc-1234-5678",
      order_number: 1042,
      created_at: "2026-09-19T10:30:00Z",
      status: "paid",
      total_amount: 15000,
      delivery_address: "12 Marina Street, Lagos",
      delivery_window: "2:00 PM - 4:00 PM",
      items: [
        { name: "Fresh Tomatoes", quantity: 2, unit: "basket", price: 5000 },
        { name: "Scotch Bonnet", quantity: 1, unit: "kg", price: 5000 },
      ],
      buyer: { full_name: "Adeola Johnson", phone: "08012345678" },
      vendor: { business_name: "Lagos Fresh Market", phone: "08098765432" },
      driver: { full_name: "Emeka Okonkwo", phone: "07011223344" },
    };

    it("formats correctly for to_vendor context", () => {
      const msg = formatOrderWhatsAppMessage(sampleOrder, "to_vendor");
      expect(msg).toContain("NEW ORDER NOTIFICATION — CarlyFresh");
      expect(msg).toContain("#1042");
      expect(msg).toContain("Fresh Tomatoes");
      expect(msg).toContain("₦15,000");
      expect(msg).toContain("Adeola Johnson");
      expect(msg).toContain("12 Marina Street, Lagos");
    });

    it("formats correctly for to_buyer context", () => {
      const msg = formatOrderWhatsAppMessage(sampleOrder, "to_buyer");
      expect(msg).toContain("YOUR CARLYFRESH ORDER RECEIPT");
      expect(msg).toContain("#1042");
      expect(msg).toContain("₦15,000");
    });

    it("formats correctly for to_driver context", () => {
      const msg = formatOrderWhatsAppMessage(sampleOrder, "to_driver");
      expect(msg).toContain("CARLYFRESH DELIVERY JOB DETAILS");
      expect(msg).toContain("#1042");
    });
  });
});
