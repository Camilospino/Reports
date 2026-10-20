import * as Network from "expo-network";
import { File } from "expo-file-system";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { dateKey, dayRange } from "./format";
import {
  db,
  getMeta,
  getOrder,
  ordersWithPending,
  pendingRows,
  replaceMaterials,
  saveOrder,
  setMeta,
  type LocalOrder,
  type LocalPhoto,
  type PhotoKind,
  type Profile,
  type QueueRow,
} from "./db";
import { getState, reload, setState } from "./store";
import { reportRejected } from "./sentry";

const BUCKET = "evidencias";
const SIGNED_URL_SECONDS = 7 * 86_400;
const MAX_BACKOFF_MS = 5 * 60_000;

// ---------------------------------------------------------------------------
// Errores: los de red se reintentan; los que rechaza la base de datos (permisos,
// validaciones) no se van a arreglar solos y quedan como "no se pudo subir".
// ---------------------------------------------------------------------------
class PermanentError extends Error {}

type DbError = { code?: string; message: string; statusCode?: string | number } | null;

function check(error: DbError, okCodes: string[] = []) {
  if (!error) return;
  if (error.code && okCodes.includes(error.code)) return;
  const code = error.code ?? "";
  const status = Number(error.statusCode ?? 0);
  if (/^[0-9A-Z]{5}$/.test(code) || code.startsWith("PGRST") || (status >= 400 && status < 500 && status !== 408 && status !== 429)) {
    throw new PermanentError(error.message);
  }
  throw new Error(error.message || "Error de red");
}

// ---------------------------------------------------------------------------
// Cada tipo de cambio de la cola y cómo se sube.
// ---------------------------------------------------------------------------
type StatusPayload = { status: string; event?: "en_camino" | "llegada"; eventId?: string; at: string; lat?: number | null; lng?: number | null };
type PhotoPayload = { id: string; kind: PhotoKind; path: string; caption: string | null; contentType: string };

async function apply(row: QueueRow, profile: Profile) {
  const p = JSON.parse(row.payload);
  const orderId = row.order_id;

  switch (row.type) {
    case "status": {
      const s = p as StatusPayload;
      // Primero el evento con GPS (mientras la orden sigue abierta), luego el estado.
      if (s.event && s.eventId) {
        const { error } = await supabase.from("work_order_events").insert({
          id: s.eventId,
          company_id: profile.companyId,
          work_order_id: orderId,
          user_id: profile.userId,
          type: s.event,
          payload: { at: s.at },
          lat: s.lat ?? null,
          lng: s.lng ?? null,
        });
        check(error, ["23505"]);
      }
      const { error } = await supabase
        .from("work_orders")
        .update({ status: s.status as LocalOrder["status"] })
        .eq("id", orderId);
      check(error);
      return;
    }
    case "checklist": {
      const { error } = await supabase.from("work_orders").update({ checklist_state: p.state }).eq("id", orderId);
      check(error);
      // Cuenta como "reporte" del técnico para el panel (sin conexión = sin reportes).
      await supabase.from("work_order_events").insert({
        company_id: profile.companyId,
        work_order_id: orderId,
        user_id: profile.userId,
        type: "checklist",
        payload: { hechos: p.state.filter((c: { done: boolean }) => c.done).length, at: p.at },
      });
      return;
    }
    case "item_add": {
      const { error } = await supabase.from("work_order_items").insert({
        id: p.id,
        company_id: profile.companyId,
        work_order_id: orderId,
        material_id: p.material_id,
        description: p.description,
        quantity: p.quantity,
      });
      check(error, ["23505"]);
      return;
    }
    case "item_qty": {
      const { error } = await supabase.from("work_order_items").update({ quantity: p.quantity }).eq("id", p.id);
      check(error);
      return;
    }
    case "item_remove": {
      const { error } = await supabase.from("work_order_items").delete().eq("id", p.id);
      check(error);
      return;
    }
    case "photo": {
      const ph = p as PhotoPayload;
      const file = new File(ph.path);
      if (!file.exists) throw new PermanentError("La foto ya no está en el celular");
      const storagePath = `${profile.companyId}/${orderId}/${ph.id}.${ph.contentType === "image/png" ? "png" : "jpg"}`;
      const up = await supabase.storage.from(BUCKET).upload(storagePath, await file.bytes(), { contentType: ph.contentType });
      // 409: ya se había subido en un intento anterior.
      if (up.error && !/exist|duplicate/i.test(up.error.message)) check(up.error as DbError);
      const { error } = await supabase.from("attachments").insert({
        id: ph.id,
        company_id: profile.companyId,
        work_order_id: orderId,
        kind: ph.kind,
        caption: ph.caption,
        storage_path: storagePath,
        uploaded_by: profile.userId,
      });
      check(error, ["23505"]);
      return;
    }
    case "complete": {
      const { error } = await supabase
        .from("work_orders")
        .update({
          status: "completada",
          observations: p.observations,
          signer_name: p.signer_name,
          signer_id_number: p.signer_id_number,
        })
        .eq("id", orderId);
      check(error);
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Sube la cola en orden. Si un cambio falla por red, se detiene (para no
// cerrar una orden antes de subir sus fotos) y lo reintenta con espera creciente.
// ---------------------------------------------------------------------------
async function pushQueue(profile: Profile): Promise<boolean> {
  for (const row of pendingRows()) {
    if (row.next_try_at > Date.now()) return false;
    try {
      await apply(row, profile);
      db.runSync("DELETE FROM queue WHERE id = ?", row.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof PermanentError) {
        db.runSync("UPDATE queue SET failed = 1, last_error = ?, attempts = attempts + 1 WHERE id = ?", message, row.id);
        reportRejected(row.type, message);
        continue;
      }
      const wait = Math.min(MAX_BACKOFF_MS, 5_000 * 2 ** row.attempts);
      db.runSync(
        "UPDATE queue SET attempts = attempts + 1, last_error = ?, next_try_at = ? WHERE id = ?",
        message,
        Date.now() + wait,
        row.id,
      );
      setState({ lastError: message });
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Baja del servidor las órdenes del técnico (7 días atrás y 7 adelante) y el catálogo.
// Las órdenes con cambios sin subir no se tocan, para no perder lo hecho sin señal.
// ---------------------------------------------------------------------------
const ORDER_FIELDS =
  "id, number, company_id, status, title, description, scheduled_start, scheduled_end, checklist_state, observations, signer_name, signer_id_number, public_token, customers(name, contact_name, phone_whatsapp), sites(address, neighborhood, city, lat, lng, access_notes), service_types(name), work_order_items(id, material_id, description, quantity, unit_price, created_at), attachments(id, kind, caption, storage_path, created_at)";

async function pull(profile: Profile) {
  const from = dayRange(dateKey(new Date(Date.now() - 7 * 86_400_000))).start;
  const to = dayRange(dateKey(new Date(Date.now() + 7 * 86_400_000))).end;

  const [orders, materials] = await Promise.all([
    supabase
      .from("work_orders")
      .select(ORDER_FIELDS)
      .eq("technician_id", profile.membershipId)
      .or(`and(scheduled_start.gte.${from},scheduled_start.lt.${to}),status.in.(asignada,en_camino,en_proceso)`)
      .order("scheduled_start"),
    supabase.from("materials").select("id, name, unit, unit_price, stock").eq("company_id", profile.companyId).eq("active", true).order("name"),
  ]);
  check(orders.error);
  check(materials.error);

  const rows = orders.data ?? [];
  const ids = rows.map((o) => o.id);
  const events = ids.length
    ? await supabase
        .from("work_order_events")
        .select("work_order_id, type, payload, created_at")
        .in("work_order_id", ids)
        .in("type", ["estado", "en_camino", "llegada"])
        .order("created_at")
    : { data: [], error: null };
  check(events.error);

  const paths = rows.flatMap((o) => o.attachments.map((a) => a.storage_path));
  const signed = paths.length ? ((await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)).data ?? []) : [];
  const urlOf = new Map(signed.map((s) => [s.path, s.signedUrl]));

  const pending = ordersWithPending();
  db.withTransactionSync(() => {
    for (const o of rows) {
      if (pending.has(o.id)) continue;
      const previous = getOrder(o.id);
      const evs = (events.data ?? []).filter((e) => e.work_order_id === o.id);
      const at = (e: (typeof evs)[number]) => (e.payload as { at?: string })?.at ?? e.created_at;
      const toStatus = (s: string) => evs.find((e) => e.type === "estado" && (e.payload as { a?: string })?.a === s);
      const departed = evs.find((e) => e.type === "en_camino") ?? toStatus("en_camino");
      const started = evs.find((e) => e.type === "llegada") ?? toStatus("en_proceso");
      const completed = toStatus("completada");

      // Las fotos tomadas aquí se siguen mostrando desde el archivo local (no gastan datos);
      // `local` solo marca las que faltan por subir.
      const localUri = new Map((previous?.photos ?? []).filter((p) => p.uri?.startsWith("file:")).map((p) => [p.id, p.uri]));
      const photos: LocalPhoto[] = o.attachments
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((a) => ({
          id: a.id,
          kind: a.kind,
          caption: a.caption,
          uri: localUri.get(a.id) ?? urlOf.get(a.storage_path) ?? null,
          local: false, // ya está en el servidor
        }));

      const local: LocalOrder = {
        id: o.id,
        number: o.number,
        company_id: o.company_id,
        status: o.status,
        title: o.title,
        description: o.description,
        scheduled_start: o.scheduled_start,
        scheduled_end: o.scheduled_end,
        checklist: Array.isArray(o.checklist_state) ? (o.checklist_state as LocalOrder["checklist"]) : [],
        observations: o.observations,
        signer_name: o.signer_name,
        signer_id_number: o.signer_id_number,
        public_token: o.public_token,
        customer: o.customers ?? { name: "—", contact_name: null, phone_whatsapp: null },
        site: o.sites,
        service: o.service_types?.name ?? null,
        items: o.work_order_items
          .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
          .map((i) => ({
            id: i.id,
            material_id: i.material_id,
            description: i.description,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
          })),
        photos,
        departed_at: departed ? at(departed) : null,
        started_at: started ? at(started) : null,
        completed_at: completed ? completed.created_at : null,
      };
      saveOrder(local);
    }
    // Órdenes que ya no son del técnico (reasignadas o fuera de rango) y sin cambios pendientes.
    const keep = new Set([...ids, ...pending]);
    const stale = db.getAllSync<{ id: string }>("SELECT id FROM orders").filter((r) => !keep.has(r.id));
    for (const r of stale) db.runSync("DELETE FROM orders WHERE id = ?", r.id);
  });

  replaceMaterials((materials.data ?? []).map((m) => ({ ...m, unit_price: Number(m.unit_price), stock: Number(m.stock) })));
}

// ---------------------------------------------------------------------------
// Punto de entrada: subir la cola y luego bajar datos frescos. Nunca corre dos veces a la vez.
// ---------------------------------------------------------------------------
let running: Promise<void> | null = null;
let again = false;

export function sync(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await syncOnce();
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

async function syncOnce() {
  const profile = getMeta<Profile>("profile");
  if (!profile) return;
  const net = await Network.getNetworkStateAsync().catch(() => null);
  if (net && (net.isConnected === false || net.isInternetReachable === false)) {
    setState({ online: false });
    reload();
    return;
  }
  setState({ syncing: true });
  try {
    // Renueva el token si venció. Si la sesión ya no es válida (cambio de contraseña,
    // usuario desactivado), se pide entrar de nuevo; los cambios pendientes se conservan.
    const { data: auth, error: authError } = await supabase.auth.getSession();
    if ((authError && authError.name === "AuthApiError") || (!authError && !auth.session)) {
      db.runSync("DELETE FROM meta WHERE key = 'profile'");
      return;
    }
    // Aunque algo de la cola esté esperando reintento, se bajan las órdenes nuevas
    // (las que tienen cambios sin subir no se sobrescriben).
    const done = await pushQueue(profile);
    await pull(profile);
    setMeta("lastSync", new Date().toISOString());
    setState({ online: true, lastError: done ? null : getState().lastError });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setState({ online: !/network|fetch|timeout|abort/i.test(message), lastError: message });
  } finally {
    setState({ syncing: false });
    reload();
  }
}

// ---------------------------------------------------------------------------
// Sincroniza al volver la señal, cada minuto y cuando el despachador cambia una orden.
// ---------------------------------------------------------------------------
export function startSyncLoop(): () => void {
  const netSub = Network.addNetworkStateListener((s) => {
    const online = s.isConnected !== false && s.isInternetReachable !== false;
    setState({ online });
    if (online) void sync();
  });
  const interval = setInterval(() => void sync(), 60_000);

  let channel: RealtimeChannel | null = null;
  let cancelled = false;
  void (async () => {
    const profile = getMeta<Profile>("profile");
    const { data } = await supabase.auth.getSession();
    if (cancelled || !profile || !data.session) return;
    await supabase.realtime.setAuth(data.session.access_token);
    channel = supabase
      .channel(`tecnico:${profile.membershipId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_orders", filter: `technician_id=eq.${profile.membershipId}` },
        () => void sync(),
      )
      .subscribe();
  })();

  void sync();
  return () => {
    cancelled = true;
    netSub.remove();
    clearInterval(interval);
    if (channel) void supabase.removeChannel(channel);
  };
}
