import { useSyncExternalStore } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

let cart: CartItem[] = [];
let listeners: (() => void)[] = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return cart;
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    cart = cart.map((c) =>
      c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
    );
  } else {
    cart = [...cart, { ...item, quantity: 1 }];
  }
  emitChange();
}

export function removeFromCart(id: string) {
  cart = cart.filter((c) => c.id !== id);
  emitChange();
}

export function updateQuantity(id: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }
  cart = cart.map((c) => (c.id === id ? { ...c, quantity } : c));
  emitChange();
}

export function clearCart() {
  cart = [];
  emitChange();
}

export function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
