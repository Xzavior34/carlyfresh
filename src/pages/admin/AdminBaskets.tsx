/**
 * Admin Baskets — HYBRID: Static SKU-based + Dynamic Rule-based Engine
 */

import { useState, useEffect } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShoppingBag,
  Search,
  Minus,
  Settings,
} from "lucide-react";

import ImageUploadInput from "@/components/products/ImageUploadInput";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function AdminBaskets() {
  const [baskets, setBaskets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Rules
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [rules, setRules] = useState({
    mandatory_categories: "",
    optional_categories: "",
    audience_tags: "",
    location_targeting: "",
    substitution_logic: "closest_price",
    dynamic_pricing: "fixed",
    prep_requirements: "",
  });

  // Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingBasket, setEditingBasket] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Manage Items
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [basketItems, setBasketItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Fetch baskets
  const fetchBaskets = async () => {
    try {
      const { data, error } = await supabase
        .from("baskets" as any)
        .select(
          "*, basket_items(*, product:products(*)), composition_rules"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBaskets(data || []);
    } catch (err: any) {
      toast({
        title: "Error fetching baskets",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaskets();
  }, []);

  // Fetch basket items
  const fetchBasketItems = async (basketId: string) => {
    setItemsLoading(true);

    try {
      const { data, error } = await supabase
        .from("basket_items" as any)
        .select("*, product:products(*)")
        .eq("basket_id", basketId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setBasketItems(data || []);
    } catch (err: any) {
      toast({
        title: "Error fetching basket items",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setItemsLoading(false);
    }
  };

  // Search products
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .ilike("name", `%${searchQuery}%`)
          .limit(6);

        if (error) throw error;

        setSearchResults(data || []);
      } catch (err: any) {
        toast({
          title: "Search failed",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Open Add
  const openAdd = () => {
    setEditingBasket(null);

    setForm({
      name: "",
      description: "",
      price: "",
      image: "",
    });

    setFormErrors({});
    setShowModal(true);
  };

  // Open Edit
  const openEdit = (basket: any) => {
    setEditingBasket(basket);

    setForm({
      name: basket.name,
      description: basket.description || "",
      price: String(basket.price),
      image: basket.image || "",
    });

    setFormErrors({});
    setShowModal(true);
  };

  // Open Manage Items
  const openManageItems = (basket: any) => {
    setSelectedBasket(basket);

    setSearchQuery("");
    setSearchResults([]);

    fetchBasketItems(basket.id);

    setShowItemsModal(true);
  };

  // Open Rules
  const openRules = (basket: any) => {
    setSelectedBasket(basket);

    const r = basket.composition_rules || {};

    setRules({
      mandatory_categories:
        r.mandatory_categories?.join(", ") || "",

      optional_categories:
        r.optional_categories?.join(", ") || "",

      audience_tags:
        r.audience_tags?.join(", ") || "",

      location_targeting:
        r.location_targeting || "",

      substitution_logic:
        r.substitution_logic || "closest_price",

      dynamic_pricing:
        r.dynamic_pricing || "fixed",

      prep_requirements:
        r.prep_requirements || "",
    });

    setShowRulesModal(true);
  };

  // Save Rules
  const saveRules = async () => {
    if (!selectedBasket) return;

    try {
      const { error } = await supabase
        .from("baskets" as any)
        .update({
          composition_rules: {
            mandatory_categories: rules.mandatory_categories
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),

            optional_categories: rules.optional_categories
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),

            audience_tags: rules.audience_tags
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),

            location_targeting:
              rules.location_targeting,

            substitution_logic:
              rules.substitution_logic,

            dynamic_pricing:
              rules.dynamic_pricing,

            prep_requirements:
              rules.prep_requirements,
          },
        })
        .eq("id", selectedBasket.id);

      if (error) throw error;

      toast({
        title: "Rules saved successfully",
      });

      setShowRulesModal(false);

      fetchBaskets();
    } catch (err: any) {
      toast({
        title: "Failed to save rules",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Save basket
  const saveBasket = async () => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Basket name is required";
    }

    if (
      !form.price ||
      isNaN(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      errors.price = "Valid price is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      image: form.image || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingBasket) {
        const { error } = await supabase
          .from("baskets" as any)
          .update(payload)
          .eq("id", editingBasket.id);

        if (error) throw error;

        toast({
          title: "Basket updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("baskets" as any)
          .insert([payload]);

        if (error) throw error;

        toast({
          title: "Basket created successfully",
        });
      }

      setShowModal(false);

      fetchBaskets();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete basket
  const deleteBasket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this basket?")) {
      return;
    }

    setDeleting(id);

    try {
      const { error } = await supabase
        .from("baskets" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Basket deleted successfully",
      });

      fetchBaskets();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  // Add Item
  const handleAddItem = async (product: any) => {
    if (!selectedBasket) return;

    const existing = basketItems.find(
      (item) => item.product_id === product.id
    );

    if (existing) {
      toast({
        title: "Info",
        description: "Product already exists in basket",
      });

      return;
    }

    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .insert([
          {
            basket_id: selectedBasket.id,
            product_id: product.id,
            quantity: 1,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Product added to basket",
      });

      fetchBasketItems(selectedBasket.id);
      fetchBaskets();
    } catch (err: any) {
      toast({
        title: "Failed to add item",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Update Qty
  const handleUpdateQty = async (
    itemId: string,
    newQty: number
  ) => {
    if (!selectedBasket) return;

    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .update({
          quantity: newQty,
        })
        .eq("id", itemId);

      if (error) throw error;

      setBasketItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: newQty,
              }
            : item
        )
      );
    } catch (err: any) {
      toast({
        title: "Failed to update quantity",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: string) => {
    if (!selectedBasket) return;

    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Product removed from basket",
      });

      fetchBasketItems(selectedBasket.id);
      fetchBaskets();
    } catch (err: any) {
      toast({
        title: "Failed to remove item",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div>
      {/* KEEP YOUR EXISTING JSX */}

      {/* RULES DIALOG */}

      <Dialog
        open={showRulesModal}
        onOpenChange={setShowRulesModal}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Configure Composition Engine
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mandatory */}
            <div className="space-y-2">
              <Label>
                Mandatory Categories
              </Label>

              <Input
                placeholder="Vegetables, Protein, Spices"
                value={rules.mandatory_categories}
                onChange={(e) =>
                  setRules((prev) => ({
                    ...prev,
                    mandatory_categories:
                      e.target.value,
                  }))
                }
              />
            </div>

            {/* Optional */}
            <div className="space-y-2">
              <Label>
                Optional Categories
              </Label>

              <Input
                placeholder="Snacks, Drinks"
                value={rules.optional_categories}
                onChange={(e) =>
                  setRules((prev) => ({
                    ...prev,
                    optional_categories:
                      e.target.value,
                  }))
                }
              />
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label>
                Audience Tags
              </Label>

              <Input
                placeholder="Family, Keto, Students"
                value={rules.audience_tags}
                onChange={(e) =>
                  setRules((prev) => ({
                    ...prev,
                    audience_tags:
                      e.target.value,
                  }))
                }
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>
                Location Targeting
              </Label>

              <Input
                placeholder="Lagos Mainland"
                value={rules.location_targeting}
                onChange={(e) =>
                  setRules((prev) => ({
                    ...prev,
                    location_targeting:
                      e.target.value,
                  }))
                }
              />
            </div>

            {/* Substitution */}
            <div className="space-y-2">
              <Label>
                Substitution Logic
              </Label>

              <Select
                value={rules.substitution_logic}
                onValueChange={(v) =>
                  setRules((prev) => ({
                    ...prev,
                    substitution_logic: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="closest_price">
                    Closest Price
                  </SelectItem>

                  <SelectItem value="highest_freshness">
                    Highest Freshness
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Pricing */}
            <div className="space-y-2">
              <Label>
                Dynamic Pricing
              </Label>

              <Select
                value={rules.dynamic_pricing}
                onValueChange={(v) =>
                  setRules((prev) => ({
                    ...prev,
                    dynamic_pricing: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="fixed">
                    Fixed Pricing
                  </SelectItem>

                  <SelectItem value="market_rate">
                    Market Rate
                  </SelectItem>

                  <SelectItem value="surge">
                    Surge Pricing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prep */}
            <div className="space-y-2">
              <Label>
                Prep Requirements
              </Label>

              <Input
                placeholder="Wash vegetables before dispatch"
                value={rules.prep_requirements}
                onChange={(e) =>
                  setRules((prev) => ({
                    ...prev,
                    prep_requirements:
                      e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveRules}>
              Apply Rules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
            }
