import { MenuItemCard } from "./MenuItemCard";
import type { Database } from "@/integrations/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type Category = Database["public"]["Tables"]["menu_categories"]["Row"];

interface CategorySectionProps {
  category: Category;
  items: MenuItem[];
}

export function CategorySection({ category, items }: CategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="py-10">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          {category.name}
        </h2>
        {category.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
