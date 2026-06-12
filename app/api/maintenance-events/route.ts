import { insertMaintenanceEventSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


type Status = "any" | "pending" | "complete" | "incomplete";

export async function GET(req: NextRequest) {
    try {
        const user = await validateUser();
        
        const searchParams = req.nextUrl.searchParams;
        const status = searchParams.get("status") as Status;

        const start = searchParams.get("start") as string;
        const end = searchParams.get("end") as string;

        console.log(new Date(start));
        console.log(new Date(end));

        if (status) {
            if (!["any", "complete", "incomplete", "pending"].includes(status)) return res.json("Invalid status value", { status: 400 });

            if (start && end) {
                const response = await storage.getMaintenanceEvents(user.tenantId, status, start, end);
                return res.json(response, { status: 200 });
            }
            
            const response = await storage.getMaintenanceEvents(user.tenantId, status);

            return res.json(response, { status: 200 });
        }

        if (start !== undefined || end !== undefined) {
            const events = await storage.getMaintenanceEvents(user.tenantId, "any", start, end);
            return res.json(events, { status: 200 });
        }
        
        const response = await storage.getMaintenanceEvents(user.tenantId, "any");
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
        console.log(body);
        const newMaintenanceEvent = insertMaintenanceEventSchema.parse(body);

        await activityLogger(user, "add", `Maintenance events for equipment ${newMaintenanceEvent.equipmentId} added to the database`, newMaintenanceEvent.equipmentId)
        
    } catch (error: unknown) {
        return buildError(error);
    }
}