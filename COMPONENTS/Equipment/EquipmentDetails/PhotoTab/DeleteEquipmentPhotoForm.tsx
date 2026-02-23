import { Button } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const DeleteEquipmentPhotoForm = (
    {
        photoId,
        onClose
    }: {
        photoId: number,
        onClose: () => void
    }
) => {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async () => {
            try {
                const response = await fetch(`/api/photos/${photoId}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                const data = await response.json();
                if (!response.ok) {
                    const message = data.error || `Request failed: ${response.status} ${response.statusText}`
                    throw new Error(message);
                }

                return data;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                throw new Error(message);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
            queryClient.invalidateQueries({ queryKey: ["/api/photos", photoId] });
            toast.success("Photo deleted successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            onClose();
        },
        onError: (error) => {
            console.log(error);
            toast.error("Failed to delete photo", {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });

    const onSubmit = () => {
        deleteMutation.mutate();
    }

    return (
        <div>
            <p>Are you sure you want to delete the photo?</p>
            <div className="flex justify-end gap-2">
                <Button type="submit" onClick={onSubmit} variant="outlined" color="error" disabled={deleteMutation.isPending}>Yes, fuck it</Button>
                <Button onClick={onClose} variant="text" color="inherit">No, get me back</Button>
            </div>
        </div>
    )
}


export default DeleteEquipmentPhotoForm;