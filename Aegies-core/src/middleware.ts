import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/api/auth/register",
  "/api/auth/login",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(route));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      authenticated = true;
    } catch {}
  }

  if (authenticated && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  if (!authenticated && !isPublicRoute(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return Response.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
