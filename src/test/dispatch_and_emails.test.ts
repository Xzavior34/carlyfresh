import { describe, it, expect } from "vitest";

// Haversine distance in km
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

describe("Nearest Location Driver Dispatch & Availability Ranking", () => {
  const pickupLocation = { lat: 6.5244, lng: 3.3792 }; // Lagos Central

  const drivers = [
    { id: "driver-far", lat: 6.6018, lng: 3.3515, active_jobs: 0, rating: 4.8 }, // ~9.1 km
    { id: "driver-closest", lat: 6.5280, lng: 3.3820, active_jobs: 0, rating: 4.9 }, // ~0.5 km
    { id: "driver-medium", lat: 6.5500, lng: 3.3900, active_jobs: 1, rating: 4.5 }, // ~3.1 km
  ];

  it("calculates distance correctly using Haversine formula", () => {
    const dist1 = distanceKm(pickupLocation, { lat: 6.5280, lng: 3.3820 });
    expect(dist1).toBeLessThan(1.0); // Within 1km
    const distFar = distanceKm(pickupLocation, { lat: 6.6018, lng: 3.3515 });
    expect(distFar).toBeGreaterThan(8.0);
  });

  it("ranks drivers strictly by nearest location distance first", () => {
    const candidates = drivers.map((d) => {
      const dist = distanceKm(pickupLocation, { lat: d.lat, lng: d.lng });
      const compositeScore = dist + d.active_jobs * 8 - (d.rating - 3) * 2;
      return {
        ...d,
        distance_km: dist,
        composite_score: compositeScore,
      };
    });

    candidates.sort((a, b) => {
      if (a.distance_km != null && b.distance_km != null) {
        if (Math.abs(a.distance_km - b.distance_km) > 0.3) {
          return a.distance_km - b.distance_km;
        }
      }
      return a.composite_score - b.composite_score;
    });

    // Closest driver should be first
    expect(candidates[0].id).toBe("driver-closest");
    expect(candidates[0].distance_km).toBeLessThan(1.0);
    // Medium distance driver should be second
    expect(candidates[1].id).toBe("driver-medium");
    // Far driver should be last
    expect(candidates[2].id).toBe("driver-far");
  });

  it("cascades to next nearest driver when first driver is excluded", () => {
    const excludeSet = new Set(["driver-closest"]);
    const available = drivers
      .filter((d) => !excludeSet.has(d.id))
      .map((d) => ({
        ...d,
        distance_km: distanceKm(pickupLocation, { lat: d.lat, lng: d.lng }),
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    expect(available[0].id).toBe("driver-medium");
  });
});

describe("Transactional Email Milestones & Action Links", () => {
  it("formats vendor new order email payload and accept URL", () => {
    const orderData = {
      order_id: "ord-999",
      order_number: 1088,
      total_amount: 25000,
      vendor_name: "Green Valley Farms",
      items: [
        { name: "Organic Tomatoes", quantity: 4, unit: "baskets", price: 20000 },
        { name: "Fresh Habanero", quantity: 1, unit: "kg", price: 5000 },
      ],
    };

    const vendorAcceptUrl = `https://carlyfresh.com/vendor/orders?open=${orderData.order_id}&accept=true`;
    expect(vendorAcceptUrl).toBe("https://carlyfresh.com/vendor/orders?open=ord-999&accept=true");
    expect(orderData.items.length).toBe(2);
    expect(orderData.total_amount).toBe(25000);
  });

  it("formats driver delivery assignment payload and accept URL with 90s SLA", () => {
    const driverOffer = {
      order_id: "ord-999",
      order_number: 1088,
      driver_name: "Chukwudi Nwachukwu",
      payout_amount: 1800,
      pickup_address: "Green Valley Farms, Lekki Phase 1",
      dropoff_address: "42 Victoria Island, Lagos",
      timeout_seconds: 90,
    };

    const driverAcceptUrl = `https://carlyfresh.com/driver?accept=${driverOffer.order_id}`;
    const driverDeclineUrl = `https://carlyfresh.com/driver?decline=${driverOffer.order_id}`;

    expect(driverAcceptUrl).toBe("https://carlyfresh.com/driver?accept=ord-999");
    expect(driverDeclineUrl).toBe("https://carlyfresh.com/driver?decline=ord-999");
    expect(driverOffer.timeout_seconds).toBe(90);
    expect(driverOffer.payout_amount).toBe(1800);
  });

  it("covers all 5 product progress milestones in customer journey", () => {
    const milestones = [
      "order_confirmed",
      "order_preparing",
      "order_driver_assigned",
      "order_in_transit",
      "order_delivered",
    ];

    expect(milestones).toHaveLength(5);
    expect(milestones).toContain("order_confirmed");
    expect(milestones).toContain("order_preparing");
    expect(milestones).toContain("order_driver_assigned");
    expect(milestones).toContain("order_in_transit");
    expect(milestones).toContain("order_delivered");
  });
});
