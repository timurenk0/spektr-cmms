import { Bucket, Storage } from "@google-cloud/storage";
import sharp from "sharp";

let storage: Storage;
if (process.env.NODE_ENV === "production") {
    if (!process.env.GOOGLE_CREDENTIALS) {
        throw new Error("GOOGLE_CREDENTIALS environment variable is missing");
    }
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

    storage = new Storage({credentials}); 
} else {
    storage = new Storage({
        keyFilename: process.env.GCP_CREDENTIALS
    })
}
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

        if (buffer.byteLength > 1024*1024*10) throw new Error("File too big!");
        
        // Generate document folder name using current date
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

    async generateDocumentUploadUrl(
        filename: string,
        contentType: string
    ): Promise<{ uploadUrl: string; fileUrl: string }> {

        const now = new Date();

        const date = `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;

        // Avoid collisions if two files have the same name
        const filePath = `docs/${date}/${crypto.randomUUID()}-${filename}`;

        const gcsFile = bucket.file(filePath);


        const [uploadUrl] = await gcsFile.getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + 15 * 60 * 1000,
            contentType
        });


        return {
            uploadUrl,
            fileUrl: `${publicURL}/${filePath}`
        };
    }

    async generatePhotoUploadUrl(
        filename: string,
        contentType: string
    ): Promise<{ uploadUrl: string; fileUrl: string }> {

        const now = new Date();

        const date = `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}`;

        // Avoid collisions if two files have the same name
        const filePath = `imgs/${date}/${crypto.randomUUID()}-${filename}`;

        const gcsFile = bucket.file(filePath);


        const [uploadUrl] = await gcsFile.getSignedUrl({
            version: "v4",
            action: "write",
            expires: Date.now() + 15 * 60 * 1000,
            contentType
        });


        return {
            uploadUrl,
            fileUrl: `${publicURL}/${filePath}`
        };
    }

    /**
     * Delets the specified document/photo by public URL stored in the database
     * @param url Public URL of a document/photo stored in the database
     */
    async deleteObject(url: string): Promise<void> {
        try {
            const filePath = url.split(BUCKET_NAME+"/")[1];
            await bucket.file(filePath).delete();
        } catch (error) {
            throw error;
        }
    }

    async getPhotos(): Promise<string[]> {
        return [];
    }

    /**
     * Uploads the desirable thumbnail image (resized & optimized) to Google Storage. Automatically creates folders with date of upload for easier navigation and filetering.
     * @param img image file to upload to the Google Storage
     * @returns public URL to the stored resized image
     */
    // async uploadThumbPhoto(imageUrl: string): Promise<string> {
    //     const filePath = imageUrl.replace(`${publicURL}/`, "");
    //     const splittedFilePath = filePath.split("/");
    //     const originalFilename = splittedFilePath[splittedFilePath.length-1];
    //     console.log(splittedFilePath);
    //     console.log(originalFilename);

    //     const [buffer] = await bucket.file(filePath).download();

    //     const thumbBuffer = await sharp(buffer)
    //             .rotate()
    //             .resize({
    //                 width: 200,
    //                 withoutEnlargement: true
    //             })
    //             .webp({
    //                 quality: 70
    //             })
    //             .toBuffer()
    
    //     const now = new Date();

    //     const date = `${now.getFullYear()}-${now.getMonth().toString().padStart(2, "0")}`;

    //     const filename = `thumbs/${date}/${crypto.randomUUID()}-${originalFilename}`;

    //     await bucket.file(filename).save(thumbBuffer, {
    //         contentType: "image/webp",
    //         resumable: false
    //     });

    //     return `${publicURL}/${filename}`
    // }
    
    async generateThumbnail(imageUrl: string): Promise<string> {
        try {
            const originalPath = imageUrl.replace(`${publicURL}/`, "");

            const [buffer] = await bucket.file(originalPath).download();

            const thumbBuffer = await sharp(buffer)
                    .rotate()
                    .resize({
                        width: 200
                    })
                    .webp({
                        quality: 70
                    })
                    .toBuffer()


            const filename = originalPath.split("/").pop();
            console.log(filename);
            const now = new Date();

            const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, "0")}`;

            const thumbPath = `thumbs/${date}/${crypto.randomUUID()}-${filename}.webp`;

            await bucket.file(thumbPath).save(
                thumbBuffer,
                {
                    resumable: false,
                    contentType: "image/webp"
                }
            );

            return `${publicURL}/${thumbPath}`;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    
    /**
     * Uploads the desirable image to Google Storage. Automatically creates folders with date of upload for easier navigation and filetering.
     * @param img image file to upload to the Google Storage
     * @returns public URL to the stored image
     */
    async uploadPhoto(img: File): Promise<string> {
        const buffer = Buffer.from(await img.arrayBuffer());

        // Generate photo fodler name using current date
        const now = new Date();
        const date = `${now.getFullYear()}-${now.getMonth().toString().padStart(2, "0")}`;
        const filePath = `imgs/${date}/${img.name}`;

        const gcsFile = bucket.file(filePath);

        await gcsFile.save(buffer, {
            contentType: img.type,
            resumable: false
        });

        const returnURL = publicURL+`/${filePath}`;
        return returnURL;
    }

}


export const Gstorage = new GStorage();