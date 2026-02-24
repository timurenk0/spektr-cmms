import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const documentId = parseInt(id);
        if (isNaN(documentId)) return res.json({ error: "Document ID is not a number" }, { status: 400 });

        const documentUrl = await storage.deleteDocument(documentId);

        await Gstorage.deleteObject(documentUrl);

        return res.json(true, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to delete specified document: ${msg}` }, { status: 500 });
    }
}