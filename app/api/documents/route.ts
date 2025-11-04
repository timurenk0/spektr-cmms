import { insertDocumentSchema } from "@/BACKEND/Database/schema";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { storage } from "@/BACKEND/storage";
import activityLogger from "@/BACKEND/Utils/activityLogger";
import { NextRequest, NextResponse as res } from "next/server";


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

        const body = await req.json();
        const documentValidatedData = insertDocumentSchema.parse(body);

        console.log(documentValidatedData);

        const newDocument = await storage.addDocument(documentValidatedData);
        
        await activityLogger(user, "add", "Document uploaded", `Document uploaded for equipment ${newDocument.equipmentId}`, newDocument.equipmentId);
        
        return res.json(newDocument, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? [error.message, error.cause, error.stack] : "Unknown error";
        return res.json({ error: `Failed to post document: ${msg}` }, { status: 500 });
    }
}