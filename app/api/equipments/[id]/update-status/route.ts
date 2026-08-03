import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { createEmergencyMaintenanceEvent, createOverhaulMaintenanceEvent } from "@/BACKEND/Middleware/EventManager";
import { storage } from "@/BACKEND/storage";
import buildError, { buildCustomError, CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const { id } = await params;

        const equipmentId = Number(id);
        if (isNaN(equipmentId)) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            field: "equipment_id",
            message: "Passed equipment ID is not a number",
            status: 400
        });

        const body = await req.json();
        const { status } = body;

        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) throw new CustomApiError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Specified equipment not found!",
            status: 404
        });

        if (equipment.status === status) throw new CustomApiError({
            code: "SAME_STATUS_ASSIGNMENT",
            message: "Cannot change equipment status to the same status",
            status: 400
        });

        const maintenance = await storage.getMainteancesByEquipmentId(equipmentId);
        
        switch (status) {
            case "operational":
                if (equipment.hasEmergency) throw new CustomApiError({
                    code: "ONGOING_EMERGENCY_REPAIR",
                    field: "status",
                    message: "Cannot change equipment status during emergency maintenance",
                    suggestion: "Complete emergency maintenance event in the calendar first",
                    status: 400
                });

                if (equipment.hasOverhaul) throw new CustomApiError({
                    code: "ONGOING_OVERHAUL",
                    field: "status",
                    message: "Cannot change equipment status during overhaul",
                    suggestion: "Complete overhaul maintenance event in the calendar first",
                    status: 400
                });

                await storage.updateEquipment(equipmentId, { status: "operational" });
                return res.json({ status: 201 }); 
            case "emergency":
                if (!maintenance) return buildCustomError({
                    code: "NO_ONGOING_MAINTENANCE",
                    message: "Cannot start emergency maintenance with no ongoing maintenance",
                    suggestion: "Create a maintenance schedule for this equipment first",
                    status: 400
                });

                if (equipment.hasOverhaul) return buildCustomError({
                    code: "ONGOING_OVERHAUL",
                    field: "status",
                    message: "Cannot change equipment status during overhaul",
                    suggestion: "Complete overhaul maintenance event in the calendar first",
                    status: 400
                });
                
                await storage.updateEquipment(equipmentId, { status: "under repair", hasEmergency: true, emergencyCounter: equipment.emergencyCounter+1 });

                const emergencyEvent = createEmergencyMaintenanceEvent(equipment, maintenance);
                await storage.addMaintenanceEvents([emergencyEvent]);

                return res.json({ status: 201 });
            case "overhaul":
                if (!maintenance) throw new CustomApiError({
                    code: "NO_ONGOING_MAINTENANCE",
                    message: "Cannot start emergency maintenance with no ongoing maintenance",
                    suggestion: "Create a maintenance schedule for this equipment first",
                    status: 400
                });

                if (equipment.hasEmergency) throw new CustomApiError({
                    code: "ONGOING_EMERGENCY_REPAIR",
                    field: "status",
                    message: "Cannot change equipment status during emergency maintenance",
                    suggestion: "Complete emergency maintenance event in the calendar first",
                    status: 400
                });

                const { endDate } = body;
                if (!endDate) throw new CustomApiError({
                    code: ERROR_CODES.VALIDATION_ERROR,
                    field: "endDate",
                    message: "Overhaul event end date value missing",
                    status: 400
                });

                await storage.updateEquipment(equipmentId, { status: "under repair", hasOverhaul: true, overhaulCounter: equipment.overhaulCounter+1 });

                const event = createOverhaulMaintenanceEvent(equipment, maintenance, endDate);
                await storage.addMaintenanceEvents([event]);
                
                return res.json({ status: 201 });
            case "out of service":
                await storage.updateEquipment(equipmentId, { status: "out of service" });

                return res.json({ status: 201 });
            default:
                throw new CustomApiError({
                    code: ERROR_CODES.VALIDATION_ERROR,
                    field: "status",
                    message: "Invalid status value",
                    status: 400,
                    suggestion: "Probably a bug. Report to the development team"
                });
        }

        return res.json({ status: 200 });
    } catch (error) {
        return buildError(error);
    }
}