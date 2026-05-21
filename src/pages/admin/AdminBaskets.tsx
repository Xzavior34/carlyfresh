/**
 * Admin Baskets — Basket Builder and Curated Combo Management
 */

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, ShoppingBag, Search, Minus, X } from "lucide-react";
import ImageUploadInput from "@/components/products/ImageUploadInput";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function AdminBaskets() {
  const [baskets, setBaskets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Create / Edit Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingBasket, setEditingBasket] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sub-interface: Manage Items Modal States
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [basketItems, setBasketItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Fetch Baskets
  const fetchBaskets = async () => {
    try {
      const { data, error } = await supabase
        .from("baskets" as any)
        .select("*, basket_items(*, product:products(*))")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBaskets(data || []);
    } catch (err: any) {
      toast({ title: "Error fetching baskets", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaskets();
  }, []);

  // Fetch items for specific basket
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

  // Search Products
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
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

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Open Create Modal
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

  // Open Edit Modal
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

  // Open Manage Items modal
  const openManageItems = (basket: any) => {
    setSelectedBasket(basket);
    setSearchQuery("");
    setSearchResults([]);
    fetchBasketItems(basket.id);
    setShowItemsModal(true);
  };

  // Save Basket
  const saveBasket = async () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Basket name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
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
        toast({ title: "Basket updated successfully" });
      } else {
        const { error } = await supabase
          .from("baskets" as any)
          .insert([payload]);
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

  // Delete Basket
  const deleteBasket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this basket?")) return;
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("baskets" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Basket deleted successfully" });
      fetchBaskets();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  // Add Item to Basket
  const handleAddItem = async (product: any) => {
    if (!selectedBasket) return;
    
    // Check if item is already in basket
    const existing = basketItems.find(item => item.product_id === product.id);
    if (existing) {
      toast({ title: "Info", description: "Product is already in the basket. Adjust quantity in the table." });
      return;
    }

    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .insert([{
          basket_id: selectedBasket.id,
          product_id: product.id,
          quantity: 1,
        }]);

      if (error) throw error;
      toast({ title: "Product added to basket" });
      fetchBasketItems(selectedBasket.id);
      fetchBaskets(); // update item count globally
    } catch (err: any) {
      toast({ title: "Failed to add item", description: err.message, variant: "destructive" });
    }
  };

  // Update Item Quantity
  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (!selectedBasket) return;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .update({ quantity: newQty })
        .eq("id", itemId);

      if (error) throw error;
      setBasketItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
    } catch (err: any) {
      toast({ title: "Failed to update quantity", description: err.message, variant: "destructive" });
    }
  };

  // Remove Item from Basket
  const handleRemoveItem = async (itemId: string) => {
    if (!selectedBasket) return;
    try {
      const { error } = await supabase
        .from("basket_items" as any)
        .delete()
        .eq("id", itemId);

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
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Curated Baskets</h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm">
            Manage multi-item kitchen combos and subscription crates
          </p>
        </div>
        <Button size="sm" className="font-body gap-1 animate-fade-in" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Create Basket
        </Button>
      </div>

      {/* Baskets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {baskets.map((basket) => (
          <Card key={basket.id} className="overflow-hidden border border-border group flex flex-col justify-between hover:shadow-lg transition-all duration-300">
            <div>
              {/* Basket Image */}
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
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-foreground font-body shadow-sm">
                  {basket.basket_items?.length || 0} items
                </div>
              </div>

              {/* Basket Info */}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-display font-bold group-hover:text-primary transition-colors">
                    {basket.name}
                  </CardTitle>
                  <span className="font-body font-bold text-lg text-primary tabular-nums">
                    {formatNaira(basket.price)}
                  </span>
                </div>
                <CardDescription className="font-body text-sm line-clamp-2 mt-1">
                  {basket.description || "No description provided for this combo pack."}
                </CardDescription>
              </CardHeader>
            </div>

            {/* Actions Footer */}
            <div className="p-6 pt-0 flex gap-2 mt-auto border-t border-border/40 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 font-body text-xs gap-1.5"
                onClick={() => openManageItems(basket)}
              >
                <Plus className="h-3.5 w-3.5" /> Manage Items
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => openEdit(basket)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                disabled={deleting === basket.id}
                onClick={() => deleteBasket(basket.id)}
              >
                {deleting === basket.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </Card>
        ))}

        {baskets.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-card">
            <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No curated baskets yet</h3>
            <p className="font-body text-sm text-muted-foreground text-center max-w-sm mb-6">
              Create combination baskets with preset products and fixed discounted bundles.
            </p>
            <Button onClick={openAdd} className="font-body">
              <Plus className="h-4 w-4 mr-1.5" /> Add First Basket
            </Button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT BASKET DIALOG */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {editingBasket ? "Edit Curated Basket" : "Create Curated Basket"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-body text-sm">Basket Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="font-body"
                placeholder="e.g. Soup Essentials Crate"
              />
              {formErrors.name && <p className="text-xs text-destructive font-body">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="font-body"
                placeholder="Brief summary of contents..."
              />
            </div>

            <div className="space-y-2">
              <Label className="font-body text-sm">Bundle Price (₦) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                className="font-body"
                placeholder="5000"
              />
              {formErrors.price && <p className="text-xs text-destructive font-body">{formErrors.price}</p>}
            </div>

            <div className="py-1">
              <ImageUploadInput
                value={form.image}
                onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="font-body w-full sm:w-auto mb-2 sm:mb-0"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveBasket}
              className="font-body gap-2 w-full sm:w-auto"
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingBasket ? "Save Changes" : "Create Basket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANAGE ITEMS SUB-INTERFACE DIALOG */}
      <Dialog open={showItemsModal} onOpenChange={setShowItemsModal}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl rounded-xl p-4 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-display font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Manage Items in "{selectedBasket?.name}"
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-6 my-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Add Items search & results panel (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                  Find Products
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name (min 2 chars)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 font-body text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-1.5" />
                      <span className="font-body text-xs">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/50 hover:bg-accent/10 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-body text-xs font-semibold text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="font-body text-[10px] text-muted-foreground">
                            {formatNaira(product.price)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-[10px] font-body"
                          onClick={() => handleAddItem(product)}
                        >
                          <Plus className="h-3 w-3 mr-0.5" /> Add
                        </Button>
                      </div>
                    ))
                  ) : searchQuery.trim().length >= 2 ? (
                    <p className="text-center font-body text-xs text-muted-foreground py-6">
                      No matching products found.
                    </p>
                  ) : (
                    <p className="text-center font-body text-xs text-muted-foreground py-6 border border-dashed rounded-lg border-border bg-muted/20">
                      Type product name to start search
                    </p>
                  )}
                </div>
              </div>

              {/* Current Items Table (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                  Basket Contents
                </h3>

                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  {itemsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <span className="font-body text-xs">Loading items...</span>
                    </div>
                  ) : basketItems.length > 0 ? (
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="font-body text-xs">Product</TableHead>
                            <TableHead className="font-body text-xs text-center">Qty</TableHead>
                            <TableHead className="font-body text-xs text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {basketItems.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/10">
                              <TableCell className="font-body text-xs font-semibold py-2.5">
                                {item.product?.name || "Unknown Product"}
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="font-body font-semibold text-xs min-w-[16px]">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground stroke-[1.2] mb-2" />
                      <p className="font-body text-xs text-muted-foreground">
                        This basket has no items yet. Select products on the left to add them.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 pt-4 mt-auto">
            <Button
              className="font-body w-full sm:w-auto"
              onClick={() => setShowItemsModal(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
          }
