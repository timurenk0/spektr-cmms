import { insertActivitySchema } from "../Database/schema";
import { AuthUser } from "../Middleware/AuthService";
import { storage } from "../storage";

export default async function activityLogger(user: AuthUser, action: string, title: string, description: string, equipmentId?: number) {
    // Build activity body and parse it with DB schema.
    const activityData = insertActivitySchema.parse({
        userId: user.id,
        username: user.username,
        action: action.toLowerCase(),
        title,
        description,
        equipmentId
    });
    
    // Add parsed activity data to the DB.
    const activity = await storage.addActivity(activityData);
    return activity;
}