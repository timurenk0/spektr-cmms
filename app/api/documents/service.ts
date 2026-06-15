import { Document, insertDocumentSchema } from "@/BACKEND/Database/schema";
import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";
import { CustomApiError, ERROR_CODES } from "@/BACKEND/Utils/errorBuilder";


type AddDocument = {
    file: File,
    equipmentId: number,
    title: string,
    category: "manual" | "maintenance" | "certificate" | "premob" | "fault" | "emergency" | "inspection" | "other",
    notes?: string
}

class DocumentsService {
    async getDocumentsForEquipment(equipmentId: number): Promise<Document[]> {
        return await storage.getDocuments(equipmentId);
    }

    async addDocument({ file, equipmentId, title, category, notes }: AddDocument): Promise<Document> {
        let fileUrl: string | null = null;

        try {
            if (file.size > 1024 * 1024 * 10) throw new Error("File too big");
            if (file.type !== "application/pdf") throw new Error("Invalid file type");
            
            fileUrl = await Gstorage.uploadDocument(file);

            const doc = insertDocumentSchema.parse({
                equipmentId,
                title,
                category,
                fileUrl,
                notes
            });

            console.log(doc);

            const newDocument = await storage.addDocument(doc);
            if (!newDocument) throw new CustomApiError({
                code: ERROR_CODES.SERVER_ERROR,
                message: "Failed to upload document",
                suggestion: "Try again later",
                status: 500
            });
            
            return newDocument;
        } catch (error) {
            if (fileUrl) {
                try {
                    await Gstorage.deleteObject(fileUrl);
                } catch (rollbackError) {
                    console.error(`Rollback failed: ${rollbackError}`);
                }
            }     
            throw error;
        }
    }

    async deleteDocument(documentId: number): Promise<Document> {
        try {
            const deletedDocument = await storage.deleteDocument(documentId);
            if (!deletedDocument) throw new Error("Failed to delete document");

            await Gstorage.deleteObject(deletedDocument.fileUrl);
            return deletedDocument;
        } catch (error) {
            throw error;
        }
    }
}

export const documentsService = new DocumentsService();