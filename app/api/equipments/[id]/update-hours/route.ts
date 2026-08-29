import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { createMaintenanceEvents } from "@/BACKEND/Middleware/EventManager";
import { storage } from "@/BACKEND/storage";
import buildError, { CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { type NextRequest, NextResponse as res } from "next/server";


export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");

        const { id } = await params;
        const equipmentId = parseInt(id);
        if (isNaN(equipmentId)) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid equipment ID passed",
            status: 400
        });

        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) throw new CustomApiError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Equipment with given ID not found",
            status: 404
        });
        
        const { workingHours } = await req.json();
        if (!equipment.totalWorkingHours || !equipment.lastWorkingHoursEdit) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Can't update working hours of equipment without total working hours value",
            suggestion: "Probably a bug. Report to the development team",
            status: 400
        });
        
        if (workingHours === equipment.totalWorkingHours) {
            await storage.updateEquipment(equipmentId, { totalWorkingHours: workingHours, lastWorkingHoursEdit: new Date().toISOString().slice(0, 10) });
            return res.json({ message: "Same working hours update" }, { status: 201 });
        }
        
        await storage.updateEquipment(equipmentId, { totalWorkingHours: workingHours, lastWorkingHoursEdit: new Date().toISOString().slice(0, 10) });

        // Update maintenance schedule daily working hours
        const maintenance = await storage.getMaintenancesByEquipmentId(equipmentId);
        if (!maintenance || !maintenance.dailyWorkingHours) return res.json({ message: "No maintenance found. Total working hours updated" }, { status: 201 });

        const daysSinceLastUpdate = Math.floor((new Date().getTime() - new Date(equipment.lastWorkingHoursEdit).getTime()) / (1000 * 3600 * 24));
        const newDailyWorkingHours = Math.round((workingHours - equipment.totalWorkingHours) / daysSinceLastUpdate);

        if (Math.abs(newDailyWorkingHours - maintenance.dailyWorkingHours) < 2) return res.json({ message: "Difference is insufficient (< 2). Updating just working hours"}, { status: 201 });

        // Adjust maintenance schedule
        let newEvents = createMaintenanceEvents({...maintenance, dailyWorkingHours: newDailyWorkingHours}, equipment);
        // pick only events after current date
        newEvents = newEvents.filter(ne => ne.start >= new Date().toISOString().slice(0, 10));
        await storage.cancelCurrentMaintenanceForEquipment(equipmentId);
        await storage.addMaintenanceEvents(newEvents);
        
        console.log("newDailyWorkingHours:", newDailyWorkingHours);
        
        // await storage.updateEquipment(equipmentId, { totalWorkingHours: workingHours, lastWorkingHoursEdit: new Date().toISOString().slice(0, 10) });
        
        return res.json(true, { status: 201 });
    } catch (error) {
        return buildError(error);
    }
}