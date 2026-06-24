import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";
import { esPublica, rutaPermitida } from "@/lib/auth/route-access";

// Protección de rutas por rol (defensa en profundidad, además de las
// verificaciones en cada Server Action). Usa la config edge-safe (sin Prisma).
// La lógica de acceso vive en lib/auth/route-access.ts (pura, testeable).

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const sesion = req.auth;

  if (esPublica(pathname)) return NextResponse.next();

  // Sin sesión → al login (conservando destino).
  if (!sesion?.user) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Con sesión: verificar rol contra el prefijo de la ruta.
  if (!rutaPermitida(pathname, sesion.user.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

// Excluye estáticos (incl. archivos de /public como imágenes) y TODAS las rutas
// /api (los route handlers validan su propia auth y devuelven 401 JSON, en vez de
// redirigir a HTML).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|txt|xml|woff2?|ttf|css|js)).*)",
  ],
};
