import { Button } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast";

const EmeregencyForm = ({
    equipmentId,
    onClose
}: {
    equipmentId: number,
    onClose: () => void
}) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/equipments/${equipmentId}/update-status`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: "emergency"
                    }),
                    credentials: "include"
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(`${data.error.message}. ${data.error.suggestion || data.error.code}`);
                }

                return data;
            } catch (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId] });
            queryClient.invalidateQueries({ queryKey: ["equipments"] })
            queryClient.invalidateQueries({ queryKey: ["/api/maintenance-events/info"] });

            toast.success("Emergency repair started!");
            onClose();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Unknown error";
            toast.error(msg);
            console.error(err);
            return;
        }
    })

    return (
        <div className="flex flex-col gap-8">
            <p>This action will update equipment status to Under Repair and add Emeregency Repair maintenance evnet to the calendar (start date of the event is automaticalle set to current date)</p>
            <div className="flex justify-end gap-4">
                <Button color="error" onClick={() => mutation.mutate()}>Submit</Button>
                <Button variant="outlined" color="inherit" onClick={onClose}>Cancel</Button>
            </div>
        </div>
    )
}

export default EmeregencyForm;