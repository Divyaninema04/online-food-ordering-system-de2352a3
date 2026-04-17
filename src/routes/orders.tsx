import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle2, ChefHat, XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { addToCart } from "@/lib/cart-store";
import type { Database } from "@/integrations/supabase/types";
import { useUser } from "@/lib/use-user";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"] & {
  menu_items: { id: string; name: string; price: number; image_url: string | null } | null;
};

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, label: "Pending", color: "text-warning" },
  preparing: { icon: <ChefHat className="h-4 w-4" />, label: "Preparing", color: "text-ember" },
  ready: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Ready!", color: "text-success" },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Completed", color: "text-muted-foreground" },
  cancelled: { icon: <XCircle className="h-4 w-4" />, label: "Cancelled", color: "text-destructive" },
};

function OrdersPage() {
  const { user, loading: userLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadOrders();

    // Realtime subscription for order status updates
    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  async function loadOrders() {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (ordersData) {
      setOrders(ordersData);
      const ids = ordersData.map((o) => o.id);
      if (ids.length) {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*, menu_items(id, name, price, image_url)")
          .in("order_id", ids);
        const grouped: Record<string, OrderItem[]> = {};
        (itemsData ?? []).forEach((it) => {
          (grouped[it.order_id] ||= []).push(it as OrderItem);
        });
        setItemsByOrder(grouped);
      }
    }
    setLoading(false);
  }

  function reorder(orderId: string) {
    const items = itemsByOrder[orderId] ?? [];
    items.forEach((it) => {
      if (it.menu_items) {
        for (let i = 0; i < it.quantity; i++) {
          addToCart({
            id: it.menu_items.id,
            name: it.menu_items.name,
            price: Number(it.menu_items.price),
            image_url: it.menu_items.image_url,
          });
        }
      }
    });
  }

  if (!userLoading && !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">Sign in to view orders</h1>
        <Link
          to="/login"
          className="mt-4 inline-flex rounded-lg bg-gradient-ember px-6 py-2.5 text-sm font-bold text-ember-foreground"
        >
          Sign In
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Your <span className="text-gradient-ember">Orders</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live updates — status changes appear instantly
      </p>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No orders yet</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-ember px-6 py-2.5 text-sm font-bold text-ember-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Menu
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {orders.map((order) => {
          const cfg = statusConfig[order.status] ?? statusConfig.pending;
          const items = itemsByOrder[order.id] ?? [];
          return (
            <div key={order.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Order</span>
                  <h3 className="font-heading text-lg font-bold">#{order.order_number}</h3>
                </div>
                <div className={`flex items-center gap-1.5 font-heading text-sm font-semibold ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </div>
              </div>

              {items.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span>
                        {it.quantity}× {it.menu_items?.name ?? "Item"}
                      </span>
                      <span>₹{Number(it.subtotal).toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-heading font-bold text-gradient-ember">
                  ₹{Number(order.total_amount).toFixed(0)}
                </span>
              </div>

              {items.length > 0 && (
                <button
                  onClick={() => reorder(order.id)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-ember"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reorder
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
