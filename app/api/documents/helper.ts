import { insertDocumentSchema, type Document, type InsertDocument } from "@/BACKEND/Database/schema";
import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";

export default async function uploadAndAddDocument(
    file: File,
    documentData: Omit<Document, "fileUrl">
): Promise<Document | undefined> {
    let fileUrl: string | null = null;

    try {
       fileUrl = await Gstorage.uploadDocument(file); 

       const doc = insertDocumentSchema.parse({...documentData, fileUrl});

       const newDocument = await storage.addDocument(doc);

       return newDocument;
    } catch (error) {
        if (fileUrl) {
            await Gstorage.deleteObject(fileUrl)
                .then(()=>{
                    console.log("Fallback successfully deleted the file")
                })
                .catch(() => {
                    throw new Error(`Fallback delete failed: ${error}`)
                })
        }
    }
}