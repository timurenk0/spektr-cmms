import { insertComponentSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest
) {
    try {
        const equipmentId = Number(req.nextUrl.searchParams.get("equipmentId"));
        if (!Number.isInteger(equipmentId)) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid equipment ID",
            status: 400
        });
        
        let components = [];

        if (!equipmentId) components = await storage.getComponents();
        
        components = await storage.getComponentsForEquipment(equipmentId);

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

        const newComponent = await storage.addComponent(componentValidatedData);

        await activityLogger(user, "add", `Component ${newComponent.name} added for equipment ${newComponent.equipmentId}`, newComponent.equipmentId);

        return res.json(newComponent, { status: 201 });
    } catch (error: unknown) {
        // Catch generic errors
        return buildError(error);
    }
}