import { InsertPhoto, insertPhotoSchema, type Photo } from "@/BACKEND/Database/schema";
import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";

export default async function uploadAndAddPhoto(
    file: File,
    photoData: Omit<InsertPhoto, "imageUrl">
): Promise<Photo | undefined> {
    let imageUrl: string | null = null;

    try {
        imageUrl = await Gstorage.uploadPhoto(file);

        const photo = insertPhotoSchema.parse({...photoData, imageUrl});
        const newPhoto = await storage.addPhoto(photo);
        console.log(newPhoto);

        return newPhoto;
    } catch (error) {
        if (imageUrl) {
            await Gstorage.deleteObject(imageUrl)
                .then(() => {
                    return true; 
                })
                .catch((err) => {
                    throw new Error(`Fallback delete failed: ${err}`);
                })
        }

        throw error;
    }
}