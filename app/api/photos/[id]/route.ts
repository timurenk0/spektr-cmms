import { Gstorage } from "@/BACKEND/google-storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const { id } = await params;
        const photoId = parseInt(id);
        if (isNaN(photoId)) return res.json({ error: "Photo ID is not a number" }, { status: 400 });

        const deletedPhoto = await storage.deletePhoto(photoId);
        if (!deletedPhoto) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Image with given ID is not found.",
            suggestion: "Image might already be deleted. Try refreshing the page.",
            status: 404
        })

        await Gstorage.deleteObject(deletedPhoto.imageUrl);

        await activityLogger(user, "delete", `Photo deleted for equipment ${deletedPhoto.equipmentId}`, deletedPhoto.equipmentId);

        return res.json(true, { status: 200 });
    } catch (error: unknown) {
        return buildError(error);
    }
}