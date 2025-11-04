import { insertPhotoSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET() {
    try {
        const photos = await storage.getPhotos();

        if (!photos || photos.length === 0) return res.json({ message: "No photos found" }, { status: 404 });
        
        return res.json(photos, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? [error.message, error.cause, error.stack] : "Unknown error";
        res.json({ error: `Failed to fetch photos: ${msg}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");

        const body = await req.json();
        const photoValidatedData = insertPhotoSchema.parse(body);

        const newPhoto = await storage.addPhoto(photoValidatedData);

        await activityLogger(user, "add", "Photo uploaded", `Photo uploaded for equipment ${photoValidatedData.equipmentId}`, newPhoto.equipmentId);

        return res.json(newPhoto, { status: 201 });        
    } catch (error: unknown) {
        const msg = error instanceof Error ? [error.message, error.cause, error.stack] : "Unknown error";
        res.json({ error: `Failed to post photo: ${msg}` }, { status: 500 });
    }
}