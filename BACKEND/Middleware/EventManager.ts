import { add, addMonths, subDays } from "date-fns";
import { Equipment, InsertMaintenanceEvent, Maintenance, MaintenanceEvent } from "../Database/schema";
import { storage } from "../storage";


function differenceInDays(date1: Date, date2: Date): number {
    return (date1.getTime() - date2.getTime()) / (1000 * 3600 * 24);
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 1000 * 3600 * 24);
}


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
        "I2": {
            hours: maintenance.levelIMonths2,
            duration: maintenance.levelIDuration2
        },
        "I1": {
            hours: maintenance.levelIMonths1,
            duration: maintenance.levelIDuration1
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
    const day = 1000 * 3600 * 24;
    const OVERDUE_THRESHOLD = 3;

    for (let [k, v] of Object.entries(levels)) {
        if (v.duration === 0 || v.hours === 0) continue;

        let eventStart = new Date(start.getTime());
        
        if (k === "I2" || k === "I1") {            
            while (eventStart <= end) {
                const eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);
                const status = Math.floor(differenceInDays(new Date(), eventStart)) > OVERDUE_THRESHOLD ? "incomplete" : "pending";
                
                const event: InsertMaintenanceEvent = {
                    equipmentId: maintenance.equipmentId,
                    maintenanceId: maintenance.id,
                    tenantId: maintenance.tenantId,
                    title: `${equipment.name} ${equipment.assetId}`,
                    description: k === "I2" ? maintenance.levelIDescription2 || "" : maintenance.levelIDescription1 || "",
                    start: eventStart.toISOString().slice(0, 10),
                    end: eventEnd.toISOString().slice(0, 10),
                    level: k,
                    scheduledAt: eventStart.toISOString().slice(0, 10),
                    performedAt: null,
                    status
                };
    
                // eventMap[eventStart.toISOString().slice(0, 10)] = event;
                events.push(event);
                
                eventStart = subDays(addMonths(eventStart, v.hours ), 1);
            }
            continue;
        }
        
        if (!daily) throw new Error("No daily working hours value passed");
        const dayInterval = Math.ceil(v.hours / daily);
        
        while (eventStart <= end) {
            const status = Math.floor(differenceInDays(new Date(), eventStart)) > OVERDUE_THRESHOLD ? "incomplete" : "pending";
            const sortedDates = Object.keys(eventMap)
                .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            const closestDate = sortedDates.findLast(e => 
                e <= eventStart.toISOString().slice(0, 10) && 
                eventMap[e].level > k
            );
            
            // if (closestDate && (eventStart.getTime() - new Date(closestDate).getTime())/day < dayInterval) {
            //     eventStart = addDays(new Date(closestDate), dayInterval); 
            //     eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);

            //     continue;
            // }
            if (closestDate) {
                const daysSince = Math.floor(differenceInDays(eventStart, new Date(closestDate)));
                if (daysSince < dayInterval) {
                    eventStart = addDays(new Date(eventMap[closestDate].end!), dayInterval);
                    continue;
                }
            }
            
            if (eventStart > end) break;

            const eventEnd = new Date(eventStart.getTime() + (day * v.duration) - 1);

            const event: InsertMaintenanceEvent = {
                equipmentId: maintenance.equipmentId,
                maintenanceId: maintenance.id,
                tenantId: maintenance.tenantId,
                title: `${equipment.name} ${equipment.assetId}`,
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
            eventStart = addDays(eventStart, dayInterval);
        }
    }
    
    return events.toSpliced(0, 1);
}