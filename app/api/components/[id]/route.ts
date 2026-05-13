import { storage } from "@/BACKEND/storage";
import buildError, { buildCustomError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const componentId = parseInt(id);
        if (isNaN(componentId)) return res.json({ error: "Component ID is not a number" }, { status: 400 });

        const deletedComponent = await storage.deleteComponent(componentId);
        if (!deletedComponent) return buildCustomError({
            code: ERROR_CODES.NOT_FOUND_ERROR,
            message: "Component with given ID is not found",
            suggestion: "Component might already be deleted. Try refreshing the page.",
            status: 404
        });

        return res.json(true, { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}