import { insertMaintenanceSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";
import z, { ZodError } from "zod";


export async function GET(req: NextRequest) {
    try {
        const maintenances = await storage.getMaintenances();
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
        const equipment = await storage.getEquipment(body.equipmentId);
        if (!equipment) return res.json({ error: "No equipment found" }, { status: 404 });
        const data = {
            ...body,
            tenantId: equipment.tenantId
        }
        const maintenanceValidatedData = insertMaintenanceSchema.parse(data);

        console.log(maintenanceValidatedData);


        // Add validated maintenance data to the DB.
        const newMaintenance = await storage.addMaintenance(maintenanceValidatedData);
        const healthIndex = await storage.calculateHealthIndex(maintenanceValidatedData.equipmentId, maintenanceValidatedData.givenHealthIndex)

        await storage.updateEquipment(newMaintenance.equipmentId, {
            healthIndex: healthIndex
        });        

        // Log activity for added maintenance using helper logger method.
        await activityLogger(user, "add", `Maintenance for equipment ${newMaintenance.equipmentId} added to the database`, newMaintenance.equipmentId);
        
        return res.json(JSON.parse(JSON.stringify(newMaintenance)), { status: 201 });
    } catch (error: unknown) {
        let msg = "Unknown error";
        if (error instanceof Error) {
            if (error instanceof ZodError) {
                const err = z.treeifyError(error);
                if (err.properties) {
                    if (Object.keys(err.properties).length > 0) {
                        const errKey = Object.keys(err.properties)[0];
                        const errVal = (Object.values(err.properties)[0].errors)[0];
                        console.error(errKey, errVal);

                        msg = `\"${errKey}\" field ${(errVal.split(":")[1]).trim()}`

                        if (errKey === "tenantId") {
                            msg = `User error. Kindly contact your admin to resolve the issue`;
                        }
                    }
                }
            } else {
                msg = error.message;
            }
        }
        
        return res.json({ error: msg }, { status: 500 });
    }
}