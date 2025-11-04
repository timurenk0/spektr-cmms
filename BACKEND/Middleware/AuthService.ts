import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse as res } from "next/server";


export interface AuthUser {
    id: number,
    username: string,
    role: string
};

export async function authService(): Promise<AuthUser | null> {
    try {
        // Fetch and check authentication token from cookies. 
        const token = (await cookies()).get("authToken")?.value;
        if (!token) return null;

        // Check if JWT_TOKEN variable is set in .env file.
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET variable must be set");
        
        // Verify JWT token and validate user.
        const decoded = jwt.verify(token, secret) as AuthUser;
        return decoded;
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to authenticate user: ${msg}`);
    }
}

export function authorize(user: AuthUser | null, roles: string[] | string): boolean {
    if (!user) return false;

    // Add role argument to an array if a single string is passed.
    if (typeof roles === "string") roles = [roles];

    // Compare the user role with passed "valid" role
    return roles.includes(user.role);
}

export async function validateUser(role?: string | string[]) {
    const user = await authService();
    if (!user) throw res.json({ error: "Unauthorized" }, { status: 401 });
    if (role && !authorize(user, role)) throw res.json({ error: "Forbidden" }, {status: 403});
    
    return user;
}