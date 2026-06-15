import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { NextRequest, NextResponse as res } from "next/server";
import buildError, { CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { documentsService } from "./service";
import { activitiesService } from "../activities/service";


export async function GET(
    req: NextRequest
) {
    try {
        const equipmentId = Number(req.nextUrl.searchParams.get("equipmentId"));
        if (isNaN(equipmentId)) throw new Error("Equipment ID is not a number");
        const documents = await documentsService.getDocumentsForEquipment(equipmentId);
        
        return res.json(documents, { status: 200 });        
    } catch (error) {
        const msg = error instanceof Error ? [error.message, error.cause, error.stack] : "Unknown error";
        return res.json({ error: `Failed to fetch documents: ${msg}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await validateUser("admin");

        const body = await req.formData();

        console.log(body);
        
        const { file, equipmentId, title, category, notes } = Object.fromEntries(body.entries()) as {
            file: File,
            equipmentId: string,
            title: string,
            category: "manual" | "maintenance" | "certificate" | "premob" | "fault" | "emergency" | "inspection" | "other",
            notes?: string
        }

        
        const parsedEquipmentId = Number(equipmentId);
        if (isNaN(parsedEquipmentId)) return res.json({ error: "Equipment ID is not a number" }, { status: 400 });
        if (!title) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            field: "title",
            message: "Title can't be empty",
            suggestion: "Double-check the input fields",
            status: 400
        })
        if (!category) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            field: "category",
            message: "Category can't be empty",
            suggestion: "Double-check the input fields",
            status: 400
        })
        if (file.size > 1024 * 1024 * 10) throw new CustomApiError({
            code: ERROR_CODES.VALIDATION_ERROR,
            field: "file",
            message: "File size too big",
            suggestion: "File size can't exceed 10MB. Choose another document",
            status: 400
        });
        
        
        const documentData = {
            file,
            equipmentId: parsedEquipmentId,
            title,
            category,
            notes,
        };
        
        const newDocument = await documentsService.addDocument(documentData);
        if (!newDocument) return res.json({ error: "Failed to upload the document" }, { status: 500 });
        
        await activitiesService.addActivity({
            user,
            action: "add",
            description: `Document uploaded for equipment ${newDocument.equipmentId}`,
            equipmentId: newDocument.equipmentId
        });
        
        return res.json(JSON.parse(JSON.stringify(newDocument)), { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}