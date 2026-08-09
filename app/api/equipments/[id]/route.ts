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
        
        // Recalculate equipment health index if usefulLifeSpan value is updated
        if (body.usefulLifeSpan) {
            const maintenance = await storage.getMaintenancesByEquipmentId(equipmentId);

            let givenHealthIndex = null;
            if (maintenance) givenHealthIndex = maintenance.givenHealthIndex;

            let newHealthIndex = await storage.calculateHealthIndex(equipmentId, givenHealthIndex);
            if (!maintenance) {
                const updatedEquipment = await storage.updateEquipment(equipmentId, { ...equipmentValidatedData, healthIndex: newHealthIndex });
                await activityLogger(user, "update", `Equipment ${updatedEquipment?.name} updated`, equipmentId);
                return res.json(newHealthIndex, { status: 201 });
            }
            
            const maintenanceEvents = await storage.getMaintenanceEvents(user.tenantId, "incomplete", maintenance.serviceStartDate, new Date().toISOString().slice(0, 10));
            let penaltyScore = 0;
            for (let ev of maintenanceEvents) {
                penaltyScore -= storage.subtractPenaltyScore({ ...ev, isOverdue: false });
            }

            await storage.updateEquipment(equipmentId, { healthIndex: newHealthIndex-penaltyScore, usefulLifeSpan: body.usefulLifeSpan });
        }
        
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
        const { isDeleted, reason } = body;
        
        
        // Fetch specified equipment by ID and check if it exists.
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Equipment with given ID is not found",
            status: 404
        });

        if (isDeleted && reason) {
            await storage.deleteEquipment(equipmentId);
            await activityLogger(user, "delete", `Equipment ${equipmentId} deleted. Reason: ${reason}`, equipmentId);
            return res.json(true, { status: 201 });
        }

        return res.json({ message: "Nothing to change (edge case)" }, { status: 200 });        
    } catch (error: unknown) {
        return buildError(error);
    }
}