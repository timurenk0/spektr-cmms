import { Gstorage } from "@/BACKEND/google-storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";
import uploadAndAddPhoto from "./helper";


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
    let imageUrl: string | null = null;
    try {
        const user = await validateUser("admin");

        const type = req.nextUrl.searchParams.get("type");
        const body = await req.formData();

        const { equipmentId, file } = Object.fromEntries(body.entries()) as {
            equipmentId?: string,
            file: File,
        }

        if (!file) return res.json({ error: "No file found" }, { status: 400 });

        if (type === "thumb") {
            imageUrl = await Gstorage.uploadThumbPhoto(file);
            return res.json({ equipmentImage: imageUrl }, { status: 201 });
        }


        if (!equipmentId) return res.json({ error: "No equipment ID found" }, { status: 400 });
        const parsedEquipmentId = Number(equipmentId);
        if (isNaN(parsedEquipmentId)) return res.json({ error: "Equipment ID is not a number" }, { status: 400 });
        
        const documentData = {
            equipmentId: parsedEquipmentId,
        }
        const newPhoto = await uploadAndAddPhoto(file, documentData)

        activityLogger(user, "add", "Photo uploaded", `Photo for equipment ${newPhoto?.equipmentId} added`, newPhoto?.equipmentId);

        return res.json(JSON.parse(JSON.stringify(newPhoto)), { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to post photo: ${msg}` }, { status: 500 });
    }
}