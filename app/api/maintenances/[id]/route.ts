import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function PATCH(
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
        if (!maintenance) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Maintenance with given ID not found",
            suggestion: "Maintenance might already be deleted. Try refreshing the page.",
            status: 404
        });

        await activityLogger(user, "delete", `Maintenance for equipment ${maintenance.equipmentId} removed | Reason: ${reason}`, maintenance.equipmentId);

        await storage.deleteMaintenance(maintenanceId);

        return res.json(true, { status: 200 });
    } catch (error: unknown) {
        return buildError(error);
    }
}