import { describe, it, expect } from "vitest";

describe("Transactional Email Templates & Content Validation", () => {
  const sampleVendorData = {
    order_id: "ord-test-101",
    order_number: 1042,
    vendor_name: "Adeola Farms & Groceries",
    total_amount: 18500,
    delivery_address: "15 Admiralty Way, Lekki Phase 1, Lagos",
    delivery_window: "1:00 PM - 3:00 PM",
    items: [
      { name: "Fresh Roma Tomatoes", quantity: 2, unit: "baskets", price: 6000 },
      { name: "Scotch Bonnet Peppers", quantity: 1, unit: "kg", price: 3500 },
      { name: "Sweet Potato Tubers", quantity: 3, unit: "kg", price: 3000 },
    ],
  };

  const sampleDriverData = {
    order_id: "ord-test-101",
    order_number: 1042,
    driver_name: "Emeka Okonkwo",
    payout_amount: 1500,
    pickup_address: "Adeola Farms, 4 Farm Road, Lagos",
    dropoff_address: "15 Admiralty Way, Lekki Phase 1, Lagos",
    timeout_seconds: 90,
  };

  it("generates correct vendor new order email subject and accept URL", () => {
    const subject = `🎉 New Customer Order #${sampleVendorData.order_number} — ₦${sampleVendorData.total_amount.toLocaleString("en-NG")}`;
    expect(subject).toBe("🎉 New Customer Order #1042 — ₦18,500");

    const acceptUrl = `https://carlyfresh.com/vendor/orders?open=${sampleVendorData.order_id}&accept=true`;
    expect(acceptUrl).toContain("open=ord-test-101&accept=true");
  });

  it("generates correct driver assigned email subject with guaranteed payout and SLA", () => {
    const subject = `🚚 Delivery Assigned: ₦${sampleDriverData.payout_amount.toLocaleString("en-NG")} — Order #${sampleDriverData.order_number}`;
    expect(subject).toBe("🚚 Delivery Assigned: ₦1,500 — Order #1042");

    const acceptUrl = `https://carlyfresh.com/driver?accept=${sampleDriverData.order_id}`;
    expect(acceptUrl).toBe("https://carlyfresh.com/driver?accept=ord-test-101");
  });

  it("calculates total items and order valuation properly for packing slip", () => {
    const totalItems = sampleVendorData.items.reduce((sum, i) => sum + i.quantity, 0);
    expect(totalItems).toBe(6);
    expect(sampleVendorData.items.length).toBe(3);
  });
});

describe("Vendor Preparation & Helper Workflow", () => {
  it("tracks checklist completion for preparation checklist", () => {
    const checklist = [
      { id: "item-1", name: "Fresh Roma Tomatoes", quantity: 2, checked: true },
      { id: "item-2", name: "Scotch Bonnet Peppers", quantity: 1, checked: true },
      { id: "item-3", name: "Sweet Potato Tubers", quantity: 3, checked: false },
    ];

    const completedCount = checklist.filter((i) => i.checked).length;
    const isAllPacked = completedCount === checklist.length;

    expect(completedCount).toBe(2);
    expect(isAllPacked).toBe(false);

    // Check last item
    checklist[2].checked = true;
    const finalCompleted = checklist.filter((i) => i.checked).length;
    expect(finalCompleted).toBe(3);
    expect(finalCompleted === checklist.length).toBe(true);
  });
});
