import { NextRequest } from "next/server";
import { validateUser } from "@/BACKEND/Middleware/AuthService";
import { Gstorage } from "@/BACKEND/google-storage";
import buildError from "@/BACKEND/Utils/errorBuilder";

export async function POST(req: NextRequest) {
    try {
        await validateUser("admin");

        const { filename, contentType } = await req.json();

        if (!filename || !contentType) {
            return Response.json(
                { error: "Missing filename or content type" },
                { status: 400 }
            );
        }

        const signedData = await Gstorage.generateDocumentUploadUrl(
            filename,
            contentType
        );

        return Response.json(signedData);

    } catch (error) {
        return buildError(error);
    }
}