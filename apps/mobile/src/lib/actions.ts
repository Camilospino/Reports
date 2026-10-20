import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { db, enqueue, getOrder, saveOrder, type LocalOrder, type Material, type PhotoKind } from "./db";
import { reload } from "./store";
import { sync } from "./sync";

// Cada acción del técnico se guarda primero en el celular (orden local + cola)
// y después se intenta subir. Sin señal, queda en la cola.

function update(orderId: string, change: (o: LocalOrder) => void) {
  const o = getOrder(orderId);
  if (!o) throw new Error("No encontramos la orden en el celular");
  change(o);
  saveOrder(o);
}

function commit() {
  reload();
  void sync();
}

// GPS sin bloquear: si no hay permiso o tarda, se sigue sin ubicación.
async function position(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), 8_000)),
    ]);
    const p = pos ?? (await Location.getLastKnownPositionAsync());
    return p ? { lat: p.coords.latitude, lng: p.coords.longitude } : null;
  } catch {
    return null;
  }
}

// "Voy en camino" (guarda GPS y hora) y "Llegué" (guarda GPS).
export async function advanceStatus(orderId: string, to: "en_camino" | "en_proceso") {
  const at = new Date().toISOString();
  const gps = await position();
  update(orderId, (o) => {
    o.status = to;
    if (to === "en_camino") o.departed_at = at;
    else o.started_at = at;
  });
  enqueue(orderId, "status", {
    status: to,
    event: to === "en_camino" ? "en_camino" : "llegada",
    eventId: Crypto.randomUUID(),
    at,
    lat: gps?.lat ?? null,
    lng: gps?.lng ?? null,
  });
  commit();
  return gps;
}

export function toggleChecklist(orderId: string, index: number) {
  let state: LocalOrder["checklist"] = [];
  update(orderId, (o) => {
    o.checklist = o.checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c));
    state = o.checklist;
  });
  enqueue(orderId, "checklist", { state, at: new Date().toISOString() });
  commit();
}

// --- Materiales ----------------------------------------------------------------
export function addMaterial(orderId: string, m: Material) {
  const o = getOrder(orderId);
  const existing = o?.items.find((i) => i.material_id === m.id);
  if (existing) return setQuantity(orderId, existing.id, existing.quantity + 1);
  const id = Crypto.randomUUID();
  update(orderId, (o) => o.items.push({ id, material_id: m.id, description: m.name, quantity: 1, unit_price: m.unit_price }));
  enqueue(orderId, "item_add", { id, material_id: m.id, description: m.name, quantity: 1 });
  commit();
}

export function setQuantity(orderId: string, itemId: string, quantity: number) {
  if (quantity <= 0) {
    update(orderId, (o) => (o.items = o.items.filter((i) => i.id !== itemId)));
    enqueue(orderId, "item_remove", { id: itemId });
  } else {
    update(orderId, (o) => (o.items = o.items.map((i) => (i.id === itemId ? { ...i, quantity } : i))));
    enqueue(orderId, "item_qty", { id: itemId, quantity });
  }
  commit();
}

// --- Fotos y firma -------------------------------------------------------------
const MAX_SIDE = 1600;

function storageDir() {
  const dir = new Directory(Paths.document, "evidencias");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

// Comprime (máximo 1600 px, calidad 0.7) y guarda la foto en el celular hasta que se suba.
export async function addPhoto(
  orderId: string,
  kind: Exclude<PhotoKind, "firma">,
  asset: { uri: string; width: number; height: number },
  caption: string | null = null,
) {
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    ctx.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

  const id = Crypto.randomUUID();
  const target = new File(storageDir(), `${id}.jpg`);
  await new File(saved.uri).move(target);

  update(orderId, (o) => o.photos.push({ id, kind, uri: target.uri, caption, local: true }));
  enqueue(orderId, "photo", { id, kind, path: target.uri, caption, contentType: "image/jpeg" });
  commit();
}

export function removeLocalPhoto(orderId: string, photoId: string): boolean {
  // Solo fotos que aún no se empezaron a subir: se sacan de la cola y del celular.
  const photo = getOrder(orderId)?.photos.find((p) => p.id === photoId);
  if (!photo?.local) return false;
  const removed = db.runSync(
    "DELETE FROM queue WHERE type = 'photo' AND attempts = 0 AND json_extract(payload, '$.id') = ?",
    photoId,
  ).changes;
  if (!removed) return false;
  update(orderId, (o) => (o.photos = o.photos.filter((p) => p.id !== photoId)));
  try {
    if (photo.uri) new File(photo.uri).delete();
  } catch {
    // si el archivo ya no existe no pasa nada
  }
  reload();
  return true;
}

// --- Cerrar la orden -----------------------------------------------------------
export function completeOrder(
  orderId: string,
  data: { observations: string; signerName: string; signerId: string; signaturePng: string },
) {
  const id = Crypto.randomUUID();
  const file = new File(storageDir(), `${id}.png`);
  file.create({ overwrite: true });
  file.write(data.signaturePng.replace(/^data:image\/\w+;base64,/, ""), { encoding: "base64" });

  const at = new Date().toISOString();
  update(orderId, (o) => {
    o.photos.push({ id, kind: "firma", uri: file.uri, caption: "Firma", local: true });
    o.status = "completada";
    o.completed_at = at;
    o.observations = data.observations || null;
    o.signer_name = data.signerName;
    o.signer_id_number = data.signerId || null;
  });
  // Orden de la cola: primero la firma (y las fotos ya encoladas), al final el cierre.
  enqueue(orderId, "photo", { id, kind: "firma", path: file.uri, caption: "Firma", contentType: "image/png" });
  enqueue(orderId, "complete", {
    observations: data.observations || null,
    signer_name: data.signerName,
    signer_id_number: data.signerId || null,
  });
  commit();
}
