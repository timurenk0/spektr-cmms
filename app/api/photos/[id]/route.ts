import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const photoId = parseInt(id);
        if (isNaN(photoId)) return res.json({ error: "Photo ID is not a number" }, { status: 400 });

        const imageUrl = await storage.deletePhoto(photoId);

        await Gstorage.deleteObject(imageUrl);

        return res.json(true, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to delete specified photo: ${msg}` }, { status: 500 });
    }
}