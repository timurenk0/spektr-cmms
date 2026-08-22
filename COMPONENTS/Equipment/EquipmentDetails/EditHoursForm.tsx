import { Button, TextField } from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react"
import toast from "react-hot-toast";


const EditHoursForm = ({
    equipmentId,
    currentWorkingHours,
    onClose
}: {
    equipmentId: number,
    currentWorkingHours: number,
    onClose: () => void
}) => {
    const queryClient = useQueryClient();
    const [workingHours, setWorkingHours] = useState(currentWorkingHours);   


    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/equipments/${equipmentId}`, {
                method: "PATCH",
                body: JSON.stringify({ workingHours }),
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error.message);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId] });
            toast.success("Successfully updated equipment working hours", {
                icon: "✅"
            });
            onClose();
        },
        onError: (err) => {
            console.error(err);
            const msg = err instanceof Error ? err.message : "Unknown error";
            toast.error(msg, {
                icon: "❌"
            });
        }
    });

  return (
    <div className="flex flex-col gap-4">
        <TextField
            label="Working Hours"
            type="number"
            margin="dense"
            defaultValue={workingHours}
            slotProps={{
                htmlInput: {
                    min: 1,
                    max: 99999
                }
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const hours = Number(e.target.value);
                if (isNaN(hours)) {
                    throw new Error("Given value is not a number");
                }
                setWorkingHours(hours);
            }}
        />
        
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Updating..." : "Update"}</Button>
    </div>
  )
}

export default EditHoursForm