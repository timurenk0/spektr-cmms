import { NextResponse as res } from "next/server";
import { storage } from "@/BACKEND/storage";


export async function GET() {
    try {
        const updatedEvents = await storage.updateIncompleteEvents();
        return res.json(`${Object.keys(updatedEvents).length > 0 ? "Events updated" : "Nothing to update"}`, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error : "Unknown error";
        return res.json(msg, { status: 500 });
    }
}