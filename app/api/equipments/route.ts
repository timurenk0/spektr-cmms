import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";
import { insertEquipmentSchema } from "@/BACKEND/Database/schema";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { validateUser } from "@/BACKEND/Middleware/AuthService";


export async function GET(
    req: NextRequest,
) {
    try {
        const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "0");
        const page = parseInt(req.nextUrl.searchParams.get("page") ?? "0");
        const concise = (req.nextUrl.searchParams.get("concise") ?? "false");

        if (isNaN(limit) || isNaN(page)) throw new Error("Invalid limit/page parameter");
        
        const equipments = (concise || limit || page) ? await storage.getEquipments(concise, limit, page) : await storage.getEquipments();
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

        console.log(equipmentValidatedData);
        
        // Add validated equipment data to the DB.
        const newEquipment = await storage.addEquipment(equipmentValidatedData);
        
        // Log the activity for added equipment using helper logger method.
        await activityLogger(user, "add", "Equipment added", `Equipment ${newEquipment.name} added to the database`, newEquipment.id);

        return res.json(newEquipment, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? [error.message] : "Unkown error";
        return res.json({ error: `Failed to add equipment: ${msg}` }, { status: 500 });
    }
}