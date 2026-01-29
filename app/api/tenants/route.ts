import { NextRequest, NextResponse as res } from "next/server";
import { storage } from "@/BACKEND/storage";
import { authService, authorize } from "@/BACKEND/Middleware/AuthService";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { insertTenantSchema } from "@/BACKEND/Database/schema";


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
        const user = await authService();
        if (!user) return res.json({ error: "Unauthorized" }, { status: 401 }); 
        if (!authorize(user, "admin")) return res.json({ error: "Forbidden" }, { status: 403 }); 

        const body = await req.json();
        const tenantValidatedData = insertTenantSchema.parse(body);

        const newTenant = await storage.addTenant(tenantValidatedData);

        await activityLogger(user, "add", "Tenant added", `Tenant ${newTenant.name} added to the database`, newTenant.id);

        return res.json(newTenant, { status: 201 });        
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to add tenant: ${msg}` }, { status: 500 })
    }
};