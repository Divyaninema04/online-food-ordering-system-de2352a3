import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle2, ChefHat, XCircle, ArrowLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";

type Order = Database["public"]["Tables"]["orders"]["Row"];

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
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadOrders();
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  if (!user) {
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
            </div>
          );
        })}
      </div>
    </main>
  );
}
