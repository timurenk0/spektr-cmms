import { storage } from "@/BACKEND/storage";
import { NextRequest, NextResponse as res } from "next/server";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const componentId = parseInt(id);
        if (isNaN(componentId)) return res.json({ error: "Component ID is not a number" }, { status: 400 });

        await storage.deleteComponent(componentId);

        return res.json(true, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to delete specified component: ${msg}` }, { status: 500 });
    }
}