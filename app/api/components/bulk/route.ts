import { insertComponentSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");
        
        const body = await req.json();
        
        if (!Array.isArray(body)) {
            return res.json({ error: "Expected array of components" }, { status: 400 });
        }

        const componentsValidatedData = body.map(c => insertComponentSchema.parse(c));

        const components = await storage.addComponentsBulk(componentsValidatedData);

        await activityLogger(user, "add", "Components added", `${components.length} components successfully added in bulk`, components[0].equipmentId);

        return res.json(components, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to post equipment components in bulk: ${msg}` }, { status: 500 });
    }
}