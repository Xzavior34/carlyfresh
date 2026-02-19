/**
 * ============================================================
 * CarlyFresh — Mock Dashboard Data
 * ============================================================
 * NOTE: This file contains all mock/fake data used across the
 * Buyer, Seller, and Driver dashboard portals.
 *
 * TODO: Replace with real API calls once backend is connected.
 * Each section is clearly marked with its intended data source.
 * ============================================================
 */

// ─── Types ───────────────────────────────────────────────────

export interface SellerMetrics {
  totalSales: number;
  pendingOrders: number;
  activeProducts: number;
  totalCustomers: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stockLevel: number;
  inStock: boolean;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: "pending" | "processing" | "packaged" | "in-transit" | "delivered" | "cancelled";
  date: string;
  deliveryAddress?: string;
}

export interface BuyerSubscription {
  plan: string;
  status: "active" | "paused" | "cancelled";
  nextDelivery: string;
  monthlySpend: number;
}

export interface ActiveOrder {
  id: string;
  status: "confirmed" | "preparing" | "out-for-delivery" | "delivered";
  vendorName: string;
  items: string[];
  estimatedArrival: string;
  driverName?: string;
}

export interface DriverJob {
  id: string;
  pickupVendor: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryArea: string;
  estimatedPayout: number;
  distance: string;
  items: string[];
}

export interface DriverEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  completedToday: number;
}

// ─── Seller Data ─────────────────────────────────────────────
// TODO: Fetch from Supabase `seller_metrics` view / RPC

export const sellerMetrics: SellerMetrics = {
  totalSales: 450000,
  pendingOrders: 12,
  activeProducts: 24,
  totalCustomers: 187,
};

// TODO: Fetch from Supabase `products` table filtered by seller_id
export const sellerInventory: InventoryItem[] = [
  { id: "p1", name: "Basket of Tomatoes", category: "Fresh Produce", price: 3500, stockLevel: 45, inStock: true },
  { id: "p2", name: "Palm Oil 5L", category: "Oils & Spices", price: 8500, stockLevel: 20, inStock: true },
  { id: "p3", name: "Fresh Catfish (1kg)", category: "Livestock", price: 4200, stockLevel: 12, inStock: true },
  { id: "p4", name: "Bag of Rice (50kg)", category: "Bulk/Wholesale", price: 42000, stockLevel: 8, inStock: true },
  { id: "p5", name: "Scotch Bonnet Peppers", category: "Fresh Produce", price: 2800, stockLevel: 0, inStock: false },
  { id: "p6", name: "Groundnut Oil 5L", category: "Oils & Spices", price: 7500, stockLevel: 15, inStock: true },
  { id: "p7", name: "Plantain Bunch", category: "Fresh Produce", price: 2000, stockLevel: 30, inStock: true },
  { id: "p8", name: "Dried Crayfish (500g)", category: "Oils & Spices", price: 3200, stockLevel: 0, inStock: false },
];

// TODO: Fetch from Supabase `orders` table filtered by seller_id, ordered by created_at DESC
export const sellerRecentOrders: Order[] = [
  { id: "ORD-1042", customerName: "Adaeze Okafor", items: ["Basket of Tomatoes", "Palm Oil 5L"], total: 12000, status: "pending", date: "2026-02-19T09:30:00Z" },
  { id: "ORD-1041", customerName: "Emeka Nwosu", items: ["Bag of Rice (50kg)"], total: 42000, status: "processing", date: "2026-02-19T08:15:00Z" },
  { id: "ORD-1040", customerName: "Ngozi Ibe", items: ["Fresh Catfish (1kg)", "Plantain Bunch"], total: 6200, status: "packaged", date: "2026-02-18T16:45:00Z" },
  { id: "ORD-1039", customerName: "Chidera Amadi", items: ["Groundnut Oil 5L", "Dried Crayfish (500g)"], total: 10700, status: "in-transit", date: "2026-02-18T14:20:00Z" },
  { id: "ORD-1038", customerName: "Bola Adeyemi", items: ["Scotch Bonnet Peppers", "Basket of Tomatoes"], total: 6300, status: "delivered", date: "2026-02-17T11:00:00Z" },
];

// ─── Buyer Data ──────────────────────────────────────────────
// TODO: Fetch from Supabase `subscriptions` table filtered by user_id

export const buyerSubscription: BuyerSubscription = {
  plan: "Fresh Premium",
  status: "active",
  nextDelivery: "Feb 21, 2026",
  monthlySpend: 35000,
};

// TODO: Fetch from Supabase `orders` table filtered by buyer_id, status != 'delivered'
export const buyerActiveOrders: ActiveOrder[] = [
  {
    id: "ORD-1042",
    status: "out-for-delivery",
    vendorName: "Mama Nkechi's Farm",
    items: ["Basket of Tomatoes", "Palm Oil 5L"],
    estimatedArrival: "20 mins",
    driverName: "Musa Ibrahim",
  },
];

// TODO: Fetch from Supabase `orders` table filtered by buyer_id, status = 'delivered'
export const buyerOrderHistory: Order[] = [
  { id: "ORD-1035", customerName: "You", items: ["Bag of Rice (50kg)", "Palm Oil 5L"], total: 50500, status: "delivered", date: "2026-02-15T10:00:00Z" },
  { id: "ORD-1028", customerName: "You", items: ["Fresh Catfish (1kg)", "Plantain Bunch", "Scotch Bonnet Peppers"], total: 9000, status: "delivered", date: "2026-02-10T14:30:00Z" },
  { id: "ORD-1020", customerName: "You", items: ["Basket of Tomatoes"], total: 3500, status: "delivered", date: "2026-02-05T09:00:00Z" },
];

// ─── Driver Data ─────────────────────────────────────────────
// TODO: Fetch from Supabase `delivery_jobs` table filtered by status = 'available'

export const driverAvailableJobs: DriverJob[] = [
  { id: "JOB-301", pickupVendor: "Mama Nkechi's Farm", pickupAddress: "12 Market Road, Aba", deliveryAddress: "45 GRA Phase 2, Port Harcourt", deliveryArea: "GRA Phase 2", estimatedPayout: 1500, distance: "8.2 km", items: ["Basket of Tomatoes", "Palm Oil 5L"] },
  { id: "JOB-302", pickupVendor: "Uncle Joe's Wholesale", pickupAddress: "3 Warehouse Lane, Onitsha", deliveryAddress: "17 Allen Avenue, Ikeja", deliveryArea: "Ikeja", estimatedPayout: 2200, distance: "12.5 km", items: ["Bag of Rice (50kg)"] },
  { id: "JOB-303", pickupVendor: "Fresh Valley Farms", pickupAddress: "Plot 7, Agric Settlement", deliveryAddress: "22 Lekki Phase 1", deliveryArea: "Lekki Phase 1", estimatedPayout: 1800, distance: "10.1 km", items: ["Fresh Catfish (1kg)", "Plantain Bunch"] },
];

// TODO: Fetch from Supabase `driver_earnings` view filtered by driver_id
export const driverEarnings: DriverEarnings = {
  today: 8500,
  thisWeek: 42000,
  thisMonth: 168000,
  completedToday: 6,
};

// ─── Helpers ─────────────────────────────────────────────────

export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

export const getStatusColor = (status: Order["status"]): string => {
  const colors: Record<Order["status"], string> = {
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    packaged: "bg-purple-100 text-purple-800",
    "in-transit": "bg-cyan-100 text-cyan-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status];
};
