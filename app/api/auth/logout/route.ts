import { cookies } from "next/headers";
import { NextResponse as res } from "next/server";


export async function POST() {
    try {
        // Delete authentication token in cookies.
        (await cookies()).delete("authToken");

        return res.json(true, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to logout: ${msg}` }, { status: 500 });
    }
}