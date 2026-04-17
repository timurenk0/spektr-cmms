import { Equipment, InsertMaintenanceEvent, Maintenance } from "../Database/schema";

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

    const eventMap: Record<string, any> = {};
    const daily = maintenance.dailyWorkingHours;

    for (let [k, v] of Object.entries(levels)) {
        if (v.duration === 0 || v.hours === 0) continue;
        
        const dayInterval = v.hours / daily;

        const day = 1000 * 3600 * 24;
        let eventStart = new Date(start.getTime());
        let eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);

        while (eventEnd <= end) {
            let closestDate = Object.keys(eventMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).findLast(e => e <= eventStart.toISOString().slice(0, 10) && eventMap[e].level > k);

            while (closestDate && (eventStart.getTime() - new Date(closestDate).getTime())/day < dayInterval) {
                eventStart = new Date(new Date(closestDate).getTime() + (day * dayInterval)); 
                eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);

                closestDate = Object.keys(eventMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).findLast(e => e <= eventStart.toISOString().slice(0, 10) && eventMap[e].level > k);
            }
            if (eventEnd > end) {
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
                isComplete: false
            };

            eventMap[eventStart.toISOString().slice(0, 10)] = event;
            eventStart = new Date(eventStart.getTime() + (day * dayInterval));
            eventEnd = new Date(eventStart.getTime() + (day * v.duration)-1);
        }
    }

    return Object.values(eventMap);
}