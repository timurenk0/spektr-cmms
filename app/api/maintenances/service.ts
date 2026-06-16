import { Maintenance } from "@/BACKEND/Database/schema";
import { DBExecutor, storage } from "@/BACKEND/storage";

class MaintenancesSercice {
    async getMaintenancesForTenant(tenantId: number): Promise<Maintenance[]> {
        return await storage.getMaintenances(tenantId);
    }
    
    async getMaintenanceForEquipment(equipmentId: number): Promise<Maintenance | undefined> {
        return await storage.getMaintenancesByEquipmentId(equipmentId);
    }

    async cancelCurrentMaintenanceForEquipment(equipmentId: number, tx?: DBExecutor): Promise<void> {
        await storage.cancelCurrentMaintenanceForEquipment(equipmentId, tx);
    }
}

export const maintenancesService = new MaintenancesSercice();