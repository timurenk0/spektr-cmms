import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { CustomApiError } from "../Utils/errorBuilder";


export interface AuthUser {
    id: number,
    username: string,
    role: string,
    tenantId: number,
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

export async function validateUser(role?: string | string[]): Promise<AuthUser> {
    const user = await authService();
    // if (!user) throw new Error("Unauthorized");
    if (!user) {
        throw new CustomApiError({
            code: "UNAUTHORIZED",
            message: "Failed to verify user",
            suggestion: "Try logging in again",
            status: 401
        });
    }

    if (role && !authorize(user, role)) {
        throw new CustomApiError({
            code: "FORBIDDEN",
            message:" You don't have enough permissions",
            suggestion: "Request additional permissions from your manager",
            status: 403
        });
    }
    
    return user;
}