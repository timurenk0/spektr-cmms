import { Gstorage } from "@/BACKEND/google-storage";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import buildError from "@/BACKEND/Utils/errorBuilder";
import { NextRequest, NextResponse as res } from "next/server";
import uploadAndAddPhoto from "../helper";

export async function POST(req: NextRequest) {
    try {
        await validateUser("admin");

        const { imageUrl } = await req.json();

        if (!imageUrl) throw new Error("No image URL found.");

        const thumbnailUrl = await Gstorage.generateThumbnail(imageUrl);

        return res.json(thumbnailUrl, { status: 201 });
    } catch (error: unknown) {
        return buildError(error);
    }
}