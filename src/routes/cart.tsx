import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart, clearCart } from "@/lib/cart-store";
import { CartItemRow } from "@/components/CartItemRow";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, total, count } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function placeOrder() {
    if (!user || items.length === 0) return;
    setPlacing(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total_amount: total })
        .select()
        .single();

      if (orderErr || !order) throw orderErr;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      navigate({ to: "/orders" });
    } catch (err) {
      console.error("Failed to place order:", err);
      alert("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Browse the menu and add some items!</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-ember px-6 py-2.5 text-sm font-bold text-ember-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Your <span className="text-gradient-ember">Cart</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{count} item{count !== 1 ? "s" : ""}</p>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between text-lg">
          <span className="font-heading font-semibold">Total</span>
          <span className="font-heading text-2xl font-bold text-gradient-ember">
            ₹{total.toFixed(0)}
          </span>
        </div>

        {user ? (
          <button
            onClick={placeOrder}
            disabled={placing}
            className="mt-4 w-full rounded-xl bg-gradient-ember py-3 font-heading font-bold text-ember-foreground transition-all hover:opacity-90 disabled:opacity-50 glow-ember"
          >
            {placing ? "Placing Order…" : "Place Order"}
          </button>
        ) : (
          <Link
            to="/login"
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-ember py-3 font-heading font-bold text-ember-foreground transition-opacity hover:opacity-90"
          >
            Sign in to order
          </Link>
        )}
      </div>
    </main>
  );
}
