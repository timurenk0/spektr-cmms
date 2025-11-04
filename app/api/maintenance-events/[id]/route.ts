import { insertMaintenanceEventSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { differenceInDays } from "date-fns";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
       const { id } = await params;
       const eventId = parseInt(id);

       if(isNaN(eventId)) return res.json({ error: "Invalid maintenance event ID" }, { status: 400 });

       const event = await storage.getMaintenanceEvent(eventId);

       if (!event) return res.json({ error: "Specified maintenance event not found" }, { status: 400 });
       
       return res.json(event, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to get specified maintenance event: ${msg}` }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");
        
        const { id } = await params;
        const eventId = parseInt(id);

        
        if (isNaN(eventId)) return res.json({ error: "Invalid event ID" }, { status: 400 });

        const body = await req.json();

        const event = await storage.getMaintenanceEvent(eventId);
        if (!event) return res.json({ error: "Specified maintenance event not found" }, { status: 404 });

        const eventStatus = differenceInDays(body.performedAt, event.scheduledAt) < 3 ? "complete" : 
                            differenceInDays(body.performedAt, event.scheduledAt) < 10 ? "overdue" : 
                            "incomplete"

        
        const eventValidatedData = insertMaintenanceEventSchema.partial().parse({
            ...body,
            status: body.status === "incomplete" ? "incomplete" : eventStatus,
            color: body.status === "incomplete" ? "oklch(44.4% 0.177 26.899)" : getEventColor(event.level),
        });

        console.log(eventValidatedData);
        
        
        const updatedEvent = await storage.updateMaintenanceEvent(eventId, eventValidatedData);

        if (!updatedEvent) {
            return res.json({ error: "Specified maintenance event not found" }, { status: 404 });
        }

        await activityLogger(user, "update", "Maintenance event updated", `Maintenance event ${updatedEvent.id} updated`, updatedEvent.equipmentId);
        
        return res.json(updatedEvent, { status: 201 });            
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to update specified maintenance event: ${msg}` }, { status: 500 });
    }
}

const getEventColor = (level: string) => {
    const colors: Record<string, string> = {
        A: "oklch(43.2% 0.095 166.913)",
        B: "oklch(68.1% 0.162 75.834)",
        C: "oklch(42.4% 0.199 265.638)",
        D: "oklch(43.8% 0.218 303.724)",
    }

    return colors[level];
}