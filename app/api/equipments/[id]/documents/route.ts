import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
       const { id } = await params;
       console.log(id);
       const equipmetnId = parseInt(id);
       if (isNaN(equipmetnId)) return res.json({ error: "Invalid equipment ID" }, { status: 400 });
       
       const documents = await storage.getDocuments(equipmetnId);
       if (!documents) return res.json({ message: "No documents found for specified equipment" }, { status: 404 });

       return res.json(documents, { status: 200 });       
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch documents for specified equipment: ${msg}` }, { status: 500 });
    }
}