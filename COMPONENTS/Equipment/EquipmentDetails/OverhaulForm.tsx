import { Button, TextField } from "@mui/material"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { PickerValue } from "@mui/x-date-pickers/internals";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
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
        <p>This action will update equipment status to Out of Service, add Overhaul maintenance event in the calendar, and cancel current schedule. If you wish to continue, please specify the goal finish date of the overhaul below: (start date is automatically set to current date)</p>
        <div className="grid grid-cols-2 gap-4">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="Start Date"
                    value={new Date()}
                    minDate={new Date()}
                    format="dd/MM/yyyy"
                    disabled
                />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="Finish Date"
                    value={new Date(finishDate)}
                    minDate={new Date()}
                    format="dd/MM/yyyy"
                    onChange={(e: PickerValue) => {
                        console.log(e);
                        setFinishDate(e ? e.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
                    }}
                />
            </LocalizationProvider>
        </div>

        <div className="flex justify-end gap-4">
            <Button color="error" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                { mutation.isPending ? "Submitting..." : "Submit" }
            </Button>
            <Button variant="outlined" color="inherit" onClick={onClose}>
                Cancel
            </Button>
        </div>
    </div>
  )
}

export default OverhaulForm;