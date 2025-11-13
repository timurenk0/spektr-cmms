import { storage } from "../storage";
import { insertMaintenanceEventSchema, type InsertMaintenanceEvent, type Maintenance, type MaintenanceEvent } from "../Database/schema";
import { differenceInDays, format } from "date-fns";


const getColor = (level: string) => {
    const colors: Record<string, string> = {
        A: "oklch(76.5% 0.177 163.223)",
        B: "oklch(85.2% 0.199 91.936)",
        C: "oklch(70.7% 0.165 254.624)",
        D: "oklch(71.4% 0.2063 306.703)",
        E: "#000"
    };

    return colors[level];
}

export async function generateEvents(
    maintenance: Maintenance,
    startDate?: string,
    endDate?: string
): Promise<InsertMaintenanceEvent[]> {
    const equipment = await storage.getEquipment(maintenance.equipmentId);
    if (!equipment) throw new Error("Equipment not found.");
    
    const start = startDate ? new Date(startDate) : new Date(maintenance.serviceStartDate);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(maintenance.serviceEndDate);
    end.setHours(0, 0, 0, 0);

    if (start > end || isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error("Invalid datetime range/format");

    const dailyWorkingHours = maintenance.dailyWorkingHours;
    
    const levels = [
        { level: "D", hours: maintenance.levelDHours, duration: maintenance.levelDDuration },
        { level: "C", hours: maintenance.levelCHours, duration: maintenance.levelCDuration },
        { level: "B", hours: maintenance.levelBHours, duration: maintenance.levelBDuration },
        { level: "A", hours: maintenance.levelAHours, duration: maintenance.levelADuration },
    ];

    const events: InsertMaintenanceEvent[] = [];
    let iter = 0;
    let flag = false;

    for (const { level, hours, duration } of levels) {
        if (!hours || !duration) continue;

        const intervalInDays = Math.ceil(hours / dailyWorkingHours);
        let eventStartDate = new Date(start);
        eventStartDate.setHours(0, 0, 0, 0);

        while (eventStartDate <= end) {
            if (flag && iter < events.length) {
                let higherLevelEventStartDate = new Date(events[iter].start);
                higherLevelEventStartDate.setHours(0, 0, 0, 0);

                let higherLevelEventEndDate = new Date(events[iter].end);
                higherLevelEventEndDate.setHours(0, 0, 0, 0);

                if (eventStartDate >= higherLevelEventStartDate) {
                    eventStartDate = new Date(higherLevelEventEndDate);
                    eventStartDate.setDate(higherLevelEventEndDate.getDate() + intervalInDays);
                    eventStartDate.setHours(0, 0, 0, 0);

                    ++iter;
                    continue;
                }
            }

            let eventEndDate = new Date(eventStartDate);
            eventEndDate.setDate(eventStartDate.getDate()+duration-1);
            eventEndDate.setHours(0, 0, 0, 0);

            if (eventEndDate > end) break;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const status = (today <= eventStartDate) ? "upcoming" : differenceInDays(today, eventStartDate) > 10 ? "incomplete" : "overdue";

            const event: InsertMaintenanceEvent = {
                title: `${equipment.name} maintenance`,
                description: `${equipment.name} ${equipment.assetId} maintenance works level ${level}`,
                equipmentId: equipment.id,
                maintenanceId: maintenance.id,
                level, status,
                start: format(eventStartDate, "yyyy-MM-dd"),
                end: format(eventEndDate, "yyyy-MM-dd"),
                scheduledAt: format(eventStartDate, "yyyy-MM-dd")
            }

            if (flag) {
                events.splice(iter, 0, event);
                ++iter;
            } else {
                events.push(event);
            }

            eventStartDate.setDate(eventStartDate.getDate() + intervalInDays);
            eventStartDate.setHours(0, 0, 0, 0);
        }

        flag = true;
        iter = 0;
    }


    const validateEvents = events.map(event => insertMaintenanceEventSchema.parse(event));

    return validateEvents.slice(1);
}

// export async function updateEvents(
//     eventId: number,
//     equipmentId: number,
//     maintenance: Maintenance
// ): Promise<{ updatedEvents: MaintenanceEvent[], deletedEventsId: number[] }> {
//     // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//     // return events from storage methods get maintenance events by equipment id
//     // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// }