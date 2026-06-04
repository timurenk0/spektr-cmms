import { insertDocumentSchema } from "@/BACKEND/Database/schema";
import { Gstorage } from "@/BACKEND/google-storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";
import uploadAndAddDocument from "./helper";
import buildError from "@/BACKEND/Utils/errorBuilder";


export async function GET() {
    try {
        const documents = await storage.getDocuments();

        if (!documents || documents.length === 0) return res.json({ message: "No documents found" }, { status: 404 });
        
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

        const { file, rawEquipmentId, title, category, notes } = Object.fromEntries(body.entries()) as {
            file: File,
            rawEquipmentId: string,
            title: string,
            category: string,
            notes?: string
        }

        console.log(rawEquipmentId);
        
        // Fetch the form data
        if (!file) return res.json({ error: "Failed to upload file to Google Bucket Storage" }, { status: 500 });
        if (file.size > 1024*1024*10) return res.json({ error: "File too big" }, { status: 400 });

        const equipmentId = Number(rawEquipmentId);
        console.log(equipmentId);
        if (isNaN(equipmentId)) return res.json({ error: "Equipment ID is not a number" }, { status: 400 });
        
        if (!title) return res.json({ error: "No document title passed" }, { status: 400 });
        
        
        if (!category) return res.json({ error: "No document category passed" }, { status: 400 });
        
        
        const documentData = {
            equipmentId,
            title,
            category,
            notes,
        };
        
        const newDocument = await uploadAndAddDocument(file, documentData);

        if (!newDocument) return res.json({ error: "Failed to upload the document" }, { status: 500 });
        
        await activityLogger(user, "add", `Document uploaded for equipment ${newDocument.equipmentId}`, newDocument.equipmentId);
        
        return res.json(JSON.parse(JSON.stringify(newDocument)), { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}