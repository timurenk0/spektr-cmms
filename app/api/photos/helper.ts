import { InsertPhoto, insertPhotoSchema, type Photo } from "@/BACKEND/Database/schema";
import { Gstorage } from "@/BACKEND/google-storage";
import { storage } from "@/BACKEND/storage";

export default async function uploadAndAddPhoto(
    file: File,
    photoData: Omit<InsertPhoto, "imageUrl">
): Promise<Photo> {
    let imageUrl: string | null = null;

    try {
        if (file.size > 1024 * 1024 * 5) throw new Error("File too big");
        
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
                    throw err;
                })
        }

        throw error;
    }
}