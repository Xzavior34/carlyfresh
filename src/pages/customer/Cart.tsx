import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import PersistentSubscribe from "@/components/PersistentSubscribe";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useCart, isBulkActive } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatNaira } from "@/lib/formatters";

export default function Cart() {
  const { items, total, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PersistentSubscribe />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" /> Your Cart
            </h1>

            {items.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="font-body text-muted-foreground mb-4">Your cart is empty</p>
                  <Link to="/shop">
                    <Button className="font-body">Browse Products</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const bulkActive = isBulkActive(item);
                  const hasBulkOffer = Boolean(item.bulkMinQty && item.bulkPrice);
                  return (
                    <Card key={item.id} className="border border-border">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-foreground">{item.name}</p>

                          {/* Price breakdown â€” always show both regular & bulk when offer exists */}
                          <div className="mt-1 space-y-0.5">
                            <p className="font-body text-sm">
                              <span className={bulkActive ? "text-muted-foreground line-through" : "text-foreground font-medium"}>
                                Regular: {formatNaira(item.pricePerUnit)}/{item.unit || "piece"}
                              </span>
                            </p>
                            {hasBulkOffer && (
                              <p className="font-body text-sm">
                                <span className={bulkActive ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                  Bulk: {formatNaira(Number(item.bulkPrice))}/{item.unit || "piece"} (min {item.bulkMinQty})
                                </span>
                              </p>
                            )}
                          </div>

                          {bulkActive ? (
                            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-body text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <Sparkles className="h-3 w-3" /> Bulk Discount Applied
                            </p>
                          ) : hasBulkOffer ? (
                            <p className="mt-1 font-body text-xs text-muted-foreground">
                              Add {item.bulkMinQty! - item.quantity} more to unlock bulk price
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) updateQuantity(item.id, val);
                              }}
                              className="w-20 h-9 text-center font-body tabular-nums"
                            />
                            <span className="text-xs text-muted-foreground font-body whitespace-nowrap">{item.unit || "pcs"}</span>
                          </div>
                          <p className="font-display font-bold text-foreground whitespace-nowrap">{formatNaira(item.price * item.quantity)}</p>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <p className="font-display text-xl font-bold text-foreground">Total: {formatNaira(total)}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="font-body" onClick={clearCart}>Clear Cart</Button>
                    {user ? (
                      <Link to="/checkout"><Button className="font-body">Proceed to Checkout</Button></Link>
                    ) : (
                      <Link to="/login"><Button className="font-body">Login to Checkout</Button></Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

