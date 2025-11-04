import { NextRequest, NextResponse as res } from "next/server";
import { storage } from "@/BACKEND/storage";
import { cookies } from "next/headers";


export async function POST(req: NextRequest) {
    try {
        // Parse request body to json format.
        // Extract and check if username and password arguments are passed.
        const body = await req.json();
        const { username, password } = body;
        if (!username || !password) return res.json({ error: "User credentials are not found" }, { status: 400 });

        const user = await storage.loginUser(username, password);

        // Set an authentication token for a session using cookies.
        (await cookies()).set("authToken", user.token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/"
        });

        return res.json(user, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to login: ${msg}` }, { status: 500 });
    }
}