import { insertComponentSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");
        
        const body = await req.json();
        
        if (!Array.isArray(body)) return buildCustomError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Expected an array of components.",
            suggestion: "Most of the time some internal error.",
            status: 400
        });
        

        const componentsValidatedData = body.map(c => insertComponentSchema.parse(c));

        const components = await storage.addComponentsBulk(componentsValidatedData);

        await activityLogger(user, "add", `${components.length} components successfully added in bulk`, components[0].equipmentId);

        return res.json(components, { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}