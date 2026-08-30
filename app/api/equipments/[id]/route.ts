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
        if (body.usefulLifeSpan || body.dateOfManufacturing) {
            const maintenance = await storage.getMaintenancesByEquipmentId(equipmentId);
            console.log(maintenance);

            if (maintenance) {
                let givenHealthIndex = maintenance.givenHealthIndex;
                console.log("given health index:", givenHealthIndex)

                let newHealthIndex = await storage.calculateHealthIndex(equipmentId, givenHealthIndex, body.usefulLifeSpan);
                console.log("new health index:", newHealthIndex);
                
                const maintenanceEvents = await storage.getMaintenanceEvents(user.tenantId, "incomplete", maintenance.serviceStartDate, new Date().toISOString().slice(0, 10));
                let penaltyScore = 0;
                for (let ev of maintenanceEvents) {
                    penaltyScore += storage.subtractPenaltyScore({ ...ev, isOverdue: false });
                }

                console.log("newHealthIndex", newHealthIndex-penaltyScore)

                equipmentValidatedData.healthIndex = newHealthIndex - penaltyScore;
                equipment.usefulLifeSpan = body.usefulLifeSpan;
            }
        }

        console.log(body)
        if (body.requirements && body.requirements === "calibration and/or testing") {
            console.log("Null the total working hours value");
            equipmentValidatedData.totalWorkingHours = null;
            equipmentValidatedData.lastWorkingHoursEdit = null;
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
        
        const equipment = await storage.getEquipment(equipmentId);
        if (!equipment) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Equipment with given ID is not found",
            status: 404
        });

        const body = await req.json();
        console.log(body)
        const { isDeleted, reason } = body;
        
        if (isDeleted) {
            if (!reason) throw new Error("Deletion reason must be provided");

            await storage.deleteEquipment(equipmentId);
            await activityLogger(user, "delete", `Equipment ${equipmentId} deleted. Reason: ${reason}`, equipmentId);
            return res.json(true, { status: 201 });
        }

        console.log("Nothing changed (edge case)");
        return res.json({ message: "Nothing to change (edge case)" }, { status: 200 });        
    } catch (error: unknown) {
        return buildError(error);
    }
}