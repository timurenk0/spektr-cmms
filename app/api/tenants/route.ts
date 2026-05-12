import { NextRequest, NextResponse as res } from "next/server";
import { storage } from "@/BACKEND/storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { insertTenantSchema } from "@/BACKEND/Database/schema";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { ZodError } from "zod";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "@neondatabase/serverless";


export async function GET() {
    try {
        const tenants = await storage.getTenants(); 
        return res.json(tenants, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkonwn Error";
        return res.json({ error: `Failed to fetch tenants: ${msg}` }, { status: 500 })
    }
};

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");

        const body = await req.json();
        const tenantValidatedData = insertTenantSchema.parse(body);

        const newTenant = await storage.addTenant(tenantValidatedData);

        await activityLogger(user, "add", `Tenant ${newTenant.name} added to the database`, newTenant.id);

        return res.json(newTenant, { status: 201 });        
    } catch (error: unknown) {
        // Catch duplication error
        if (error instanceof DrizzleQueryError) {
            console.error(error);
            if (error.cause instanceof DatabaseError) {
                console.error(error);
                if (error.cause.code === "23505") {
                    return buildCustomError({
                        code: ERROR_CODES.DUPLICATION_ERROR,
                        field: "name",
                        message: "Tenant with this name already exists.",
                        suggestion: "Try a diffrent tenant name.",
                        status: 409
                    });
                }
            }
        }
        
        // Catch generic errors
        return buildError(error);
    }
};