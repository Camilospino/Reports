import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@tecnio/db";

// Rutas que piden sesión. Lo demás es público (/login, /registro, /r/... del cliente final).
const PRIVATE = ["/app", "/onboarding", "/crear-contrasena", "/tecnico"];
// Rutas de entrada: con sesión no tiene sentido verlas.
const AUTH_PAGES = ["/login", "/registro"];

const startsWith = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

// Refresca la sesión en cada request y redirige según el estado del usuario.
// La seguridad de los datos la garantiza la RLS; esto solo ordena la navegación.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims refresca el token si venció y lo verifica sin ir a Supabase Auth (con llaves asimétricas).
  const { data } = await supabase.auth.getClaims();
  const user = data ? { id: data.claims.sub } : null;

  const path = request.nextUrl.pathname;
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) {
    return startsWith(path, PRIVATE) ? redirectTo("/login") : response;
  }

  // En /app no se consulta: getSession() ya manda a /onboarding si no hay empresa.
  if (startsWith(path, AUTH_PAGES) || path === "/onboarding") {
    const { count } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("active", true);
    const hasCompany = (count ?? 0) > 0;

    if (startsWith(path, AUTH_PAGES)) return redirectTo(hasCompany ? "/app" : "/onboarding");
    if (path === "/onboarding" && hasCompany) return redirectTo("/app");
  }
  return response;
}
