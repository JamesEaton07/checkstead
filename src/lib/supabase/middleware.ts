import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// "/tenant/login" is the only public tenant route — everything else under
// "/tenant" is a stub portal that still requires a session. This is a
// placeholder sign-in (see src/app/tenant/login): it's plain Supabase magic
// link, not yet scoped to a specific tenant's access grant.
const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/tenant/login"];
const AUTH_ENTRY_PATHS = ["/login", "/tenant/login"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginPath = request.nextUrl.pathname.startsWith("/tenant") ? "/tenant/login" : "/login";
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && AUTH_ENTRY_PATHS.includes(request.nextUrl.pathname)) {
    const fallback = request.nextUrl.pathname === "/tenant/login" ? "/tenant" : "/dashboard";
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  return response;
}
