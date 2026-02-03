import { NextResponse as res } from "next/server";
import { storage } from "@/BACKEND/storage";


export async function GET() {
    try {
        const locations = await storage.getEquipmentLocations();
        return res.json(locations, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch equipment locations: ${msg}` }, { status: 500 });
    }
}