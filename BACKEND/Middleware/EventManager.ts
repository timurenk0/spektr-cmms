import { addMonths, subDays, subMonths } from "date-fns";
import { Equipment, InsertMaintenanceEvent, Maintenance, MaintenanceEvent } from "../Database/schema";
import { storage } from "../storage";


function differenceInDays(date1: Date, date2: Date): number {
    return (date1.getTime() - date2.getTime()) / (1000 * 3600 * 24);
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 1000 * 3600 * 24);
}

function applyInterval(date: Date, interval: MaintenanceInterval, direction: "add" | "sub") {
    if (interval.type === "days") {
        return direction === "add"
            ? addDays(date, interval.value)
            : subDays(date, interval.value)
    }

    return direction === "add"
        ? addMonths(date, interval.value)
        : subMonths(date, interval.value)
}

type MaintenanceLevel = "I1" | "I2" | "I3" | "I4" | "I5" | "A" | "B" | "C" | "D";
type MaintenanceInterval = { type: "days", value: number } | { type: "months", value: number };
type CertificateDescriptionKey = `level${Extract<MaintenanceLevel, "I1" | "I2" | "I3" | "I4" | "I5">}Description`;
type LevelData = Record<MaintenanceLevel, { months?: number, hours?: number, duration: number }>

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

    if (start >= end) throw new Error("Service start date can't be greater than or equal to the service end date");

    const levels: LevelData = {
        "I5": {
            months: maintenance.levelI5Months,
            duration: maintenance.levelI5Duration
        },
        "I4": {
            months: maintenance.levelI4Months,
            duration: maintenance.levelI4Duration
        },
        "I3": {
            months: maintenance.levelI3Months,
            duration: maintenance.levelI3Duration
        },
        "I2": {
            months: maintenance.levelI2Months,
            duration: maintenance.levelI2Duration
        },
        "I1": {
            months: maintenance.levelI1Months,
            duration: maintenance.levelI1Duration
        },
        "D": {
            hours: maintenance.levelDHours,
            months: maintenance.levelDMonths,
            duration: maintenance.levelDDuration
        },
        "C": {
            hours: maintenance.levelCHours,
            months: maintenance.levelCMonths,
            duration: maintenance.levelCDuration
        },
        "B": {
            hours: maintenance.levelBHours,
            months: maintenance.levelBMonths,
            duration: maintenance.levelBDuration
        },
        "A": {
            hours: maintenance.levelAHours,
            months: maintenance.levelAMonths,
            duration: maintenance.levelADuration
        },
    };

    const eventMap: Record<string, InsertMaintenanceEvent> = {};
    const daily = maintenance.dailyWorkingHours;
    const events: InsertMaintenanceEvent[] = [];
    const day = 1000 * 3600 * 24;
    const OVERDUE_THRESHOLD = 3;

    for (let [k, v] of Object.entries(levels)) {
        if (v.duration === 0) continue;

        let eventStart = new Date(start.getTime());
        eventStart.setUTCHours(0, 0, 0, 0);
        
        if (k[0] === "I") {
            console.log("Entered certification event generation logic...");
            if (!v.months) continue;

            while (eventStart <= end) {
                const eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);
                const status = Math.floor(differenceInDays(new Date(), eventStart)) > OVERDUE_THRESHOLD ? "incomplete" : "pending";
                
                const event: InsertMaintenanceEvent = {
                    equipmentId: maintenance.equipmentId,
                    maintenanceId: maintenance.id,
                    tenantId: maintenance.tenantId,
                    title: `${equipment.assetId} certification task`,
                    description: maintenance[`level${k}Description` as CertificateDescriptionKey] || "",
                    start: eventStart.toISOString().slice(0, 10),
                    end: eventEnd.toISOString().slice(0, 10),
                    level: k,
                    scheduledAt: eventStart.toISOString().slice(0, 10),
                    performedAt: null,
                    status
                };
    
                // eventMap[eventStart.toISOString().slice(0, 10)] = event;
                events.push(event);
                
                eventStart = subDays(addMonths(eventStart, v.months), 1);
                eventStart.setUTCHours(0, 0, 0, 0);
            }
            continue;
        }
     
        if (!daily) throw new Error("No daily working hours value passed");
        let interval: MaintenanceInterval;

        if (!v.months && !v.hours) continue;
    
        if (!v.months && v.hours) {
            interval = {
                type: "days",
                value: Math.ceil(v.hours / daily)
            }
        } else if (!v.hours && v.months) {
            interval = {
                type: "months",
                value: v.months
            }
        } else {
            const hourlyDays = Math.ceil(v.hours! / daily);

            const hourlyDate = addDays(eventStart, hourlyDays);
            const monthlyDate = addMonths(eventStart, v.months!);

            interval = hourlyDate <= monthlyDate
                ? { type: "days", value: hourlyDays }
                : { type: "months", value: v.months! }
        }
       
        while (eventStart <= end) {
            console.log("Entered level-based event generation logic...");
            const status = Math.floor(differenceInDays(new Date(), eventStart)) > OVERDUE_THRESHOLD ? "incomplete" : "pending";
            const sortedDates = Object.keys(eventMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
            const closestDate = sortedDates.findLast(d => d <= eventStart.toISOString().slice(0, 10) && eventMap[d].level > k);
            
            if (closestDate && applyInterval(new Date(closestDate), interval, "add").toISOString().slice(0, 10) > eventStart.toISOString().slice(0, 10)) {
                console.log("Detected nearby higher-level event");
                eventStart = applyInterval(new Date(closestDate), interval, "add");
                eventStart.setUTCHours(0, 0, 0, 0);
                    
                continue;
            }

            console.log("Exited 'detected nearby higher-level event' logic");


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
            console.log("Pushed event to the events array");
            eventMap[eventEnd.toISOString().slice(0, 10)] = event;
            eventStart = applyInterval(eventStart, interval, "add");
            eventStart.setUTCHours(0, 0, 0, 0);
        } 
    }

    for (let i = 0; i < events.length; i++) {
        if (events[i].start === start.toISOString().slice(0, 10)) events.splice(i, 1);
    }

    console.log("Returning events");
    return events;
}

export function createEmergencyMaintenanceEvent(equipment: Equipment, maintenance: Maintenance) {
    const today = new Date().toISOString().slice(0, 10);
    
    const event: InsertMaintenanceEvent = {
        equipmentId: equipment.id,
        maintenanceId: maintenance.id,
        tenantId: equipment.tenantId,
        title: `${equipment.assetId} emergency repair`,
        description: `Emergency repair for equipment ${equipment.name} ${equipment.manufacturer}`,
        level: "E",
        status: "pending",
        scheduledAt: today,
        start: today,
        end: null,
        performedAt: null
    }

    return event;
}

export function createOverhaulMaintenanceEvent(equipment: Equipment, maintenance: Maintenance, endDate: string) {
    const today = new Date().toISOString().slice(0, 10);

    const event: InsertMaintenanceEvent = {
        equipmentId: equipment.id,
        maintenanceId: maintenance.id,
        tenantId: equipment.tenantId,
        title: `${equipment.assetId} overhaul`,
        description: `Overhaul repair event for equipment ${equipment.name} ${equipment.manufacturer}`,
        level: "O",
        status: "pending",
        scheduledAt: today,
        start: today,
        end: endDate,
        performedAt: null
    }

    return event;
}