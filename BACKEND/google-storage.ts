import { Storage } from "@google-cloud/storage";

const storage = new Storage({
    keyFilename: process.env.GCP_CREDENTIALS
});
const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
const bucket = storage.bucket(BUCKET_NAME);
const publicURL = `https://storage.googleapis.com/${BUCKET_NAME}`;

class GStorage {

    async getDocuments(): Promise<string[]> {
        const [files] = await storage.bucket("cmms_documents").getFiles();

        console.log("Files:");
        files.forEach(f => {
            console.log(f.name);
        })
        return [];
    }

    async uploadDocument(doc: File): Promise<string> {
        const buffer = Buffer.from(await doc.arrayBuffer());
        const now = new Date();
        const date = `${now.getFullYear}-${now.getMonth}`;
        const filePath = `uploads/${date}/${doc.name}`;

        const gcsFile = bucket.file(filePath);

        await gcsFile.save(buffer, {
            contentType: doc.type,
            resumable: false
        });

        // Uploaded file public URL
        const returnURL = publicURL+`/${filePath}`;
        return returnURL;
    }

}


export const Gstorage = new GStorage();