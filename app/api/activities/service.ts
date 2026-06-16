import { Activity, insertActivitySchema } from "@/BACKEND/Database/schema";
import { AuthUser } from "@/BACKEND/Middleware/AuthService";
import { DBExecutor, storage } from "@/BACKEND/storage";

type AddActivity = {
    user: AuthUser,
    action: "add" | "update" | "delete",
    description: string,
    equipmentId?: number
}

class ActivitiesService {
    async getActivities(tenantId: number, equipmentId?: number): Promise<Activity[]> {
        if (!equipmentId) return await storage.getActivities(tenantId);

        return await storage.getActivities(tenantId, -1, equipmentId);
    }

    async addActivity({ user, action, description, equipmentId }: AddActivity, tx?: DBExecutor): Promise<Activity> {
        const validatedData = insertActivitySchema.parse({
            userId: user.id,
            username: user.username,
            tenantId: user.tenantId,
            action,
            description,
            equipmentId
        });

        return await storage.addActivity(validatedData, tx);
    }
}


export const activitiesService = new ActivitiesService();