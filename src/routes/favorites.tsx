import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/use-user";
import { MenuItemCard } from "@/components/MenuItemCard";
import { Heart, ArrowLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("menu_item_id")
        .eq("user_id", user.id);
      const ids = (favs ?? []).map((f) => f.menu_item_id);
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .in("id", ids);
      setItems(menuItems ?? []);
      setLoading(false);
    })();
  }, [user, userLoading]);

  if (!userLoading && !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Sign in to save favorites</h1>
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        Your <span className="text-gradient-ember">Favorites</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Quickly reorder the things you love</p>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="py-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No favorites yet</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-ember px-6 py-2.5 text-sm font-bold text-ember-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Menu
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
