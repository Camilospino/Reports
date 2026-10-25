import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { getRandomBytes } from "expo-crypto";
import type { OrderStatus } from "@/theme";

// Base de datos local: el técnico trabaja sobre esta copia y los cambios se suben
// a Supabase desde la cola cuando hay señal. Está cifrada con SQLCipher (useSQLCipher en
// app.json): si alguien saca el archivo del celular, sin la clave solo ve datos ilegibles.
const DB_NAME = "tecnio-cifrada.db";
const LEGACY_DB_NAME = "tecnio.db"; // versiones anteriores, sin cifrar
const KEY_NAME = "tecnio.db.key";
const TABLES = ["meta", "orders", "materials", "queue", "auth"] as const;

// Clave aleatoria de 256 bits, una por celular, guardada en la bóveda segura del sistema
// (Android Keystore / Llavero de iOS). Solo se puede leer con el celular desbloqueado.
function databaseKey(): string {
  let key = SecureStore.getItem(KEY_NAME);
  if (!key) {
    key = Array.from(getRandomBytes(32), (b) => b.toString(16).padStart(2, "0")).join("");
    SecureStore.setItem(KEY_NAME, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }
  return key;
}

function createSchema(d: SQLite.SQLiteDatabase) {
  d.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS auth (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
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
}

// Las versiones anteriores guardaban todo sin cifrar en tecnio.db. Al abrir esta versión se copia
// todo (incluidos los cambios sin subir) a la base cifrada y solo después se borra la vieja.
// Si el celular se apaga a mitad, la próxima vez se repite: INSERT OR REPLACE no duplica nada.
function migrateLegacy(target: SQLite.SQLiteDatabase) {
  const legacy = SQLite.openDatabaseSync(LEGACY_DB_NAME);
  const hasData = legacy.getFirstSync("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'queue'");
  if (hasData) {
    target.withTransactionSync(() => {
      for (const table of TABLES) {
        const exists = legacy.getFirstSync("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", table);
        if (!exists) continue;
        for (const row of legacy.getAllSync<Record<string, SQLite.SQLiteBindValue>>(`SELECT * FROM ${table}`)) {
          const cols = Object.keys(row);
          target.runSync(
            `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
            cols.map((c) => row[c]),
          );
        }
      }
    });
  }
  legacy.closeSync();
  SQLite.deleteDatabaseSync(LEGACY_DB_NAME);
}

function openLocalDatabase() {
  const d = SQLite.openDatabaseSync(DB_NAME);
  // La clave va antes de cualquier otra consulta. Con un binario sin SQLCipher esto no hace nada
  // (y la base quedaría sin cifrar): cipher_version lo detecta.
  d.execSync(`PRAGMA key = '${databaseKey()}'`);
  if (!d.getFirstSync("PRAGMA cipher_version")) console.warn("SQLCipher no está activo: la base local no queda cifrada.");
  createSchema(d);
  migrateLegacy(d);
  return d;
}

export const db = openLocalDatabase();

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

// No toca "auth": ahí está la sesión, que maneja Supabase (se borra al cerrar sesión).
export function clearAll() {
  db.execSync("DELETE FROM meta; DELETE FROM orders; DELETE FROM materials; DELETE FROM queue;");
}

// --- sesión ------------------------------------------------------------------
// Almacenamiento de la sesión de Supabase dentro de la base cifrada. Antes iba en
// expo-sqlite/kv-store, sin cifrar: quien copiara ese archivo podía usar la cuenta del técnico.
export const sessionStorage = {
  getItem: (key: string) => db.getFirstSync<{ value: string }>("SELECT value FROM auth WHERE key = ?", key)?.value ?? null,
  setItem: (key: string, value: string) => {
    db.runSync("INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)", key, value);
  },
  removeItem: (key: string) => {
    db.runSync("DELETE FROM auth WHERE key = ?", key);
  },
};
