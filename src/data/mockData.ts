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

// TODO: Connect to Supabase Backend
// CURRENT STATUS: Using Mock Data for Client Demo
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
    price: 29,
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
  { label: "Home", href: "#home" },
  { label: "To Buy", href: "#bundles" },
  { label: "To Sell", href: "#tosell" },
  { label: "Business", href: "#pricing" },
  { label: "Support", href: "#footer" },
];
