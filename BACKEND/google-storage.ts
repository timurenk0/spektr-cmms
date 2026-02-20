import { Storage } from "@google-cloud/storage";

const storage = new Storage({
    keyFilename: process.env.GCP_CREDENTIALS
});
const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
const bucket = storage.bucket(BUCKET_NAME);
const publicURL = `https://storage.googleapis.com/${BUCKET_NAME}`;

class GStorage {

    async getDocuments(): Promise<string[]> {
        const [files] = await storage.bucket(BUCKET_NAME).getFiles();

        console.log("Files:");
        files.forEach(f => {
            console.log(f.name);
        })
        return [];
    }

    /**
     * Uploads the desirable document to Google Storage. Automatically creates folders with date of upload for easier navigation and filetering.
     * @param doc document file to upload to the Google Storage
     * @returns public URL to the stored document
     */
    async uploadDocument(doc: File): Promise<string> {
        const buffer = Buffer.from(await doc.arrayBuffer());
        
        // Generate document name using upload date
        const now = new Date();
        const date = `${now.getFullYear()}-${now.getMonth().toString().padStart(2, "0")}`;
        const filePath = `docs/${date}/${doc.name}`;

        const gcsFile = bucket.file(filePath);

        await gcsFile.save(buffer, {
            contentType: doc.type,
            resumable: false
        });

        // Uploaded file public URL
        const returnURL = publicURL+`/${filePath}`;
        return returnURL;
    }

    async getPhotos(): Promise<string[]> {
        return [];
    }

   
    /**
     * Uploads the desirable image to Google Storage. Automatically creates folders with date of upload for easier navigation and filetering.
     * @param img image file to upload to the Google Storage
     * @returns public URL to the stored image
     */
    async uploadPhoto(img: File): Promise<string> {
        return "";
    }

}


export const Gstorage = new GStorage();