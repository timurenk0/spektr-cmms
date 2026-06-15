import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { NextRequest, NextResponse as res } from "next/server";
import { activitiesService } from "./service";


export async function GET(
    req: NextRequest,
) {
    try {
        const user = await validateUser();

        const equipmentId = Number(req.nextUrl.searchParams.get("equipmentId"));
        if (isNaN(equipmentId)) throw new Error("Invalid equipment ID");
        
        const activities = await activitiesService.getActivities(user.tenantId, equipmentId);

        return res.json(activities, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch activities: ${msg}` }, { status: 500 });
    }
}