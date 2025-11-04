import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest,
) {
    try {
        const equipmentId= parseInt(req.nextUrl.searchParams.get("equipmentId") ?? "0");

        if (isNaN(equipmentId)) throw new Error("Invalid equipment ID");
        
        const activities = equipmentId ? await storage.getActivities(999, equipmentId) : await storage.getActivities();

        return res.json(activities, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch activities: ${msg}` }, { status: 500 });
    }
}