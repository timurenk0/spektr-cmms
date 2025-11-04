import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        const user = await validateUser();

        return res.json(user, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to check user: ${msg}` }, { status: 500 });
    }
}