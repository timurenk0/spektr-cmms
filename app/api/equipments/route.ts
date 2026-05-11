import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";
import { insertEquipmentSchema } from "@/BACKEND/Database/schema";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import z, { ZodError } from "zod";


export async function GET(
    req: NextRequest,
) {
    try {
        const user = await validateUser();
        const sp = req.nextUrl.searchParams;
        
        const limit = sp.has("limit") ? Number(sp.get("limit")) : undefined;
        const page = sp.has("page") ? Number(sp.get("page")) : undefined;

        if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
            throw new Error("limit value must be a positive integer");
        }

        if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
            throw new Error("page value must be a positive integer");
        }

        const concise = sp.get("concise") === "true";

        const filters = {
            location: sp.get("location") || undefined,
            status: sp.get("status") || undefined,
            type: sp.get("type") || undefined,
            category: sp.get("category") || undefined,
            search: sp.get("search") || undefined,
        }
        
        console.log(filters);

        const equipments = await storage.getEquipments(
            user.tenantId,
            concise ? "true" : undefined,
            limit, page,
            filters.location,
            filters.status,
            filters.type,
            filters.category,
            filters.search
        )

        return res.json(equipments, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: `Failed to fetch equipment: ${msg}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Validate user.
        const user = await validateUser("admin");
                
        // Parse request body to JSON format.
        // Parse equipment data from request body with DB schema for validation.
        const body = await req.json();
        const equipmentValidatedData = insertEquipmentSchema.parse(body);

        // Add validated equipment data to the DB.
        const newEquipment = await storage.addEquipment(equipmentValidatedData);
        
        // Log the activity for added equipment using helper logger method.
        await activityLogger(user, "add", `Equipment ${newEquipment.name} added to the database`, newEquipment.id);

        return res.json(JSON.parse(JSON.stringify(newEquipment)), { status: 201 });
    } catch (error: any) {
        let msg = "Unknown error";
        if (error instanceof Error) {
            if (error instanceof ZodError) {
                const err = z.treeifyError(error);
                if (err.properties) {
                    if (Object.keys(err.properties).length > 1) {
                        const errKey = Object.keys(err.properties)[0];
                        const errVal = (Object.values(err.properties)[0].errors)[0];
                        console.error(errKey, errVal);

                        msg = `\"${errKey}\" field ${(errVal.split(":")[1]).trim()}`;
                    }
                }
                // console.error(z.treeifyError(error).properties)
            } else {
                msg = error.message;
            }
        } 

        // const origmsg = error instanceof Error ? error.message : "Unkown error";
        return res.json({ error: msg }, { status: 500 });
    }
}