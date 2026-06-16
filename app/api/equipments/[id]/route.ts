import { insertEquipmentSchema, InsertMaintenanceEvent, MaintenanceEvent } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";
import { equipmentsService } from "../service";
import { activitiesService } from "../../activities/service";
import { maintenancesService } from "../../maintenances/service";
import { maintenanceEventsService } from "../../maintenance-events/service";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser();
        // Check whether passed equipment ID is valid.
        const equipmentId = Number((await params).id);
        if (!Number.isInteger(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });
        
        // Fetch specified equipment by ID and check if it exists.
        const equipment = await equipmentsService.getEquipment(equipmentId, user.tenantId);
        if (!equipment) throw new CustomApiError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Specified equipment not found",
            status: 404
        });
        
        return res.json(equipment , { status: 200 });
    } catch (error: unknown) {
        return buildError(error);
    }
}

export async function PUT(
    req: NextRequest,
    { params } : { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const equipmentId = Number((await params).id);
        if (!Number.isInteger(equipmentId)) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid equipment ID",
            status: 400
        });

        const body = await req.json();
        const equipmentValidatedData = insertEquipmentSchema.parse(body);
        
        const updatedEquipment = await equipmentsService.updateEquipment({equipmentId, data: equipmentValidatedData, user});
    
        return res.json(updatedEquipment, { status: 200 });       
    } catch (error: unknown) {
        return buildError(error);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate user.
        const user = await validateUser("admin");
        
        // Check wheter passed equipment ID is valid.
        const equipmentId = Number((await params).id);
        if (!Number.isInteger(equipmentId)) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid equipment ID",
            status: 400
        });
        
        const body = await req.json();
        console.log(body)
        // const { isDeleted, status, reason, hadOverhaul, finishDate } = body;


        await equipmentsService.patchEquipment({equipmentId, data: body, user});
        
        
        // Fetch specified equipment by ID and check if it exists.
        if (status) {
            if (status === "operational" && !await maintenanceEventsService.getPendingEmergencyEventsForEquipment(equipment.id) && !equipment.hadOverhaul) {
                await equipmentsService.updateEquipment(equipmentId, { status: "operational", hadOverhaul: false });
                await activitiesService.addActivity({
                    user,
                    action: "update",
                    description: `Equipment ${equipmentId} status set as Operational`,
                    equipmentId: equipment.id
                });

                return res.json(true, { status: 201 });
            }
            if (await maintenanceEventsService.getPendingEmergencyEventsForEquipment(equipment.id)) {
                throw new CustomApiError({
                    code: "ONGOING_EMERGENCY",
                    field: "status",
                    message: "Can't change equipment status during emergency maintenance",
                    suggestion: "Complete emergency maintenance event in the calendar first",
                    status: 400
                });
            }
            if (equipment.hadOverhaul) {
                throw new CustomApiError({
                    code: "ONGOING_OVERHAUL",
                    field: "status",
                    message: "Can't change equipment status during overhaul",
                    suggestion: "Complete overhaul event in the calendar first",
                    status: 400
                });
            }

            if (status === "under repair") {
                const maintenance = await storage.getMainteancesByEquipmentId(equipment.id);
                if (!maintenance) throw new CustomApiError({
                    code: "NO_ACTIVE_MAINTENANCE",
                    message: "Equipment status cannot be changed to 'under repair' without active maintenance",
                    suggestion: "Start a maintenance operation for this equipment first",
                    status: 409
                });
                
                const today = new Date().toISOString().slice(0, 10);
                const event: InsertMaintenanceEvent = {
                    equipmentId: equipment.id,
                    maintenanceId: maintenance.id,
                    title: `${equipment.assetId} emergency repair`,
                    description: `Emergency repair for equipment ${equipment.name} ${equipment.manufacturer}`,
                    level: "E",
                    status: "pending",
                    scheduledAt: today,
                    start: today,
                    tenantId: equipment.tenantId,
                    end: null,
                    performedAt: null
                };
                
                await storage.addMaintenanceEvents([event]);
                // await activityLogger(user, "add", `Emergency repair for equipment ${equipment.name} started!`, equipment.id);
            }

            equipment.status !== "out of service" && await equipmentsService.updateEquipment(equipmentId, { status });
            await activitiesService.addActivity({
                user,
                action: "update",
                description: `Equipment ${equipment.name} status updated to ${status}`,
                equipmentId: equipment.id
            });

            return res.json(true, { status: 201 });
        }

        return res.json({ message: "Nothing to change (edge case)" }, { status: 200 });        
    } catch (error: unknown) {
        return buildError(error);
    }
}