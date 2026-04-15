import { insertDocumentSchema, type Document } from "@/BACKEND/Database/schema";
import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";

export default async function uploadAndAddDocument(
    file: File,
    documentData: { equipmentId: number, title: string,  }
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