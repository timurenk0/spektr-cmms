import { Gstorage } from "@/BACKEND/google-storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import buildError from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";


export async function POST(req: NextRequest) {
    try {
        await validateUser("admin");

        const { filename, contentType } = await req.json();

        if (!filename || !contentType) throw new Error("Filename and content type are required");

        const url = await Gstorage.generatePhotoUploadUrl(filename, contentType);

        return res.json(url, { status: 201 });
    } catch (error) {
        return buildError(error);    
    }
}