"use client";

import { useCallback, useEffect, useState } from "react";

export type RentalCartItem = { productId: string; size: string; color: string; quantity: number };
const STORAGE_KEY = "tlora:rental-cart:v1";
const EVENT_KEY = "tlora:rental-cart-change";

function readCart(): RentalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RentalCartItem[];
    return Array.isArray(value) ? value.filter((item) => item?.productId && item.quantity > 0) : [];
  } catch { return []; }
}

function writeCart(items: RentalCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_KEY));
}

export function useRentalCart() {
  const [items, setItems] = useState<RentalCartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(EVENT_KEY, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT_KEY, sync); window.removeEventListener("storage", sync); };
  }, []);
  const update = useCallback((next: RentalCartItem[]) => { writeCart(next); setItems(next); }, []);
  const add = useCallback((item: RentalCartItem) => {
    const current = readCart();
    const index = current.findIndex((value) => value.productId === item.productId && value.size === item.size && value.color === item.color);
    if (index >= 0) current[index] = { ...current[index], quantity: current[index].quantity + item.quantity };
    else current.push(item);
    update(current);
  }, [update]);
  const remove = useCallback((index: number) => update(readCart().filter((_, itemIndex) => itemIndex !== index)), [update]);
  const change = useCallback((index: number, patch: Partial<RentalCartItem>) => update(readCart().map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)), [update]);
  const clear = useCallback(() => update([]), [update]);
  return { items, count: items.reduce((sum, item) => sum + item.quantity, 0), add, remove, change, clear };
}
