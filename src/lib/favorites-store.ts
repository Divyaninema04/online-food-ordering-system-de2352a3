import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./use-user";

export function useFavorites() {
  const { user } = useUser();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("favorites")
      .select("menu_item_id")
      .eq("user_id", user.id);
    setFavoriteIds(new Set((data ?? []).map((f) => f.menu_item_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (menuItemId: string) => {
      if (!user) return;
      const isFav = favoriteIds.has(menuItemId);
      // optimistic
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(menuItemId);
        else next.add(menuItemId);
        return next;
      });
      if (isFav) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("menu_item_id", menuItemId);
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, menu_item_id: menuItemId });
      }
    },
    [user, favoriteIds]
  );

  return { favoriteIds, loading, toggle, refresh, isAuthed: !!user };
}
