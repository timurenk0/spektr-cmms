import { insertEquipmentSchema, InsertMaintenanceEvent, MaintenanceEvent } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check whether passed equipment ID is valid.
        const { id } = await params;
        const equipmentId = parseInt(id);
        if (isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });
        
        // Fetch specified equipment by ID and check if it exists.
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return res.json({ error: "Specified equipment not found" }, { status: 404 });
        
        // const closestEvents = await storage.getClosestMaintenanceEventsForEquipment(equipmentId);

        return res.json(equipment , { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to fetch specified equipment" ${msg}` }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params } : { params: Promise<{ id: string }> }
) {
    try {
        // Validate user.
        const user = await validateUser("admin");
        
        // Check whether passed equipment ID is valid.
        const { id } = await params;
        const equipmentId = parseInt(id);
        if (isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });


        // Fetch specified equipment by passed ID and check if it exists.
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Equipment with given ID is not found",
            status: 404
        })

        // Parse request body to JSON format.
        // Parse equipment data from the request body with DB schema for validation.
        const body = await req.json();
        const equipmentValidatedData = insertEquipmentSchema.parse(body);
        
        // Updated specified equpiment with validated data.
        const updatedEquipment = await storage.updateEquipment(equipmentId, equipmentValidatedData);
    
        // Log the activity for update equipment using helper logger method.
        await activityLogger(user, "update", `Equipment ${updatedEquipment?.name} updated`, equipmentId);
    
        return res.json(updatedEquipment, { status: 200 });       
    } catch (error: unknown) {
        return buildError(error);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Validate user.
        const user = await validateUser("admin");
        
        // Check wheter passed equipment ID is valid.
        const { id } = await params;
        const equipmentId = parseInt(id);
        if (isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });
        
        const body = await req.json();
        console.log(body)
        const { status, reason, hadOverhaul } = body;
        
        
        // Fetch specified equipment by ID and check if it exists.
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Equipment with given ID is not found",
            status: 404
        });

        console.log(body);
        
        if (!reason && (hadOverhaul !== undefined || hadOverhaul !== null)) {
            await storage.updateEquipment(equipmentId, { hadOverhaul, status: hadOverhaul ? "out of service" : "operational" });
            return res.json(hadOverhaul, { status: 201 });
        }
        
        if (status && !reason) {
            await activityLogger(user, "update", `Equipment ${equipment.name} status updated to ${status}`, equipmentId);
            
            if (status === "under repair") {
                const maintenance = await storage.getMainteancesByEquipmentId(equipment.id);
                if (!maintenance) return buildCustomError({
                    code: "NO_ACTIVE_MAINTENANCE",
                    message: "Equipment status cannot be changed to 'under repair' without active maintenance.",
                    suggestion: "Start a maintenance operation for this equipment first.",
                    status: 409
                });
                
                const today = new Date().toISOString().slice(0, 10);
                const event: InsertMaintenanceEvent = {
                    equipmentId: equipment.id,
                    maintenanceId: maintenance.id,
                    title: `${equipment.assetId} emergency repair`,
                    description: `Emergency repair for equipment ${equipment.name} ${equipment.manufacturer}`,
                    level: "E",
                    status: "pending",
                    scheduledAt: today,
                    start: today,
                    tenantId: equipment.tenantId,
                    end: null,
                    performedAt: null
                };
                
                await storage.addMaintenanceEvents([event]);
                // await activityLogger(user, "add", `Emergency repair for equipment ${equipment.name} started!`, equipment.id);
            }
            
            if (status === "operational" && await storage.getEmergencyMaintenanceEventByEquipmentId(equipment.id)) { 
                return buildCustomError({
                    code: "EMERGENCY_MAINTENANCE_ACTIVE",
                    message: "Equipment cannot be marked operational yet.",
                    suggestion: "Finish the ongoing emergency repair for current equipment first.",
                    status: 409
                });
            }
            
            const newEquipment = await storage.updateEquipment(equipmentId, { status });
            if (!newEquipment) return res.json({ error: "Failed to update equipment status" }, { status: 500 })
            return res.json(true, { status: 200 });
        }

        // Log the activity for deleted equipment using helper logger method.
        // await activityLogger(user, "delete", `Equipment ${equipment.name} removed | Reason: ${reason}`, equipmentId);       

        // Delete specified equipment.
        await storage.deleteEquipment(equipmentId);
        
        return res.json(true, { status: 200 });        
    } catch (error: unknown) {
        return buildError(error);
    }
}