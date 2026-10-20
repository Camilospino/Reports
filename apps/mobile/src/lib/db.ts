import * as SQLite from "expo-sqlite";
import type { OrderStatus } from "@/theme";

// Base de datos local: el técnico trabaja sobre esta copia y los cambios se suben
// a Supabase desde la cola cuando hay señal.
export const db = SQLite.openDatabaseSync("tecnio.db");

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY NOT NULL, start TEXT, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS materials (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_try_at INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    failed INTEGER NOT NULL DEFAULT 0
  );
`);

export type Profile = {
  userId: string;
  membershipId: string;
  companyId: string;
  companyName: string;
  fullName: string;
};

export type LocalItem = { id: string; material_id: string | null; description: string; quantity: number; unit_price: number };
export type PhotoKind = "foto_antes" | "foto_despues" | "firma";
// local = tomada en el celular y todavía sin subir.
export type LocalPhoto = { id: string; kind: PhotoKind; uri: string | null; caption: string | null; local: boolean };

export type LocalOrder = {
  id: string;
  number: number;
  company_id: string;
  status: OrderStatus;
  title: string;
  description: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  checklist: { label: string; done: boolean }[];
  observations: string | null;
  signer_name: string | null;
  signer_id_number: string | null;
  public_token: string | null;
  customer: { name: string; contact_name: string | null; phone_whatsapp: string | null };
  site: { address: string; neighborhood: string | null; city: string | null; lat: number | null; lng: number | null; access_notes: string | null } | null;
  service: string | null;
  items: LocalItem[];
  photos: LocalPhoto[];
  departed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type Material = { id: string; name: string; unit: string; unit_price: number; stock: number };

export type QueueType = "status" | "checklist" | "item_add" | "item_qty" | "item_remove" | "photo" | "complete";
export type QueueRow = {
  id: number;
  order_id: string;
  type: QueueType;
  payload: string;
  created_at: string;
  attempts: number;
  next_try_at: number;
  last_error: string | null;
  failed: number;
};

// --- meta ------------------------------------------------------------------
export function getMeta<T>(key: string): T | null {
  const row = db.getFirstSync<{ value: string }>("SELECT value FROM meta WHERE key = ?", key);
  return row ? (JSON.parse(row.value) as T) : null;
}
export function setMeta(key: string, value: unknown) {
  db.runSync("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", key, JSON.stringify(value));
}

// --- órdenes -----------------------------------------------------------------
export function allOrders(): LocalOrder[] {
  return db.getAllSync<{ data: string }>("SELECT data FROM orders ORDER BY start").map((r) => JSON.parse(r.data) as LocalOrder);
}
export function getOrder(id: string): LocalOrder | null {
  const row = db.getFirstSync<{ data: string }>("SELECT data FROM orders WHERE id = ?", id);
  return row ? (JSON.parse(row.data) as LocalOrder) : null;
}
export function saveOrder(o: LocalOrder) {
  db.runSync("INSERT OR REPLACE INTO orders (id, start, data) VALUES (?, ?, ?)", o.id, o.scheduled_start, JSON.stringify(o));
}

// --- catálogo ----------------------------------------------------------------
export function allMaterials(): Material[] {
  return db
    .getAllSync<{ data: string }>("SELECT data FROM materials")
    .map((r) => JSON.parse(r.data) as Material)
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function replaceMaterials(list: Material[]) {
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM materials");
    for (const m of list) db.runSync("INSERT INTO materials (id, data) VALUES (?, ?)", m.id, JSON.stringify(m));
  });
}

// --- cola --------------------------------------------------------------------
export function enqueue(orderId: string, type: QueueType, payload: unknown) {
  // La lista de chequeo se manda completa: basta el último cambio pendiente.
  if (type === "checklist") db.runSync("DELETE FROM queue WHERE order_id = ? AND type = 'checklist' AND attempts = 0 AND failed = 0", orderId);
  db.runSync(
    "INSERT INTO queue (order_id, type, payload, created_at) VALUES (?, ?, ?, ?)",
    orderId,
    type,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}
export const pendingRows = () => db.getAllSync<QueueRow>("SELECT * FROM queue WHERE failed = 0 ORDER BY id");
export const failedRows = () => db.getAllSync<QueueRow>("SELECT * FROM queue WHERE failed = 1 ORDER BY id");
export const ordersWithPending = () =>
  new Set(db.getAllSync<{ order_id: string }>("SELECT DISTINCT order_id FROM queue WHERE failed = 0").map((r) => r.order_id));

export function clearAll() {
  db.execSync("DELETE FROM meta; DELETE FROM orders; DELETE FROM materials; DELETE FROM queue;");
}
