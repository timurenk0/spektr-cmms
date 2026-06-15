import { Equipment } from "@/BACKEND/Database/schema";
import { storage } from "@/BACKEND/storage";


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

class EquipmentsService {
    async getFilteredEquipmentsForTenant({ tenantId, concise, limit, page, location, status, type, category, search }: EquipmentFilters): Promise<{ equips: Partial<Equipment>[], totalCount: number }> {
        const equipments = await storage.getEquipments(tenantId, concise, limit, page, location, status, type, category, search);

        await storage.subtractMonthlyHealthDrop(tenantId);

        return equipments;
    }
}


export const equipmentsService = new EquipmentsService();