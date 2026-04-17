import { Plus, Clock } from "lucide-react";
import { addToCart } from "@/lib/cart-store";
import type { Database } from "@/integrations/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        {item.is_featured && (
          <span className="absolute left-3 top-3 rounded-md bg-gradient-ember px-2 py-0.5 text-xs font-bold text-ember-foreground">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-base font-semibold leading-snug">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <span className="font-heading text-lg font-bold text-gradient-ember">
              ₹{Number(item.price).toFixed(0)}
            </span>
            {item.preparation_time && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.preparation_time} min
              </div>
            )}
          </div>
          <button
            onClick={() =>
              addToCart({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                image_url: item.image_url,
              })
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-ember text-ember-foreground transition-all hover:scale-105 hover:shadow-md hover:shadow-primary/20 active:scale-95"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
