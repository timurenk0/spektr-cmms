import { NextResponse as res } from "next/server";
import { storage } from "@/BACKEND/storage";


export async function GET() {
    try {
        const roles = await storage.getUserRoles();
        return res.json(roles, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch user roles: ${msg}` }, { status: 500 });        
    }
}