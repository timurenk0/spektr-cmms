import { insertMaintenanceEventSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get("equipmentId");
        const status = searchParams.get("status");

        const start = searchParams.get("start");
        const end = searchParams.get("end");


        if (id) {
            const equipmentId = parseInt(id);
            
            if (isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });
            
            const response = await storage.getClosestMaintenanceEventsForEquipment(equipmentId);
            
            return res.json(response, { status: 200 });
        }

        if (status) {
            if (!["all", "upcoming", "overdue", "complete", "incomplete"].includes(status)) return res.json("Invalid status value", { status: 400 });

            if (start && end) {
                const response = await storage.getMaintenanceEvents(status, start, end);
                return res.json(response, { status: 200 });
            }
            
            const response = await storage.getMaintenanceEvents(status);

            return res.json(response, { status: 200 });
        }
        
        const response = await storage.getMaintenanceEvents("any");
        return res.json(response, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch maintenance events records: ${msg}`}, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");
        
        const body = req.json();
        const newMaintenanceEvent = insertMaintenanceEventSchema.parse(body);

        await activityLogger(user, "add", "Maintenance events added", `Maintenance events for equipment ${newMaintenanceEvent.equipmentId} added to the database`, newMaintenanceEvent.equipmentId)
        
    } catch (error) {
        const msg = error instanceof Error ? [error.message, error.stack] : "Unknown error";
        return res.json({ error: `Failed to add maintenance events records: ${msg}` }, { status : 500 })
    }
}