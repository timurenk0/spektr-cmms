import { insertMaintenanceSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import buildError, { ApiError } from "@/BACKEND/Utils/errorBuilder";
import { DatabaseError } from "@neondatabase/serverless";
import { DrizzleQueryError } from "drizzle-orm";
import { NextRequest, NextResponse as res } from "next/server";
import { ZodError } from "zod";


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
        // const user = await validateUser("admin");

        // Parse request body to JSON format.
        // Parse maintenance data from request body with DB schema for validation.
        const body = await req.json();
        const equipment = await storage.getEquipment(body.equipmentId);
        // if (!equipment) return res.json({ error: "No equipment found" }, { status: 404 });
        if (!equipment) return buildError({
            code: "NOT_FOUND",
            field: "equipment_id",
            message: "Equipment with given id is not found.",
            suggestion: "Double-check the submitted form fields",
            status: 404
        });

        const data = {
            ...body,
            tenantId: equipment.tenantId
        }
        const maintenanceValidatedData = insertMaintenanceSchema.parse(data);
        if (!maintenanceValidatedData) return;

        if (maintenanceValidatedData.serviceStartDate >= maintenanceValidatedData.serviceEndDate) throw new ApiError({
            code: "VALIDATION_ERROR",
            field: "service_end_date",
            message: "Maintenance service can't start after or on the same date as service end date.",
            suggestion: "Double-check the submitted form fields.",
            status: 400
        })
        
        if (equipment.totalWorkingHours && !maintenanceValidatedData.dailyWorkingHours) throw new ApiError({
            code: "VALIDATION_ERROR",
            field: "daily_working_hours",
            message: "Equipment with total working hours values MUST have daily working hours in maintenance form.",
            suggestion: "Double-check the submitted form fields.",
            status: 400
        });
        
        console.log(maintenanceValidatedData);


        // Add validated maintenance data to the DB.
        const newMaintenance = await storage.addMaintenance(maintenanceValidatedData, equipment);
        const healthIndex = await storage.calculateHealthIndex(maintenanceValidatedData.equipmentId, maintenanceValidatedData.givenHealthIndex)

        await storage.updateEquipment(newMaintenance.equipmentId, {
            healthIndex: healthIndex
        });        

        // Log activity for added maintenance using helper logger method.
        // await activityLogger(user, "add", `Maintenance for equipment ${newMaintenance.equipmentId} added to the database`, newMaintenance.equipmentId);
        
        return res.json(JSON.parse(JSON.stringify(newMaintenance)), { status: 201 });
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return buildError({
                code: error.code,
                field: error.field,
                message: error.message,
                suggestion: error.suggestion,
                status: error.status
            })
        }
        
        if (error instanceof ZodError) {
            console.error(error);
            const firstError = error.issues[0];
            const field = firstError.path.join(".");

            switch (field) {
                case "tenantId":
                    return buildError({
                        code: "TENANT_ERROR",
                        field,
                        message: "Your account is linked with inexistent tenant",
                        suggestion: "Please contact IT administrator.",
                        status: 403
                    })
                default:
                    return buildError({
                        code: "VALIDATION_ERROR",
                        field,
                        message: firstError.message,
                        suggestion: "Double-check the submitted form fields.",
                        status: 400
                    })
            }
        }

        if (error instanceof DrizzleQueryError) {
            console.error(error);
            if (error.cause instanceof DatabaseError) {
                console.error(error.cause);

                return buildError({
                    code: "SERVER_ERROR",
                    message: "Something went wrong while creating maintenance.",
                    suggestion: "Please try again later.",
                    status: 500
                })
            }
        }
        
        console.error(error);
        
        return buildError({
            code: "UNKNOWN_ERROR",
            message: "Unexpected server error.",
            suggestion: "Please try again later.",
            status: 500
        })
    }
}