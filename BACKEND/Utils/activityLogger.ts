import { insertActivitySchema } from "../Database/schema";
import { AuthUser } from "../Middleware/AuthService";
import { storage } from "../storage";
import { buildCustomError } from "./errorBuilder";

export default async function activityLogger(user: AuthUser, action: string, description: string, equipmentId?: number) {
    try {
        // Build activity body and parse it with DB schema.
        const activityData = insertActivitySchema.parse({
            userId: user.id,
            username: user.username,
            tenantId: user.tenantId,
            action: action.toLowerCase(),
            description,
            equipmentId
        });
        
        // Add parsed activity data to the DB.
        const activity = await storage.addActivity(activityData);
        return activity;
    } catch (error: unknown) {
        console.error(error);
        return buildCustomError({
            code: "UNKNOWN_ERROR",
            message: "Failed to create activity log.",
            suggestion: "Try again later."
        });
    }
}