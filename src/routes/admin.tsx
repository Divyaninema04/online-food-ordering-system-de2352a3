import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser, useIsAdmin } from "@/lib/use-user";
import { Shield, Clock, ChefHat, CheckCircle2, XCircle, Trash2, Plus, Pencil, Save, X, Mail } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"] & {
  menu_items: { name: string } | null;
};
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Category = Database["public"]["Tables"]["menu_categories"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "completed", "cancelled"];

const statusStyle: Record<OrderStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  preparing: "bg-ember/10 text-ember border-ember/30",
  ready: "bg-success/10 text-success border-success/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [tab, setTab] = useState<"orders" | "menu" | "settings">("orders");

  if (userLoading || adminLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <Shield className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-gradient-ember px-6 py-2.5 text-sm font-bold text-ember-foreground"
        >
          Go home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-ember" />
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Admin <span className="text-gradient-ember">Dashboard</span>
        </h1>
      </div>

      <div className="mt-6 flex gap-1 border-b border-border">
        {(["orders", "menu", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-ember" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "orders" && <OrdersTab />}
        {tab === "menu" && <MenuTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </main>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const list = ordersData ?? [];
    setOrders(list);

    if (list.length) {
      const orderIds = list.map((o) => o.id);
      const userIds = [...new Set(list.map((o) => o.user_id))];
      const [{ data: itemsData }, { data: profilesData }] = await Promise.all([
        supabase
          .from("order_items")
          .select("*, menu_items(name)")
          .in("order_id", orderIds),
        supabase.from("profiles").select("*").in("user_id", userIds),
      ]);
      const grouped: Record<string, OrderItem[]> = {};
      (itemsData ?? []).forEach((it) => {
        (grouped[it.order_id] ||= []).push(it as OrderItem);
      });
      setItems(grouped);
      const pmap: Record<string, Profile> = {};
      (profilesData ?? []).forEach((p) => {
        pmap[p.user_id] = p;
      });
      setProfiles(pmap);
    }
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="py-20 text-center text-muted-foreground">No orders yet</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const profile = profiles[order.user_id];
        return (
          <div key={order.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Order</span>
                  <h3 className="font-heading text-lg font-bold">#{order.order_number}</h3>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {profile?.display_name ?? profile?.email ?? "Guest"} •{" "}
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-bold capitalize ${
                  statusStyle[order.status]
                }`}
              >
                {order.status}
              </span>
            </div>

            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              {(items[order.id] ?? []).map((it) => (
                <li key={it.id} className="flex justify-between text-muted-foreground">
                  <span>
                    {it.quantity}× {it.menu_items?.name ?? "Item"}
                  </span>
                  <span>₹{Number(it.subtotal).toFixed(0)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-heading font-bold text-gradient-ember">
                ₹{Number(order.total_amount).toFixed(0)}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order.id, s)}
                    disabled={order.status === s}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                      order.status === s
                        ? "bg-gradient-ember text-ember-foreground"
                        : "border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {s === "pending" && <Clock className="mr-1 inline h-3 w-3" />}
                    {s === "preparing" && <ChefHat className="mr-1 inline h-3 w-3" />}
                    {s === "ready" && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                    {s === "completed" && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                    {s === "cancelled" && <XCircle className="mr-1 inline h-3 w-3" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MenuTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState("");
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
  });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const [c, i] = await Promise.all([
      supabase.from("menu_categories").select("*").order("display_order"),
      supabase.from("menu_items").select("*").order("name"),
    ]);
    setCategories(c.data ?? []);
    setItems(i.data ?? []);
    setLoading(false);
  }

  async function addCategory() {
    if (!newCat.trim()) return;
    await supabase.from("menu_categories").insert({
      name: newCat.trim(),
      display_order: categories.length,
    });
    setNewCat("");
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its items?")) return;
    await supabase.from("menu_categories").delete().eq("id", id);
    load();
  }

  async function addItem() {
    if (!newItem.name.trim() || !newItem.price || !newItem.category_id) return;
    await supabase.from("menu_items").insert({
      name: newItem.name.trim(),
      description: newItem.description.trim() || null,
      price: Number(newItem.price),
      category_id: newItem.category_id,
      image_url: newItem.image_url.trim() || null,
    });
    setNewItem({ name: "", description: "", price: "", category_id: "", image_url: "" });
    load();
  }

  async function saveItem(id: string) {
    await supabase
      .from("menu_items")
      .update({
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        category_id: editForm.category_id,
        image_url: editForm.image_url || null,
        is_available: editForm.is_available,
      })
      .eq("id", id);
    setEditingItem(null);
    setEditForm({});
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories */}
      <section>
        <h2 className="font-heading text-xl font-bold">Categories</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <button
            onClick={addCategory}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-ember px-4 py-2 text-sm font-bold text-ember-foreground"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span>{c.name}</span>
              <button
                onClick={() => deleteCategory(c.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Add new item */}
      <section>
        <h2 className="font-heading text-xl font-bold">Add menu item</h2>
        <div className="mt-3 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          <input
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Item name"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="Price (₹)"
            type="number"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={newItem.category_id}
            onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={newItem.image_url}
            onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
            placeholder="Image URL (optional)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Description (optional)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            onClick={addItem}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-ember px-4 py-2 text-sm font-bold text-ember-foreground sm:col-span-2"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </section>

      {/* Items list */}
      <section>
        <h2 className="font-heading text-xl font-bold">Menu items ({items.length})</h2>
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const isEditing = editingItem === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                {isEditing ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={editForm.name ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      value={editForm.price ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value as unknown as number })}
                      type="number"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <select
                      value={editForm.category_id ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      value={editForm.image_url ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                      placeholder="Image URL"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <input
                      value={editForm.description ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                    />
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_available ?? true}
                        onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                      />
                      Available for ordering
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        onClick={() => saveItem(item.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-ember px-3 py-2 text-sm font-bold text-ember-foreground"
                      >
                        <Save className="h-4 w-4" /> Save
                      </button>
                      <button
                        onClick={() => { setEditingItem(null); setEditForm({}); }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                      >
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold">{item.name}</span>
                        {!item.is_available && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹{Number(item.price).toFixed(0)} •{" "}
                        {categories.find((c) => c.id === item.category_id)?.name ?? "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingItem(item.id);
                        setEditForm(item);
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SettingsTab() {
  const [adminEmail, setAdminEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "admin_email")
      .maybeSingle()
      .then(({ data }) => {
        setAdminEmail(data?.value ?? "");
        setLoading(false);
      });
  }, []);

  async function save() {
    await supabase.from("app_config").update({ value: adminEmail.trim() }).eq("key", "admin_email");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return null;

  return (
    <div className="max-w-md rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-ember" />
        <h2 className="font-heading text-lg font-bold">Admin email</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Anyone signing up with this email is automatically promoted to admin.
      </p>
      <input
        value={adminEmail}
        onChange={(e) => setAdminEmail(e.target.value)}
        placeholder="admin@example.com"
        type="email"
        className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        onClick={save}
        className="mt-3 w-full rounded-lg bg-gradient-ember py-2 text-sm font-bold text-ember-foreground"
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
