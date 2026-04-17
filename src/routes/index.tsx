import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CategorySection } from "@/components/CategorySection";
import { Search } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import heroImage from "@/assets/hero-food.jpg";

type Category = Database["public"]["Tables"]["menu_categories"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export const Route = createFileRoute("/")({
  component: MenuPage,
});

function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [catRes, itemRes] = await Promise.all([
        supabase.from("menu_categories").select("*").order("display_order"),
        supabase.from("menu_items").select("*"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (itemRes.data) setItems(itemRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.description?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl mt-6">
        <img
          src={heroImage}
          alt="Delicious cafeteria food"
          className="h-64 w-full object-cover sm:h-72"
          width={1280}
          height={512}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Today's <span className="text-gradient-ember">Menu</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-foreground/80">
            Browse our cafeteria menu and order ahead. Skip the line, enjoy your meal.
          </p>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search the menu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}

      {/* Categories */}
      {!loading && categories.length === 0 && (
        <div className="py-20 text-center">
          <span className="text-5xl">🍽️</span>
          <h2 className="mt-4 font-heading text-xl font-bold">No menu items yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The cafeteria menu is being prepared. Check back soon!
          </p>
        </div>
      )}

      {!loading &&
        categories.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            items={filtered.filter((i) => i.category_id === cat.id)}
          />
        ))}
    </main>
  );
}
