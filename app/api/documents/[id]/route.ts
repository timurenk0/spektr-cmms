import { validateUser } from "@/BACKEND/Middleware/AuthService";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";
import { documentsService } from "../service";
import { activitiesService } from "../../activities/service";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const { id } = await params;
        const documentId = Number(id);
        if (isNaN(documentId)) return res.json({ error: "Document ID is not a number" }, { status: 400 });

        const deletedDocument = await documentsService.deleteDocument(documentId);

        await activityLogger(user, "delete", "Document deleted successfully"); 
        await activitiesService.addActivity({
            user,
            action: "delete",
            description: `Document for equipment ${deletedDocument.equipmentId} deleted successfully`,
            equipmentId: deletedDocument.equipmentId
        });

        return res.json(true, { status: 200 });
    } catch (error: unknown) {
        return buildError(error);
    }
}