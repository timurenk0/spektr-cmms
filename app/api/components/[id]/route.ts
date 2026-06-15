import buildError from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";
import { componentsService } from "../service";
import { activitiesService } from "../../activities/service";
import { validateUser } from "@/BACKEND/Middleware/AuthService";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const { id } = await params;
        const componentId = parseInt(id);
        if (isNaN(componentId)) return res.json({ error: "Component ID is not a number" }, { status: 400 });

        const deletedComponent = await componentsService.deleteComponent(componentId);

        await activitiesService.addActivity({
            user,
            action: "delete",
            description: `Component ${deletedComponent.name} removed from equipment ${deletedComponent.equipmentId}`,
            equipmentId: deletedComponent.equipmentId
        });

        return res.json(true, { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}