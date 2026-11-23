import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { kv } from './storage';

/** Shopping cart (FR-034..036). Only course ids are stored locally; prices always come from the server. */
interface CartState {
  ids: number[];
  count: number;
  has: (id: number) => boolean;
  add: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  removeMany: (ids: number[]) => void;
}

const KEY = 'vian_cart_v1';
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    kv.get(KEY).then((raw) => {
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setIds(parsed.filter((x) => Number.isInteger(x)));
      } catch {
        // corrupted storage: start empty
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) kv.set(KEY, JSON.stringify(ids));
  }, [ids, ready]);

  const add = useCallback((id: number) => setIds((prev) => (prev.includes(id) ? prev : [...prev, id])), []);
  const remove = useCallback((id: number) => setIds((prev) => prev.filter((x) => x !== id)), []);
  const removeMany = useCallback((list: number[]) => setIds((prev) => prev.filter((x) => !list.includes(x))), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<CartState>(() => ({
    ids,
    count: ids.length,
    has: (id) => ids.includes(id),
    add,
    remove,
    clear,
    removeMany,
  }), [ids, add, remove, clear, removeMany]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
