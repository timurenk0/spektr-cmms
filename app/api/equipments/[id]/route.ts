import { insertEquipmentSchema, InsertMaintenanceEvent, MaintenanceEvent } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
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
        // Check whether passed equipment ID is valid.
        const { id } = await params;
        const equipmentId = parseInt(id);
        if (isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });

        // Validate user.
        const user = await validateUser("admin");

        // Fetch specified equipment by passed ID and check if it exists.
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return res.json({ error: "Specified equipment not found" }, { status: 404 });

        // Parse request body to JSON format.
        // Parse equipment data from the request body with DB schema for validation.
        const body = await req.json();
        const equipmentValidatedData = insertEquipmentSchema.parse(body);
        
        // Updated specified equpiment with validated data.
        const updatedEquipment = await storage.updateEquipment(equipmentId, equipmentValidatedData);
    
        // Log the activity for update equipment using helper logger method.
        await activityLogger(user, "update", `Equipment ${updatedEquipment?.name} updated`, equipmentId);
    
        return res.json(updatedEquipment, { status: 200 });       
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to update specified equipment: ${msg}` }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateUser("admin");

        // Check wheter passed equipment ID is valid.
        const { id } = await params;
        const equipmentId = parseInt(id);
        if (isNaN(equipmentId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });

        const body = await req.json();
        console.log(body)
        const { status, reason } = body;
        
        // Validate user.
        
        // Fetch specified equipment by ID and check if it exists.
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return res.json({ error: "Specified equipment not found" }, { status: 404 });
        
        if (status && !reason) {
            await activityLogger(user, "update", `Equipment ${equipment.name} status updated to ${status}`, equipmentId);
            
            if (status === "under repair") {
                const maintenance = await storage.getMainteancesByEquipmentId(equipment.id);
                if (!maintenance) return res.json({ error: "Can't change status of equipment without ongoing maintenance" }, { status: 400 });
                
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
                await activityLogger(user, "add", `Emergency repair for equipment ${equipment.name} started!`, equipment.id);
            }
            
            if (status === "operational" && await storage.getEmergencyMaintenanceEventByEquipmentId(equipment.id)) { 
                return res.json({ error: "First finish ongoing emergency repair!" }, { status: 403 });
            }
            
            const newEquipment = await storage.updateEquipment(equipmentId, { status });
            if (!newEquipment) return res.json({ error: "Failed to update equipment status" }, { status: 500 })
            return res.json(true, { status: 200 });
        }

        // Log the activity for deleted equipment using helper logger method.
        await activityLogger(user, "delete", `Equipment ${equipment.name} removed | Reason: ${reason}`, equipmentId);       

        // Delete specified equipment.
        await storage.deleteEquipment(equipmentId);
        
        return res.json(true, { status: 200 });        
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to delete specified equipment: ${msg}` }, { status: 500 })
    }
}