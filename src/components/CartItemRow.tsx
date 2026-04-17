import { Minus, Plus, Trash2 } from "lucide-react";
import { updateQuantity, removeFromCart, type CartItem } from "@/lib/cart-store";

export function CartItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🍽️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground">₹{item.price.toFixed(0)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-heading font-bold">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="w-20 text-right">
        <span className="font-heading font-bold text-gradient-ember">
          ₹{(item.price * item.quantity).toFixed(0)}
        </span>
      </div>
      <button
        onClick={() => removeFromCart(item.id)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
