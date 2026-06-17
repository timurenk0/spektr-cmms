import { insertMaintenanceSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // const user = await validateUser();

        const { id } = await params;
        const maintenanceId = parseInt(id);
        if (Number.isNaN(maintenanceId)) return res.json({ error: "Invalid maintenance ID" }, { status: 400 });

        const maintenance = await storage.getMaintenance(maintenanceId);
        if (!maintenance) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Specified maitnenance not found",
            suggestion: "Double-check maintenance ID or refresh the page",
            status: 404
        });

        return res.json(maintenance, { status: 200 });
    } catch (error: unknown) {
        return buildError(error);
    }
}

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
        const { reason, ...mData } = body;

        
        const maintenance = await storage.getMaintenance(maintenanceId);
        if (!maintenance) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Maintenance with given ID not found",
            suggestion: "Maintenance might already be deleted. Try refreshing the page.",
            status: 404
        });

        const equipment = await storage.getEquipment(maintenance.equipmentId);
        if (!equipment) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Equipment with given ID not found",
            suggestion: "Equipment might already be deleted. Try refreshing the page.",
            status: 404
        });


        if (reason) {
            await storage.deleteMaintenance(maintenanceId);
            await activityLogger(user, "delete", `Maintenance for equipment ${maintenance.equipmentId} removed | Reason: ${reason}`, maintenance.equipmentId);
            return res.json(true, { status: 201 });
        }

        const validatedData = insertMaintenanceSchema.parse({
            ...mData,
            tenantId: maintenance.tenantId,
            equipmentId: maintenance.equipmentId
        });
        const newMaintenance = await storage.updateMaintenance(maintenanceId, validatedData, equipment);

        await storage.updateEquipment(equipment.id, { healthIndex: newMaintenance?.givenHealthIndex });
        

        return res.json(newMaintenance, { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}