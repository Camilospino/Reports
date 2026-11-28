// Ver o cambiar el plan de un cliente en la base de PRODUCCIÓN (proyecto vinculado con supabase link).
//   npm run plan -- dueno@empresa.com            → muestra el plan actual
//   npm run plan -- dueno@empresa.com equipo     → lo cambia (arranque | equipo | empresa)
// El correo es el del dueño de la empresa. Usa tu sesión de la CLI de Supabase (npx supabase login).
import { spawnSync } from "node:child_process";

const PLANS = { arranque: 3, equipo: 10, empresa: 25 };
const [rawEmail, rawPlan] = process.argv.slice(2);
const email = (rawEmail ?? "").trim().toLowerCase();
const plan = rawPlan?.trim().toLowerCase();

// Solo caracteres seguros: el correo va dentro del SQL.
if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) || (plan && !(plan in PLANS))) {
  console.error("Uso: npm run plan -- dueno@empresa.com [arranque|equipo|empresa]");
  process.exit(1);
}

const companies = `select m.company_id from public.memberships m join auth.users u on u.id = m.user_id
  where lower(u.email) = '${email}' and m.role = 'owner'`;
const report = `c.name as empresa, c.plan, c.subscription_status as suscripcion,
  (select count(*) from public.memberships t where t.company_id = c.id and t.role = 'technician' and t.active) as tecnicos_activos`;
const sql = plan
  ? `update public.companies c set plan = '${plan}' where c.id in (${companies}) returning ${report}`
  : `select ${report} from public.companies c where c.id in (${companies})`;

// El SQL va entre comillas dobles y no tiene ninguna (el correo y el plan ya se validaron).
const command = `npx supabase db query --remote ${plan ? "--yes" : "--read-only"} "${sql.replace(/\s+/g, " ")}"`;
const run = spawnSync(command, { shell: true, encoding: "utf8" });
const out = `${run.stdout ?? ""}`;
let rows;
try {
  rows = JSON.parse(out.slice(out.indexOf("{"))).rows;
} catch {
  console.error(run.stderr || out || "No se pudo consultar la base.");
  process.exit(1);
}

if (!rows?.length) {
  console.error(`No hay ninguna empresa cuyo dueño sea ${email}.`);
  process.exit(1);
}
for (const r of rows) {
  const limit = PLANS[r.plan];
  console.log(`\n${r.empresa}: plan ${r.plan} (${r.suscripcion}) · ${r.tecnicos_activos} de ${limit} técnicos activos`);
  if (plan && Number(r.tecnicos_activos) > limit) {
    console.log("  Ojo: tiene más técnicos de los que incluye el plan. No se desactiva a nadie, pero no podrá agregar más.");
  }
}
console.log(plan ? "\nPlan actualizado. El cliente lo ve al recargar el panel.\n" : "");
