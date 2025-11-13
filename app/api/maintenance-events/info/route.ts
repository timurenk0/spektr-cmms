import { storage } from "@/BACKEND/storage";
import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        const info = await storage.getMaintenanceEventsInfo();

        if (!info) return res.json("No info found", { status: 404 });

        return res.json(info, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown Error";
        return res.json(msg, { status: 500 });
    }
}