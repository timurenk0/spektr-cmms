import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const { id } = await params;
        const maintenanceId = parseInt(id);
        if (isNaN(maintenanceId)) return res.json({ error: "Invalid maintenance ID" }, { status: 400 });

        const body = await req.json();
        const { reason } = body;

        const maintenance = await storage.getMaintenance(maintenanceId);
        if (!maintenance) return res.json({ error: "Specified maintenance not found" }, { status: 404 });

        await activityLogger(user, "delete", "Maintenance deleted", `Maintenance for equipment ${maintenance.equipmentId} removed | Reason: ${reason}`, maintenance.equipmentId);

        await storage.deleteMaintenance(maintenanceId);

        return res.json(true, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch tenants: ${msg}` }, { status: 500 });
    }
}