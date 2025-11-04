import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const equipmentId = parseInt(id);

        if(isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });

        const photos = await storage.getPhotos(equipmentId);
        
        return res.json(photos, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? [error.message, error.cause, error.stack] : "Unknown error";
        return res.json({ error: `Failed t fetch photos for specidied equipment: ${msg}` }, { status: 500 });        
    }
}