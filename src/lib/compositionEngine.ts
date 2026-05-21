import { supabase } from "@/integrations/supabase/client";

export interface BasketRule {
  mandatoryCategories: string[];
  audienceTags: string[];
  location: string; // The user's delivery location
}

/**
 * Resolves a template into a grouped fulfillment plan.
 * Returns an object where keys are vendor_ids and values are the items they must fulfill.
 */
export async function resolveBasketComposition(rules: BasketRule) {
  // 1. Fetch relevant products with vendor/location data
  // Note: 'status' should match your DB (e.g., 'available' or 'in_stock')
  const { data: products, error } = await supabase
    .from('products')
    .select('*, profiles(full_name, farm_location)') 
    .in('category', rules.mandatoryCategories)
    .eq('in_stock', true) // Using in_stock based on your schema
    .order('freshness_status', { ascending: false }); // Sort by freshness

  if (error) throw error;

  // 2. Intelligent Assignment: Group by vendor_id for distributed fulfillment
  const fulfillmentPlan = products.reduce((acc: any, item: any) => {
    const vendorId = item.vendor_id;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor_id: vendorId,
        items: [],
        total_value: 0
      };
    }
    acc[vendorId].items.push(item);
    acc[vendorId].total_value += item.price;
    return acc;
  }, {});

  return fulfillmentPlan;
}
