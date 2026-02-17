

# Multi-Page CarlyFresh E-Commerce Application

## Overview
Transform the current single-page scroll site into a full multi-page e-commerce application with 6 routes, all running on mock data. Every link and button will navigate to a real, designed page.

## New Pages

### 1. `/shop` - The Marketplace
- Full product grid with 12+ products across categories (Vegetables, Fruits, Bundles, Oils)
- Sidebar with category filters and a search input
- Each product card has image, price, name, and an "Add to Cart" button that updates the global cart
- Responsive: sidebar collapses to a top filter bar on mobile

### 2. `/business` - B2B Wholesale Page
- Hero section: "Wholesale Prices for Restaurants, Hotels, and Caterers"
- Benefits grid (Bulk Pricing, Dedicated Account Manager, Flexible Delivery)
- Bulk Order Inquiry form using React Hook Form + Zod validation (Company Name, Contact Person, Email, Phone, Estimated Volume, Message)
- On submit: show success toast (simulated)

### 3. `/pricing` - Subscription Plans
- Three tiers: Free (0/mo), Fresh Premium (29.99/mo), Premium Plus (49.99/mo)
- Monthly/Yearly toggle switch (yearly shows 20% discount)
- Feature comparison with checkmarks
- "Recommended" badge on Premium tier

### 4. `/contact` - Support Page
- Green header banner: "Contact Us"
- Contact form: First Name, Last Name, Email, Message (React Hook Form + Zod)
- On submit: success toast notification (simulated)
- Sidebar with address (52 Ikwere Road, Port Harcourt), phone, email, and operating hours

### 5. `/about` - Mission Page
- Hero with warm cafe/farm imagery
- Mission statement: "Food is essential to life... Farmers struggle to reach buyers..."
- Team/values grid
- Stats section (farms partnered, deliveries made, etc.)

## Changes to Existing Code

### Updated Home Page (`/`)
- Add a "Why Shop With Us?" features section (Farm-Fresh, Fast Delivery, Affordable)
- Add a Reviews carousel with testimonials from Mabel, Uduak, and Oluch (exact text from brief)
- Add "Join To Eat Healthy" banner with "Subscribe Now" linking to `/pricing`
- Bundle cards' "More" link navigates to `/shop`
- "Buy Now" hero CTA links to `/shop`

### Updated Navbar
- Convert all anchor links (`#home`, `#bundles`) to proper React Router `Link` components
- Menu items: Home (`/`), To Buy (`/shop`), To Sell (stays as section on home or links to `/business`), Business (`/business`), Support (`/contact`)
- Add Login link pointing to `/pricing`
- Cart icon persists across all pages

### Updated Footer
- All links become real routes: Home, Buy (`/shop`), Sell, Business (`/business`), Help (`/contact`), Privacy Policy, Terms, Refund Policy
- Address: "52 Ikwere Road, Port Harcourt"
- Updated copyright line

### Updated Data File (`src/data/mockData.ts`)
- Add `products` array with 12+ items across categories
- Add `reviews` array with Mabel, Uduak, Oluch testimonials
- Add `features` array for "Why Shop With Us"
- Add `businessBenefits` array
- Add `PremiumPlus` pricing tier
- All new data annotated with `// TODO: Connect to Supabase Backend`

## New Components

| Component | Purpose |
|-----------|---------|
| `src/components/products/ProductCard.tsx` | Reusable card with Add to Cart |
| `src/components/products/ProductGrid.tsx` | Grid layout with filter sidebar |
| `src/components/products/CategoryFilter.tsx` | Sidebar filter by category |
| `src/components/products/ReviewCarousel.tsx` | Testimonials carousel |
| `src/components/products/FeaturesSection.tsx` | "Why Shop With Us" grid |
| `src/components/products/HealthyBanner.tsx` | "Join To Eat Healthy" CTA |
| `src/components/forms/ContactForm.tsx` | Validated contact form |
| `src/components/forms/BusinessForm.tsx` | Bulk order inquiry form |

## New Pages

| File | Route |
|------|-------|
| `src/pages/Shop.tsx` | `/shop` |
| `src/pages/Business.tsx` | `/business` |
| `src/pages/PricingPage.tsx` | `/pricing` |
| `src/pages/Contact.tsx` | `/contact` |
| `src/pages/About.tsx` | `/about` |

## Routing Update (`src/App.tsx`)
- Add all 5 new routes
- Wrap layout with shared Navbar and Footer via a layout component or include them in each page

## Technical Details

- **Forms**: React Hook Form with Zod schemas for input validation (name max 100 chars, email validation, message max 1000 chars). On submit, simulate a 200 OK with a `sonner` toast.
- **Cart persistence**: The existing `CartContext` already works across routes since it wraps `BrowserRouter`. No changes needed.
- **Pricing toggle**: A `useState` boolean for monthly/yearly. Yearly prices = monthly * 12 * 0.8 (20% off).
- **Transparency comments**: Every page and data section will include `// NOTE:` and `// TODO:` comments explaining mock status and what to connect later.
- **No dead links**: Every button, nav item, and footer link will use `react-router-dom`'s `Link` or `useNavigate`.

