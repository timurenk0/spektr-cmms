import { insertComponentSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET() {
    try {
        const components = await storage.getComponents();

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

        await activityLogger(user, "add", "Component added", `Component ${newComponent.name} added for equipment ${newComponent.equipmentId}`, newComponent.equipmentId);

        return res.json(newComponent, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to add components: ${msg}` }, { status: 500 });
    }
}