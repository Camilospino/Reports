import { useSyncExternalStore } from "react";
import { allMaterials, allOrders, failedRows, getMeta, pendingRows, type LocalOrder, type Material, type Profile, type QueueRow } from "./db";

// Estado de la app en memoria, leído de SQLite. Las pantallas lo usan con useStore().
export type State = {
  profile: Profile | null;
  orders: LocalOrder[];
  materials: Material[];
  pending: number;
  failed: QueueRow[];
  online: boolean;
  syncing: boolean;
  lastSync: string | null;
  lastError: string | null;
};

let state: State = {
  profile: null,
  orders: [],
  materials: [],
  pending: 0,
  failed: [],
  online: true,
  syncing: false,
  lastSync: null,
  lastError: null,
};
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

// Vuelve a leer todo de SQLite (después de cada cambio local o sincronización).
export function reload() {
  setState({
    profile: getMeta<Profile>("profile"),
    orders: allOrders(),
    materials: allMaterials(),
    pending: pendingRows().length,
    failed: failedRows(),
    lastSync: getMeta<string>("lastSync"),
  });
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state),
  );
}
