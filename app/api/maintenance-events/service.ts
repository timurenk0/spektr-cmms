import { InsertMaintenanceEvent, MaintenanceEvent } from "@/BACKEND/Database/schema";
import { DBExecutor, storage } from "@/BACKEND/storage";

class MaintenanceEventsService {
    // async getMaintenanceEventsForTenant(tenantId: number): Promise<MaintenanceEvent[]> {
    //     return await storage.getMaintenanceEvents(tenantId);
    // }

    async getEventsForEquipmentByLevel(equipmentId: number, level?: MaintenanceEvent["level"]): Promise<MaintenanceEvent[]> {
        if (level) return await storage.getMaintenanceEventsByEquipmentId(equipmentId, level)
        return await storage.getMaintenanceEventsByEquipmentId(equipmentId);
    }

    async getPendingEmergencyEventsForEquipment(equipmentId: number) {
        return await storage.getEmergencyMaintenanceEventByEquipmentId(equipmentId);
    }

    async getPendingOverhaulEventsForEquipment(equipmentId: number) {
        return await storage.getOverhaulMaintenanceEventByEquipmentId(equipmentId);
    }
    
    async addEvents(data: InsertMaintenanceEvent[], tx?: DBExecutor): Promise<MaintenanceEvent[]> {
        return await storage.addMaintenanceEvents(data, tx);
    }
}

export const maintenanceEventsService = new MaintenanceEventsService();