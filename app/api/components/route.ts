import { insertComponentSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import buildError, { CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";
import { componentsService } from "./service";
import { activitiesService } from "../activities/service";


export async function GET(
    req: NextRequest
) {
    try {
        const equipmentId = Number(req.nextUrl.searchParams.get("equipmentId"));
        if (isNaN(equipmentId)) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Equipment ID is not a number",
            suggestion: "Try again later",
            status: 400
        });

        const components = await componentsService.getComponentsForEquipment(equipmentId);
        
        return res.json(components, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch components: ${msg}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");

        const body = await req.json();
        const componentValidatedData = insertComponentSchema.parse(body[0]);

        const newComponent = await componentsService.addComponent(componentValidatedData);

        await activitiesService.addActivity({
            user,
            action: "add",
            description: `Component ${newComponent.name} added for equipment ${newComponent.equipmentId}`,
            equipmentId: newComponent.equipmentId
        });

        return res.json(newComponent, { status: 201 });
    } catch (error: unknown) {
        // Catch generic errors
        return buildError(error);
    }
}