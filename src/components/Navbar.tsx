import { Link } from "@tanstack/react-router";
import { ShoppingCart, UtensilsCrossed, ClipboardList, LogIn, LogOut, Shield, Heart } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { useUser, useIsAdmin } from "@/lib/use-user";

export function Navbar() {
  const { count } = useCart();
  const { user } = useUser();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-ember">
            <UtensilsCrossed className="h-5 w-5 text-ember-foreground" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Bite<span className="text-gradient-ember">Hub</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "!text-foreground" }}
          >
            Menu
          </Link>

          {user && (
            <>
              <Link
                to="/favorites"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "!text-foreground" }}
              >
                <Heart className="h-4 w-4" />
                Favorites
              </Link>
              <Link
                to="/orders"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "!text-foreground" }}
              >
                <ClipboardList className="h-4 w-4" />
                Orders
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ember transition-colors hover:opacity-80"
              activeProps={{ className: "!text-foreground" }}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}

          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "!text-foreground" }}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-ember text-[10px] font-bold text-ember-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-gradient-ember px-4 py-2 text-sm font-bold text-ember-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
