import { insertMaintenanceSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(req: NextRequest) {
    try {
        const id = parseInt(req.nextUrl.searchParams.get("equipmentId") || "-1");

        if (isNaN(id)) return res.json({ error: "Invalid equipment ID" });
        
        const maintenances = id >= 0 ? await storage.getMainteancesByEquipmentId(id) : await storage.getMaintenances();
        return res.json(maintenances, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch maintenance records: ${msg}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Validate user.
        const user = await validateUser("admin");

        // Parse request body to JSON format.
        // Parse maintenance data from request body with DB schema for validation.
        const body = await req.json();
        const maintenanceValidatedData = insertMaintenanceSchema.parse(body);


        // Add validated maintenance data to the DB.
        const newMaintenance = await storage.addMaintenance(maintenanceValidatedData);
        const healthIndex = await storage.calculateHealthIndex(maintenanceValidatedData.equipmentId, maintenanceValidatedData.givenHealthIndex)

        await storage.updateEquipment(newMaintenance.equipmentId, {
            totalWorkingHours: body.totalWorkingHours,
            healthIndex: healthIndex.toString()
        });        

        // Log activity for added maintenance using helper logger method.
        await activityLogger(user, "add", "Maintenance added", `Maintenance for equipment ${newMaintenance.equipmentId} added to the database`, newMaintenance.equipmentId);
        
        return res.json(newMaintenance, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to add maintenance records: ${msg}` }, { status: 500 });
    }
}