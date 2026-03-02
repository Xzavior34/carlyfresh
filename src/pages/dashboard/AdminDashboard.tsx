/**
 * Admin Dashboard — Super Admin Portal
 * DATA SOURCE: Live Supabase — full access to all tables
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Truck,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, getStatusColor } from "@/lib/mockDashboardData";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type Product = Tables<"products">;
type Order = Tables<"orders">;
type Profile = Tables<"profiles">;
type DeliveryJob = Tables<"delivery_jobs">;

interface UserWithRole extends Profile {
  role?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "", category: "Fresh Produce", price: "", vendor_id: "", image_url: "", stock_level: "0",
  });

  const fetchAll = async () => {
    const [prodRes, ordRes, profRes, jobRes, rolesRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("*"),
      supabase.from("delivery_jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    if (prodRes.data) setProducts(prodRes.data);
    if (ordRes.data) setOrders(ordRes.data);
    if (jobRes.data) setJobs(jobRes.data);

    // Merge profiles with roles
    if (profRes.data && rolesRes.data) {
      const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
      setUsers(profRes.data.map((p) => ({ ...p, role: roleMap.get(p.user_id) || "buyer" })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Product CRUD
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: "", category: "Fresh Produce", price: "", vendor_id: "", image_url: "", stock_level: "0" });
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      vendor_id: p.vendor_id,
      image_url: p.image_url || "",
      stock_level: String(p.stock_level),
    });
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    const payload = {
      name: productForm.name,
      category: productForm.category,
      price: Number(productForm.price),
      vendor_id: productForm.vendor_id,
      image_url: productForm.image_url || null,
      stock_level: Number(productForm.stock_level),
      in_stock: Number(productForm.stock_level) > 0,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product updated" });
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product added" });
    }
    setShowProductModal(false);
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Product deleted" });
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pendingDeliveries = jobs.filter((j) => j.status === "available" || j.status === "accepted").length;
  const sellers = users.filter((u) => u.role === "seller");
  const drivers = users.filter((u) => u.role === "driver");

  const metricCards = [
    { label: "Total Revenue", value: formatNaira(totalRevenue), icon: TrendingUp, accent: "text-primary" },
    { label: "Active Users", value: users.length.toString(), icon: Users, accent: "text-accent" },
    { label: "Total Orders", value: orders.length.toString(), icon: ShoppingCart, accent: "text-primary" },
    { label: "Pending Deliveries", value: pendingDeliveries.toString(), icon: Truck, accent: "text-accent" },
  ];

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading admin panel…</p>;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Platform overview — manage products, users, orders, and deliveries.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, i) => (
          <motion.div key={metric.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide">{metric.label}</p>
                    <p className="text-2xl font-bold font-display mt-1 text-foreground">{metric.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10 ${metric.accent}`}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Product Management */}
      <Card className="border border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display">Product Management</CardTitle>
            <CardDescription className="font-body text-sm">All products across all vendors.</CardDescription>
          </div>
          <Button size="sm" className="font-body gap-1" onClick={openAddProduct}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Product</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Price</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Stock</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-body text-[11px] font-normal">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(item.price))}</TableCell>
                    <TableCell className="text-center font-body tabular-nums">{item.stock_level}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`text-[10px] font-body ${item.in_stock ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {item.in_stock ? "In Stock" : "Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditProduct(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteProduct(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-body">No products in the system.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Users & Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Management */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Users & Vendors</CardTitle>
            <CardDescription className="font-body text-sm">
              {sellers.length} sellers · {drivers.length} drivers · {users.length} total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-body text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-wider">Role</TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-wider">Business</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium font-body text-foreground">{u.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-body text-[11px] font-normal capitalize">{u.role}</Badge>
                      </TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{u.business_name || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-body">No users yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Order Oversight */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">All Orders</CardTitle>
            <CardDescription className="font-body text-sm">
              Master feed of every order placed on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-body text-xs uppercase tracking-wider">#</TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-wider text-right">Amount</TableHead>
                    <TableHead className="font-body text-xs uppercase tracking-wider text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium font-body text-foreground">#{order.order_number}</TableCell>
                      <TableCell className="text-right font-body tabular-nums">{formatNaira(Number(order.total_amount))}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`text-[10px] font-body ${getStatusColor(order.status as any)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-body">No orders yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Add/Edit Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-body">Product Name</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Basket of Tomatoes" className="font-body" />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Category</Label>
              <Select value={productForm.category} onValueChange={(v) => setProductForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Fresh Produce", "Oils & Spices", "Livestock", "Bulk/Wholesale", "Fruits", "Vegetables", "Bundles"].map((c) => (
                    <SelectItem key={c} value={c} className="font-body">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">Price (₦)</Label>
                <Input type="number" value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} placeholder="3500" className="font-body" />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Stock Level</Label>
                <Input type="number" value={productForm.stock_level} onChange={(e) => setProductForm((p) => ({ ...p, stock_level: e.target.value }))} className="font-body" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Vendor ID</Label>
              <Select value={productForm.vendor_id} onValueChange={(v) => setProductForm((p) => ({ ...p, vendor_id: v }))}>
                <SelectTrigger className="font-body"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id} className="font-body">{s.full_name || s.business_name || s.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Image URL (optional)</Label>
              <Input value={productForm.image_url} onChange={(e) => setProductForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className="font-body" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)} className="font-body">Cancel</Button>
            <Button onClick={saveProduct} className="font-body">{editingProduct ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
