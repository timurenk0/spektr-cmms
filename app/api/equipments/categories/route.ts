import { storage } from "@/BACKEND/storage";
import buildError from "@/BACKEND/Utils/errorBuilder";
import { NextResponse as res } from "next/server";


export async function GET() {
    try {
        const categoriesAndTypes = await storage.getEquipmentCategoriesAndTypes();

        return res.json(categoriesAndTypes, { status: 200 });
    } catch (error) {
        return buildError(error);
    }
}