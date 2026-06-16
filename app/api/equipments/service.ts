import { Equipment, InsertEquipment, InsertMaintenanceEvent } from "@/BACKEND/Database/schema";
import { AuthUser } from "@/BACKEND/Middleware/AuthService";
import { DBExecutor, storage } from "@/BACKEND/storage";
import { CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { activitiesService } from "../activities/service";
import { maintenancesService } from "../maintenances/service";
import { maintenanceEventsService } from "../maintenance-events/service";
import { db } from "@/BACKEND/Database/db";


type EquipmentFilters = {
    tenantId: number,
    concise: boolean,
    limit: number | undefined,
    page: number | undefined,
    location: string | undefined,
    status: string | undefined,
    type: string | undefined,
    category: string | undefined,
    search: string | undefined,
}

type UpdateEquipmentProps = {
    equipmentId: number,
    data: Partial<InsertEquipment>,
    user: AuthUser,
}

type PatchEquipmentProps = {
    equipmentId: number,
    data: {
        isDeleted?: boolean,
        status?: string,
        reason?: string,
        hadOverhaul?: boolean,
        finishDate?: string
    },
    user: AuthUser
}

class EquipmentsService {
    async getFilteredEquipmentsForTenant({ tenantId, concise, limit, page, location, status, type, category, search }: EquipmentFilters): Promise<{ equips: Partial<Equipment>[], totalCount: number }> {
        const equipments = await storage.getEquipments(tenantId, concise, limit, page, location, status, type, category, search);

        await storage.subtractMonthlyHealthDrop();

        return equipments;
    }

    async getEquipment(equipmentId: number, tenantId: number): Promise<Equipment | undefined> {
        return await storage.getEquipment(equipmentId, tenantId);
    }

    async addEquipment(data: InsertEquipment): Promise<Equipment> {
        return await storage.addEquipment(data);
    }

    async updateEquipment({equipmentId, data, user}: UpdateEquipmentProps, tx?: DBExecutor): Promise<Equipment> {
        const tenantId = user.tenantId;
        const equipment = await storage.getEquipment(equipmentId, tenantId);
        if (!equipment) throw new CustomApiError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Specified equipment not found",
            status: 404
        });

        const updatedEquipment = await storage.updateEquipment(equipmentId, data, tx);
        if (!updatedEquipment) throw new CustomApiError({
            code: ERROR_CODES.SERVER_ERROR,
            message: "Failed to update equipment",
            suggestion: "Try again later",
            status: 500
        });

        await activitiesService.addActivity({
            user,
            action: "update",
            description: `Equipment ${updatedEquipment?.name} updated`,
            equipmentId: updatedEquipment.id
        }, tx);

        return updatedEquipment;
    }

    async patchEquipment({ equipmentId, data, user }: PatchEquipmentProps): Promise<void> {
        const tenantId = user.tenantId;
        const { isDeleted, status, reason, hadOverhaul, finishDate } = data;

        const equipment = await storage.getEquipment(equipmentId, tenantId);
        if (!equipment) throw new CustomApiError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Specified equipment not found",
            status: 404
        });

        if (isDeleted) {
            if (!reason) throw new CustomApiError({
                code: ERROR_CODES.VALIDATION_ERROR,
                field: "reason",
                message: "No reason value passed",
                suggestion: "Double-check form input fields",
                status: 400
            });
            
            await this.deleteEquipment(equipmentId);
            await activitiesService.addActivity({
                user,
                action: "delete",
                description: `Equipment ${equipmentId} deleted. Reason: ${reason}`,
                equipmentId: equipment.id
            });
            
            return;
        }

        if (hadOverhaul) { 
            if (!finishDate) {
                throw new CustomApiError({
                    code: ERROR_CODES.VALIDATION_ERROR,
                    field: "finishDate",
                    message: "Finish date value not passed",
                    suggestion: "Double-check form input fields",
                    status: 400
                });
            }
            await overhaulPatch(equipment, user, hadOverhaul, finishDate);
            return;
        }

        if (status) {
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

            await statusPatch(equipment, user, status);
            return;
        }

        return;
    }
    
    async deleteEquipment(equipmentId: number): Promise<void> {
        await storage.deleteEquipment(equipmentId);
    }
}

export const equipmentsService = new EquipmentsService();

async function overhaulPatch(equipment: Equipment, user: AuthUser, hadOverhaul: boolean, finishDate: string) {
    const maintenance = await maintenancesService.getMaintenanceForEquipment(equipment.id);
    if (!maintenance) throw new CustomApiError({
        code: "NO_ACTIVE_MAINTENANCE",
        message: "Equipment status cannot be changed to 'under repair' without active maintenance",
        suggestion: "Start a maintenance operation for this equipment first",
        status: 409
    });

    await db.transaction(async (tx) => {
        await maintenancesService.cancelCurrentMaintenanceForEquipment(equipment.id, tx);

        await maintenanceEventsService.addEvents([
            {
                tenantId: equipment.tenantId,
                equipmentId: equipment.id,
                maintenanceId: maintenance.id,
                level: "O",
                title: `${equipment.assetId} overhaul`,
                description: `Overhaul maintenance for equipment ${equipment.name}`,
                start: new Date().toISOString().slice(0, 10),
                end: finishDate,
                status: "pending",
            }
        ], tx);
        
        const updatedEquipment = await equipmentsService.updateEquipment({ equipmentId: equipment.id, user, data: { hadOverhaul, status: "out of service" } }, tx);
        await activitiesService.addActivity({
            user,
            action: "update",
            description: `Overhaul initiated for equipment ${equipment.id}`,
            equipmentId: equipment.id,
        });

        return updatedEquipment;
    });

}

async function statusPatch(equipment: Equipment, user: AuthUser, status: Equipment["status"]) {
    switch (status) {
        case "operational":
            await equipmentsService.updateEquipment({ equipmentId: equipment.id, data: { status: "operational", hadOverhaul: false }, user });
            await activitiesService.addActivity({
                user,
                action: "update",
                description: `Equipment ${equipment.id} status set as Operational`,
                equipmentId: equipment.id
            })
            
            break;
        case "under repair":
            const maintenance = await storage.getMaintenance(equipment.id);
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
            await storage.updateEquipment(equipment.id, { status });
            break;
        default:
            await equipmentsService.updateEquipment({ equipmentId: equipment.id, data: { status }, user });
            await activitiesService.addActivity({
                user,
                action: "update",
                description: `Equipment ${equipment.name} status updated to ${status}`,
                equipmentId: equipment.id
            });
            
            break;
    }
}