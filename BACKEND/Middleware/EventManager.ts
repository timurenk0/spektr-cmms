import { add, differenceInDays } from "date-fns";
import { Equipment, InsertMaintenanceEvent, Maintenance, MaintenanceEvent } from "../Database/schema";
import { storage } from "../storage";

export function createMaintenanceEvents(
    maintenance: Maintenance,
    equipment: Equipment,
    startDate?: string,
    endDate?: string
): InsertMaintenanceEvent[] {
    
    const start = startDate ? new Date(startDate) : new Date(maintenance.serviceStartDate);
    start.setUTCHours(0,0,0,0);
    const end = endDate ? new Date(endDate) : new Date(maintenance.serviceEndDate);
    end.setUTCHours(0,0,0,0);

    if (start >= end) throw new Error("Service start date can't be greater than service end date");

    const levels = {
        "I": {
            hours: maintenance.levelIMonths,
            duration: maintenance.levelIDuration
        },
        "D": {
            hours: maintenance.levelDHours,
            duration: maintenance.levelDDuration
        },
        "C": {
            hours: maintenance.levelCHours,
            duration: maintenance.levelCDuration
        },
        "B": {
            hours: maintenance.levelBHours,
            duration: maintenance.levelBDuration
        },
        "A": {
            hours: maintenance.levelAHours,
            duration: maintenance.levelADuration
        },
    };

    const eventMap: Record<string, InsertMaintenanceEvent> = {};
    const daily = maintenance.dailyWorkingHours;
    const events: InsertMaintenanceEvent[] = [];

    for (let [k, v] of Object.entries(levels)) {
        if (v.duration === 0 || v.hours === 0) continue;

        
        const day = 1000 * 3600 * 24;
        const OVERDUE_THRESHOLD = 3;
        let eventStart = new Date(start.getTime());
        let eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);
        
        if (k === "I") {            
            while (eventStart <= end) {
                const status = (new Date().getTime() - eventStart.getTime()) / day > OVERDUE_THRESHOLD ? "incomplete" : "pending";
                
                const event: InsertMaintenanceEvent = {
                    equipmentId: maintenance.equipmentId,
                    maintenanceId: maintenance.id,
                    tenantId: maintenance.tenantId,
                    title: `${equipment.assetId} level ${k}`,
                    description: `Level ${k} maintenance works for equipment ${equipment.name} ${equipment.manufacturer}. Scheduled at: ${eventStart.toISOString().slice(0, 10)}`,
                    start: eventStart.toISOString().slice(0, 10),
                    end: eventEnd.toISOString().slice(0, 10),
                    level: k,
                    scheduledAt: eventStart.toISOString().slice(0, 10),
                    performedAt: null,
                    status
                };
    
                // eventMap[eventStart.toISOString().slice(0, 10)] = event;
                events.push(event);
                
                eventStart = new Date((add(eventStart, { months: v.hours })).getTime() - day);
                eventEnd = new Date(eventStart.getTime() + (day * v.duration) - 1);
                
                if (eventStart > end) {
                    continue;
                }
            }
            continue;
        }
        
        if (!daily) throw new Error("No daily working hours value passed");
        const dayInterval = v.hours / daily;
        
        while (eventStart <= end) {
            const status = (new Date().getTime() - eventStart.getTime()) / day > OVERDUE_THRESHOLD ? "incomplete" : "pending";
            let closestDate = Object.keys(eventMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).findLast(e => e <= eventStart.toISOString().slice(0, 10) && (k !== "I" && eventMap[e].level > k));

            if (closestDate && (eventStart.getTime() - new Date(closestDate).getTime())/day < dayInterval) {
                eventStart = new Date(new Date(closestDate).getTime() + (day * dayInterval)); 
                eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);

                continue;
            }
            if (eventStart > end) {
                continue;
            }

            const event: InsertMaintenanceEvent = {
                equipmentId: maintenance.equipmentId,
                maintenanceId: maintenance.id,
                tenantId: maintenance.tenantId,
                title: `${equipment.assetId} level ${k}`,
                description: `Level ${k} maintenance works for equipment ${equipment.name} ${equipment.manufacturer}. Scheduled at: ${eventStart.toISOString().slice(0, 10)}`,
                start: eventStart.toISOString().slice(0, 10),
                end: eventEnd.toISOString().slice(0, 10),
                level: k,
                scheduledAt: eventStart.toISOString().slice(0, 10),
                performedAt: null,
                status
            };

            events.push(event);
            eventMap[eventStart.toISOString().slice(0, 10)] = event;
            eventStart = new Date(eventStart.getTime() + (day * dayInterval));
            eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);
        }
    }
    
    return events;
}