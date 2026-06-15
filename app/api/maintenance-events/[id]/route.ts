import { insertMaintenanceEventSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
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

    //    console.log(await storage.subtractPenaltyScore(event));
       
       return res.json(event, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to get specified maintenance event: ${msg}` }, { status: 500 });
    }
}

export async function PATCH(
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
        if (!event) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Maintenance event with given ID is not found",
            suggestion: "Maintenance event might already be deleted. Try refreshing the page.",
            status: 404
        });


        if (event.level === "E") {
            const eventValidatedData = insertMaintenanceEventSchema.partial().parse({
                ...body,
                end: body.performedAt
            });
            await storage.updateMaintenanceEvent(eventId, eventValidatedData);

            // const equipment = await storage.updateEquipment(event.equipmentId, {status: "operational"});
            // if (!equipment) return res.json({ error: "Equipment not found!" }, { status: 404 });

            await storage.updateEquipment(event.equipmentId, { status: "operational" });

            await activityLogger(user, "update", `Emergency repair for equipment ${event.equipmentId} finished!`, event.equipmentId);
            
            return res.json(true, { status: 201 });
        }

        if (event.level === "O") {
            const eventValidatedData = insertMaintenanceEventSchema.partial().parse(body);
            await storage.updateMaintenanceEvent(eventId, eventValidatedData);

            // const equipment = await storage.updateEquipment(event.equipmentId, { status: "operational" });
            // if (!equipment) return res.json({ error: "Equipment not found!" }, { status: 404 });

            await storage.updateEquipment(event.equipmentId, { hadOverhaul: false, status: "operational" });

            await activityLogger(user, "update", `Overhaul repair for equipment ${event.equipmentId} finished!`, event.equipmentId);

            return res.json(true, { status: 201 });
        }
        
        const eventStatus = Math.abs(differenceInDays(body.performedAt, event.scheduledAt)) < 10 ? "overdue" : 
                            "incomplete"

        
        const updatedEvent = await storage.updateMaintenanceEvent(eventId, body);

        if (!updatedEvent) {
            return res.json({ error: "Specified maintenance event not found" }, { status: 404 });
        }

        await activityLogger(user, "update", `Maintenance event ${updatedEvent.id} updated`, updatedEvent.equipmentId);

        if (!updatedEvent.end || !updatedEvent.performedAt) {
            return buildCustomError({
                code: ERROR_CODES.VALIDATION_ERROR,
                field: "end or performedAt",
                message: "End date or performedAt value for given maintenance event is missing",
                suggestion: "Almost certainly a bug. Report to the developer",
                status: 500
            });
        }
        
        if (updatedEvent.status === "complete" && differenceInDays(updatedEvent.end, updatedEvent.performedAt) !== 0) {
            const shiftedEvents = await storage.shiftMaintenanceEvents(updatedEvent);
            if (shiftedEvents.length < 1) return res.json({ message: "Nothing to shift..." }, { status: 201 });
        }
        
        // Update equipment health score
        await storage.subtractPenaltyScore({...updatedEvent, isOverdue: eventStatus === "overdue"});
        
        return res.json(updatedEvent, { status: 201 });            
    } catch (error: unknown) {
        return buildError(error);
    }
}

// const getEventColor = (level: string) => {
//     const colors: Record<string, string> = {
//         A: "oklch(43.2% 0.095 166.913)",
//         B: "oklch(68.1% 0.162 75.834)",
//         C: "oklch(42.4% 0.199 265.638)",
//         D: "oklch(43.8% 0.218 303.724)",
//     }

//     return colors[level];
// }