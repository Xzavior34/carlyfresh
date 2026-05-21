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
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function AdminBaskets() {
  const [baskets, setBaskets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // --- EXPANDED RULE ENGINE STATE ---
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

  // Create / Edit Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingBasket, setEditingBasket] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", image: "" });
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
        .select("*, basket_items(*, product:products(*)), composition_rules")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBaskets(data || []);
    } catch (err: any) {
      toast({ title: "Error fetching baskets", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBaskets(); }, []);

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
      toast({ title: "Error fetching basket items", description: err.message, variant: "destructive" });
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
        toast({ title: "Search failed", description: err.message, variant: "destructive" });
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Open Add
  const openAdd = () => {
    setEditingBasket(null);
    setForm({ name: "", description: "", price: "", image: "" });
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
      mandatory_categories: r.mandatory_categories?.join(", ") || "",
      optional_categories: r.optional_categories?.join(", ") || "",
      audience_tags: r.audience_tags?.join(", ") || "",
      location_targeting: r.location_targeting || "",
      substitution_logic: r.substitution_logic || "closest_price",
      dynamic_pricing: r.dynamic_pricing || "fixed",
      prep_requirements: r.prep_requirements || "",
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
            mandatory_categories: rules.mandatory_categories.split(",").map((c) => c.trim()).filter(Boolean),
            optional_categories: rules.optional_categories.split(",").map((c) => c.trim()).filter(Boolean),
            audience_tags: rules.audience_tags.split(",").map((c) => c.trim()).filter(Boolean),
            location_targeting: rules.location_targeting.trim(),
            substitution_logic: rules.substitution_logic,
            dynamic_pricing: rules.dynamic_pricing,
            prep_requirements: rules.prep_requirements.trim(),
          },
        })
        .eq("id", selectedBasket.id);

      if (error) throw error;
      toast({ title: "Rules saved successfully" });
      setShowRulesModal(false);
      fetchBaskets();
    } catch (err: any) {
      toast({ title: "Failed to save rules", description: err.message, variant: "destructive" });
    }
  };

  // Save basket
  const saveBasket = async () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Basket name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) errors.price = "Valid price is required";
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
        const { error } = await supabase.from("baskets" as any).update(payload).eq("id", editingBasket.id);
        if (error) throw error;
        toast({ title: "Basket updated successfully" });
      } else {
        const { error } = await supabase.from("baskets" as any).insert([payload]);
        if (error) throw error;
        toast({ title: "Basket created successfully" });
      }
      setShowModal(false);
      fetchBaskets();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete basket
  const deleteBasket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this basket?")) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from("baskets" as any).delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Basket deleted successfully" });
      fetchBaskets();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  // Add Item
  const handleAddItem = async (product: any) => {
    if (!selectedBasket) return;
    const existing = basketItems.find((item) => item.product_id === product.id);
    if (existing) {
      toast({ title: "Info", description: "Product already exists in basket" });
      return;
    }
    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .insert([{ basket_id: selectedBasket.id, product_id: product.id, quantity: 1 }]);
      if (error) throw error;
      toast({ title: "Product added to basket" });
      fetchBasketItems(selectedBasket.id);
      fetchBaskets();
    } catch (err: any) {
      toast({ title: "Failed to add item", description: err.message, variant: "destructive" });
    }
  };

  // Update Qty
  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (!selectedBasket) return;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      const { error } = await supabase.from("basket_items" as any).update({ quantity: newQty }).eq("id", itemId);
      if (error) throw error;
      setBasketItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item)));
    } catch (err: any) {
      toast({ title: "Failed to update quantity", description: err.message, variant: "destructive" });
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: string) => {
    if (!selectedBasket) return;
    try {
      const { error } = await supabase.from("basket_items" as any).delete().eq("id", itemId);
      if (error) throw error;
      toast({ title: "Product removed from basket" });
      fetchBasketItems(selectedBasket.id);
      fetchBaskets();
    } catch (err: any) {
      toast({ title: "Failed to remove item", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Hybrid Basket Engine
          </h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">
            Static SKU baskets + intelligent rule-based composition
          </p>
        </div>
        <Button size="sm" className="font-body gap-1" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Create Basket
        </Button>
      </div>

      {/* Basket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {baskets.map((basket) => (
          <Card
            key={basket.id}
            className="overflow-hidden border border-border group flex flex-col justify-between hover:shadow-lg transition-all duration-300"
          >
            <div>
              {/* Image */}
              <div className="h-48 w-full overflow-hidden bg-muted relative">
                {basket.image ? (
                  <img
                    src={basket.image}
                    alt={basket.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 stroke-[1.2]" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold">
                  {basket.basket_items?.length || 0} items
                </div>
              </div>

              {/* Info */}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-display font-bold">
                    {basket.name}
                  </CardTitle>
                  <span className="font-body font-bold text-lg text-primary">
                    {formatNaira(basket.price)}
                  </span>
                </div>
                <CardDescription className="font-body text-sm line-clamp-2 mt-1">
                  {basket.description || "No description available"}
                </CardDescription>
              </CardHeader>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex flex-wrap gap-2 mt-auto border-t border-border/40">
              <Button variant="outline" size="sm" onClick={() => openManageItems(basket)}>
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Items
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openRules(basket)}>
                <Settings className="h-3.5 w-3.5 mr-1.5" /> Rules
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEdit(basket)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deleting === basket.id}
                onClick={() => deleteBasket(basket.id)}
              >
                {deleting === basket.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingBasket ? "Edit Basket" : "Create Basket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Basket Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
            </div>
            <ImageUploadInput value={form.image} onChange={(url) => setForm((prev) => ({ ...prev, image: url }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={saveBasket} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBasket ? "Save Changes" : "Create Basket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RULES DIALOG */}
      <Dialog open={showRulesModal} onOpenChange={setShowRulesModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Composition Engine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mandatory Categories (comma-separated)</Label>
              <Input placeholder="Vegetables, Protein, Spices" value={rules.mandatory_categories} onChange={(e) => setRules((prev) => ({ ...prev, mandatory_categories: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Optional Categories (comma-separated)</Label>
              <Input placeholder="Snacks, Drinks" value={rules.optional_categories} onChange={(e) => setRules((prev) => ({ ...prev, optional_categories: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Audience Tags (comma-separated)</Label>
              <Input placeholder="Family, Keto, Students" value={rules.audience_tags} onChange={(e) => setRules((prev) => ({ ...prev, audience_tags: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Location Targeting</Label>
              <Input placeholder="Lagos Mainland" value={rules.location_targeting} onChange={(e) => setRules((prev) => ({ ...prev, location_targeting: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Substitution Logic</Label>
                <Select value={rules.substitution_logic} onValueChange={(v) => setRules((prev) => ({ ...prev, substitution_logic: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closest_price">Closest Price</SelectItem>
                    <SelectItem value="highest_freshness">Highest Freshness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dynamic Pricing</Label>
                <Select value={rules.dynamic_pricing} onValueChange={(v) => setRules((prev) => ({ ...prev, dynamic_pricing: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Pricing</SelectItem>
                    <SelectItem value="calculated">Calculated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prep Requirements</Label>
              <Input placeholder="Wash vegetables before dispatch" value={rules.prep_requirements} onChange={(e) => setRules((prev) => ({ ...prev, prep_requirements: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveRules}>Apply Rules</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANAGE ITEMS DIALOG */}
      <Dialog open={showItemsModal} onOpenChange={setShowItemsModal}>
        <DialogContent className="w-[95vw] sm:max-w-3xl rounded-xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Manage Items in "{selectedBasket?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 my-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                <h3 className="font-bold text-sm uppercase">Find Products</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                        <div>
                          <p className="text-xs font-semibold">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatNaira(product.price)}</p>
                        </div>
                        <Button size="sm" onClick={() => handleAddItem(product)}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">Search products to add them</p>
                  )}
                </div>
              </div>
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-bold text-sm uppercase">Basket Contents</h3>
                <div className="border rounded-xl overflow-hidden bg-card">
                  {itemsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin mb-2" /> Loading...</div>
                  ) : basketItems.length > 0 ? (
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {basketItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-xs font-semibold">{item.product?.name}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleUpdateQty(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                  <span className="text-xs font-semibold">{item.quantity}</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleUpdateQty(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground text-center">This basket has no items yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => setShowItemsModal(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
