import { Button } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const DeleteEquipmentComponentForm = ({
    componentId,
    componentName,
    onClose
}: {
    componentId: number,
    componentName: string,
    onClose: () => void
}) => {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async () => {
            try {
                const response = await fetch(`/api/components/${componentId}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                const data = await response.json();
                if (!response.ok) {
                    const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                    throw new Error(message);
                }

                return data;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Unknown error";
                throw new Error(message);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/components"] });
            toast.success("Critical component deleted successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "🗑️"
            });
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to delete critical component", {
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
            <p>Are you sure you want to delete &quot;{componentName}&quot;?</p>
            <div className="flex justify-end gap-2">
                <Button type="submit" onClick={onSubmit} variant="outlined" color="error" disabled={deleteMutation.isPending}>Delete</Button>
                <Button onClick={onClose} variant="text" color="inherit">Cancel</Button>
            </div>
        </div>
    )
};


export default DeleteEquipmentComponentForm;