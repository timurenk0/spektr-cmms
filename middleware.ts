import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse as Response } from "next/server";

const { auth } = NextAuth(authConfig);


export default auth((req) => {
    const { nextUrl } = req;
    const session = req.auth;

    if (nextUrl.pathname === "/login") {
        return session?.user ? Response.redirect(new URL("/", req.url)) : Response.next();
    }

    if (!session?.user) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
    }

    return Response.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}

