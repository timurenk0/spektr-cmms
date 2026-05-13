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
        const documentId = parseInt(id);
        if (isNaN(documentId)) return res.json({ error: "Document ID is not a number" }, { status: 400 });

        const deletedDocument = await storage.deleteDocument(documentId);
        if (!deletedDocument) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Document with given ID is not found.",
            suggestion: "Document might already be delete. Try refreshing the page.",
            status: 404
        });

        await Gstorage.deleteObject(deletedDocument?.fileUrl);

        await activityLogger(user, "delete", "Document deleted successfully"); 

        return res.json(true, { status: 200 });
    } catch (error: unknown) {
        return buildError(error);
    }
}