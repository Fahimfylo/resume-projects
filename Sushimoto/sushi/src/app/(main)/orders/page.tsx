"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Clock, Package, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  _id: string;
  orderStatus: string;
  orderDate: string;
  bills: { total: number; tax: number; totalWithTax: number };
  items: Array<{ name?: string; price?: number; quantity?: number }>;
  paymentMethod?: string;
}

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-green-100 text-green-800",
  Delivered: "bg-green-100 text-green-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const { items: cartItems, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setOrdersLoading(false); return; }
    api.get<Order[]>("/order/mine").then((res) => {
      if (res.success && res.data) setOrders(res.data);
    }).catch(() => {}).finally(() => setOrdersLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 pt-24">
        <Package className="w-16 h-16 text-muted-foreground" />
        <h2 className="font-heading text-2xl">Sign in to view your orders</h2>
        <Link href="/sign-in" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl">My Orders</h1>
        </div>

        {/* Cart Section */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-xl flex items-center justify-between">
              <span>Current Cart {itemCount > 0 && <span className="text-sm font-normal text-muted-foreground">({itemCount} items)</span>}</span>
              {itemCount > 0 && (
                <button onClick={clearCart} className="text-xs text-destructive hover:underline font-normal">
                  Clear All
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <Link href="/menu" className="inline-block mt-3 text-primary text-sm font-medium hover:underline">
                  Browse Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-contain bg-creamson" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-sm font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
                  </div>
                  <Button className="w-full gap-2 rounded-full" size="lg">
                    Place Order <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Orders */}
        <div>
          <h2 className="font-heading text-xl mb-4">Order History</h2>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No past orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order._id} className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(order.orderDate).toLocaleDateString("en-US", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </p>
                          <p className="text-sm font-medium mt-0.5">#{order._id.slice(-6).toUpperCase()}</p>
                        </div>
                        <Badge className={`${statusColor[order.orderStatus] || "bg-gray-100 text-gray-800"} border-0`}>
                          {order.orderStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">${order.bills?.totalWithTax?.toFixed(2) || "0.00"}</span>
                        <span className="text-muted-foreground">{order.items?.length || 0} items</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
