import type { NextAuthConfig } from "next-auth";


export const authConfig = {
    pages: {
        signIn: "/login"
    },
    session: { strategy: "jwt" },
    providers: [],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.username = user.username;
                token.role = user.role;
            }
            return token;
        },
        session({ session, token }) {
            if (token) {
                session.user.username = token.username as string;
                session.user.role = token.role as string;
            }
            return session;
        }
    }
} satisfies NextAuthConfig;