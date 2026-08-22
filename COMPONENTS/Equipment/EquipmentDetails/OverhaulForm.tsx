import { Button, TextField } from "@mui/material"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react"
import toast from "react-hot-toast";

const OverhaulForm = ({
        equipmentId,
        onClose
    }: 
    {
        equipmentId: number,
        onClose: () => void
    }) => {
    const queryClient = useQueryClient();
    const [finishDate, setFinishDate] = useState(new Date().toISOString().slice(0, 10));
   

    const mutation = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/equipments/${equipmentId}/update-status`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: "overhaul",
                        endDate: finishDate
                    }),
                    credentials: "include"
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(`${data.error.message}. CODE: ${data.error.code}`)
                }

                return data;
            } catch (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipment-list"] });
            queryClient.invalidateQueries({ queryKey: ["equipment", equipmentId] });
            queryClient.invalidateQueries({ queryKey: ["/api/maintenance-events/info"] })
            toast.success("Overhaul initialised successfully!");
            onClose();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Unknown error";
            toast.error(msg);
            return;
        }
    });

  
  return (
    <div className="flex flex-col gap-8">
        <p>This action will update equipment status to Out of Service and add Overhaul maintenance event in the calendar. If you wish to continue, please specify the goal finish date of the overhaul below: (start date is automatically set to current date)</p>
        <div className="flex gap-4">
            <TextField
                label="Start Date"
                type="date"
                disabled
                fullWidth
                value={new Date().toISOString().slice(0, 10)}
                />
            <TextField
                label="Finish Date"
                type="date"
                fullWidth
                color="info"
                defaultValue={finishDate}
                onChange={e => {
                    setFinishDate(e.target.value);
                }}
            />
        </div>

        <div className="flex justify-end gap-4">
            <Button color="error" onClick={() => mutation.mutate()}>
                Submit
            </Button>
            <Button variant="outlined" color="inherit" onClick={onClose}>
                Cancel
            </Button>
        </div>
    </div>
  )
}

export default OverhaulForm;