import { NextRequest, NextResponse as res } from "next/server";
import { Storage } from "@google-cloud/storage";
import formidable from "formidable";
import fs from "fs";
import { fa } from "zod/v4/locales";


const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_CREDENTIALS
});
const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);


export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fileName = searchParams.get("file") as string;
        if (!fileName) throw new Error("File parameter missing");

        const file = bucket.file(fileName);

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 15*60*1000
        });
        
        return res.json(url, { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.json({ error: `Failed to fetch document: ${msg}` }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {

        const buffer = Buffer.from(await req.arrayBuffer());
        const originalFilename = req.headers.get("X-Filename")!;
        const safeFilename = originalFilename.replace(/\s+/g, "_");

        const now = new Date();
        const fileName = `uploads/${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, "0")}/${now.getTime()}-${safeFilename}.pdf`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
            contentType: "application/pdf",
            resumable: false,
        });

        const url = `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${fileName}`;
        return res.json(url, { status: 200 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to upload document ${msg}`);
    }
}