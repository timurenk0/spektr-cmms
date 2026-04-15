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
    try {
        const user = await validateUser("admin");

        const type = req.nextUrl.searchParams.get("type");
        const body = await req.formData();

        const { equipmentId, file } = Object.fromEntries(body.entries()) as {
            equipmentId?: string,
            file: File,
        }

        if (!file) return res.json({ error: "No file found" }, { status: 400 });

        let imageUrl: string | null = null;
        if (type && type === "thumb") {
            try{                
                imageUrl = await Gstorage.uploadThumbPhoto(file);
                return res.json({ equipmentImage: imageUrl }, { status: 201 });
            } catch (error) {
                if (imageUrl) {
                    await Gstorage.deleteObject(imageUrl)
                        .then(() => {
                            console.log("Fallback successfully deleted the photo");
                        })
                        .catch(() => {
                            throw new Error(`Fallback delete failed: ${error}`);
                        })
                }
            }
        } else {
            if (!equipmentId) return res.json({ error: "No equipment ID found" }, { status: 400 });
            const parsedEquipmentId = Number(equipmentId);
            if (isNaN(parsedEquipmentId)) return res.json({ error: "Equipment ID is not a number" }, { status: 400 });
            try {
                const documentData = {
                    equipmentId: parsedEquipmentId,
                }
                const newPhoto = await uploadAndAddPhoto(file, documentData)

                activityLogger(user, "add", "Photo uploaded", `Photo for equipment ${newPhoto?.equipmentId} added`, newPhoto?.equipmentId);

                return res.json(newPhoto, { status: 201 });
            } catch (error) {
                if (imageUrl) {
                    await Gstorage.deleteObject(imageUrl)
                        .then(() => {
                            console.log("Fallback successfully deleted the photo");
                        })
                        .catch(() => {
                            throw new Error(`Fallback delete failed: ${error}`);
                        })
                }
            }
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? [error.message, error.cause, error.stack] : "Unknown error";
        res.json({ error: `Failed to post photo: ${msg}` }, { status: 500 });
    }
}