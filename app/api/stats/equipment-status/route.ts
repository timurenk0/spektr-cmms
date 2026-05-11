import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        const user = await validateUser();

        const stats = await storage.getEquipmentStatusCount(user.tenantId);
        if (!stats) throw new Error("Something went wrong");

        return res.json(stats, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown erorr";
        return res.json({ error: `Failed to fetch equipment status info: ${msg}` }, { status: 500 });
    }
}