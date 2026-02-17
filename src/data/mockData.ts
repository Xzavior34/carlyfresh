/**
 * DATA SOURCE: Local Mock for UI Demo
 * CURRENT STATUS: Using Mock Data for Client Demo
 * TODO: Connect to Supabase Backend after client approval
 */

export interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tag?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  tag?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  recommended?: boolean;
}

export interface HowItWorksStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Review {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface BusinessBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// TODO: Connect to Supabase Backend
export const bundles: Bundle[] = [
  {
    id: "breakfast-essentials",
    name: "Breakfast Essentials",
    description: "Start your morning with farm-fresh eggs, artisan bread, and organic juice.",
    price: 24.99,
    image: "breakfast",
    tag: "Popular",
  },
  {
    id: "family-feast-box",
    name: "Family Feast Box",
    description: "A complete dinner spread for 4, featuring seasonal vegetables and premium cuts.",
    price: 49.99,
    image: "family",
    tag: "Best Value",
  },
  {
    id: "fruits-collection",
    name: "Fruits Collection",
    description: "A vibrant mix of tropical and seasonal fruits, handpicked at peak ripeness.",
    price: 19.99,
    image: "fruits",
  },
  {
    id: "chefs-special",
    name: "Chef's Special",
    description: "Curated ingredients for gourmet home cooking. Recipes included.",
    price: 39.99,
    image: "chef",
    tag: "New",
  },
];

// TODO: Connect to Supabase Backend
export const products: Product[] = [
  { id: "p1", name: "Organic Tomatoes", price: 3.99, category: "Vegetables", image: "🍅", description: "Vine-ripened organic tomatoes, 1kg pack." },
  { id: "p2", name: "Fresh Spinach", price: 2.49, category: "Vegetables", image: "🥬", description: "Crisp baby spinach leaves, 500g." },
  { id: "p3", name: "Bell Peppers Mix", price: 4.99, category: "Vegetables", image: "🫑", description: "Red, yellow & green peppers, 3 pack." },
  { id: "p4", name: "Sweet Potatoes", price: 3.29, category: "Vegetables", image: "🍠", description: "Farm-fresh sweet potatoes, 1kg." },
  { id: "p5", name: "Tropical Mango", price: 5.99, category: "Fruits", image: "🥭", description: "Ripe Alphonso mangoes, 3 pack.", tag: "Popular" },
  { id: "p6", name: "Strawberry Punnet", price: 4.49, category: "Fruits", image: "🍓", description: "Hand-picked strawberries, 400g." },
  { id: "p7", name: "Banana Bunch", price: 1.99, category: "Fruits", image: "🍌", description: "Organic Cavendish bananas, 6 pack." },
  { id: "p8", name: "Avocados", price: 6.49, category: "Fruits", image: "🥑", description: "Hass avocados, perfectly ripe, 4 pack.", tag: "New" },
  { id: "p9", name: "Breakfast Essentials", price: 24.99, category: "Bundles", image: "🥐", description: "Eggs, bread, juice & jam — morning sorted.", tag: "Best Value" },
  { id: "p10", name: "Family Feast Box", price: 49.99, category: "Bundles", image: "🍱", description: "Complete dinner for 4 with premium cuts." },
  { id: "p11", name: "Extra Virgin Olive Oil", price: 12.99, category: "Oils", image: "🫒", description: "Cold-pressed Italian olive oil, 500ml." },
  { id: "p12", name: "Coconut Oil", price: 8.99, category: "Oils", image: "🥥", description: "Organic virgin coconut oil, 500ml." },
  { id: "p13", name: "Chef's Special", price: 39.99, category: "Bundles", image: "👨‍🍳", description: "Curated gourmet ingredients with recipes.", tag: "New" },
  { id: "p14", name: "Red Onions", price: 2.29, category: "Vegetables", image: "🧅", description: "Fresh red onions, 1kg bag." },
];

// TODO: Connect to Supabase Backend
export const productCategories = ["All", "Vegetables", "Fruits", "Bundles", "Oils"];

// TODO: Connect to Supabase Backend
export const reviews: Review[] = [
  {
    id: "r1",
    name: "Mabel",
    text: "CarlyFresh gives so fast. It is amazing.",
    rating: 5,
  },
  {
    id: "r2",
    name: "Uduak",
    text: "I like that the packaging maintains the freshness, and it comes all cleaned.",
    rating: 5,
  },
  {
    id: "r3",
    name: "Oluch",
    text: "The customer service explains well, that's what I find cool and my supply is now steady.",
    rating: 5,
  },
];

// TODO: Connect to Supabase Backend
export const features: Feature[] = [
  {
    id: "f1",
    title: "Farm-Fresh",
    description: "Sourced directly from local farms. No middlemen, no stale produce.",
    icon: "Leaf",
  },
  {
    id: "f2",
    title: "Fast Delivery",
    description: "Same-day and next-day delivery to your doorstep.",
    icon: "Truck",
  },
  {
    id: "f3",
    title: "Affordable",
    description: "Wholesale pricing passed on to you. Save up to 30% vs retail.",
    icon: "BadgeDollarSign",
  },
];

// TODO: Connect to Supabase Backend
export const businessBenefits: BusinessBenefit[] = [
  {
    id: "b1",
    title: "Bulk Pricing",
    description: "Volume discounts that scale with your order size. Save more when you buy more.",
    icon: "TrendingDown",
  },
  {
    id: "b2",
    title: "Dedicated Account Manager",
    description: "A single point of contact who understands your business needs.",
    icon: "UserCheck",
  },
  {
    id: "b3",
    title: "Flexible Delivery",
    description: "Schedule deliveries that fit your business hours. Daily, weekly, or custom.",
    icon: "CalendarClock",
  },
];

// TODO: Connect to Supabase Backend
export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    period: "mo",
    features: [
      "Pay per delivery",
      "Standard delivery (2-3 days)",
      "Access to all bundles",
      "Basic order tracking",
    ],
  },
  {
    id: "fresh-premium",
    name: "Fresh Premium",
    price: 29.99,
    period: "mo",
    features: [
      "Free unlimited delivery",
      "Priority delivery (same day)",
      "Exclusive premium bundles",
      "Advanced order tracking",
      "Priority customer support",
      "Early access to new products",
    ],
    recommended: true,
  },
  {
    id: "premium-plus",
    name: "Premium Plus",
    price: 49.99,
    period: "mo",
    features: [
      "Everything in Fresh Premium",
      "Dedicated account manager",
      "Custom bundle builder",
      "Bulk order discounts",
      "API access for businesses",
      "White-glove onboarding",
      "24/7 priority support",
    ],
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: 1,
    title: "Discover",
    description: "Browse curated bundles and fresh produce from local farms.",
    icon: "Search",
  },
  {
    id: 2,
    title: "Order",
    description: "Add items to your cart and checkout in under 60 seconds.",
    icon: "ShoppingBag",
  },
  {
    id: 3,
    title: "Track",
    description: "Follow your order in real-time from farm to your doorstep.",
    icon: "MapPin",
  },
  {
    id: 4,
    title: "Enjoy",
    description: "Unbox the freshest food, delivered with care and love.",
    icon: "Smile",
  },
];

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "To Buy", href: "/shop" },
  { label: "To Sell", href: "/business" },
  { label: "Business", href: "/business" },
  { label: "Support", href: "/contact" },
];
