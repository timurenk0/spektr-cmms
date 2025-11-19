import NextAuth, { type User } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import z from "zod";
import { db } from "./BACKEND/Database/db";
import { users } from "./BACKEND/Database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";



async function getUser(username: string): Promise<User | undefined> {
    try {
        const user = await db.select({ username: users.username, password: users.password, role: users.role }).from(users).where(eq(users.username, username)).limit(1);
        return user[0] ?? null;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user");
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z.object({ username: z.string(), password: z.string().min(8) }).safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await getUser(username);
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }

                console.error("Invalid credentials");
                return null;
            }
        })
    ]
})