"use client"

import { insertMaintenanceSchema } from "@/BACKEND/Database/schema"
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod"


const formSchema = insertMaintenanceSchema.extend({
  levelAHours: z.number().min(0).optional(),
  levelADuration: z.number().min(0).optional(),
  levelBHours: z.number().min(0).optional(),
  levelBDuration: z.number().min(0).optional(),
  levelCHours: z.number().min(0).optional(),
  levelCDuration: z.number().min(0).optional(),
  levelDHours: z.number().min(0).optional(),
  levelDDuration: z.number().min(0).optional(),
  dailyWorkingHours: z.number().min(1).max(24),
  totalWorkingHours: z.number().min(1),
  givenHealthIndex: z.number().min(1).max(100),
  serviceStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  serviceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});
type MaintenanceFormValues = z.infer<typeof formSchema>;

const AddMaintenanceForm = ({
  maintenanceId,
  onClose
}: {
  maintenanceId: number,
  onClose: () => void
}) => {
  const queryClient = useQueryClient();
  
  /* ======================================DATA FETCHING=========================================== */

  const { data: equipments, isLoading: isLoadingEquipments } = useQuery<{equips: IEquipment[], totalCount: number}>({
    queryKey: ["/api/equipments?concise=true"]
  });
  
  const { data: maintenances, isLoading: isLoadingMaintenances } = useQuery<IMaintenance[]>({
    queryKey: ["/api/maintenances"]
  });
  
  const { data: maintenance, isLoading: isLoadingMaintenance } = useQuery<IMaintenance>({
    queryKey: [`/api/maintenances/${maintenanceId}`],
    enabled: !!maintenanceId
  })
  /* ============================================================================================== */


  /* =====================================FORM SUBMISSION========================================== */

  // Resolve form using schema and assign default values
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentId: undefined,
      dailyWorkingHours: 8,
      totalWorkingHours: 0,
      givenHealthIndex: 0,
      levelAHours: 0,
      levelADuration: 0,
      levelBHours: 0,
      levelBDuration: 0,
      levelCHours: 0,
      levelCDuration: 0,
      levelDHours: 0,
      levelDDuration: 0,
      serviceStartDate: format(new Date(), "yyyy-MM-dd"),
      serviceEndDate: format(new Date(), "yyyy-MM-dd")
    }
  });

  // Populate form if maintenance ID is passed (edit mode)
  useEffect(() => {
    if (maintenance) {
      form.reset({...maintenance});
    }
  }, [maintenance, form]);
  
  const mutation = useMutation({
    mutationFn: async (values: MaintenanceFormValues) => {
      const url = `/api/maintenances${maintenanceId ? `/${maintenanceId}` : ""}`;
      const method = maintenanceId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      
      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        const message = data.error || `Request failed: ${response.status} ${response.statusText}`
        throw new Error(message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast.success(`Maintenance record ${maintenanceId ? "updated" : "added"} successfully`, {
        duration: 2000,
        position: "bottom-right",
        icon: "✅"
      });
      form.reset();
      onClose();
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to ${maintenanceId ? "update" : "add"} maintenance record: ${msg}`, {
        duration: 2000,
        position: "bottom-right",
        icon: "❌"
      });
    }
  });
  
  const onSubmit = (values: MaintenanceFormValues) => {
    console.log(values);
    mutation.mutate(values);
  };
  /* ============================================================================================== */


  const isLoading = (isLoadingEquipments || !equipments) || (isLoadingMaintenances || !maintenances);
  if (isLoading) return "sosal?";

  const equipmentUnderMaintenance = maintenances.map(m => m.equipmentId);
  const availableEquipment = equipments.equips.filter(eq => !equipmentUnderMaintenance.includes(eq.id) && eq.status !== "Out Of Service");
  
  return (
    <form className="space-y-4 px-1" onSubmit={form.handleSubmit(onSubmit, (error) => console.log(error))}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="equipmentId"
          control={form.control}
          defaultValue={0}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="select-equipment" color="info" required sx={{ margin: "8px 0" }}>Select Equipment</InputLabel>
              <Select labelId="select-equipment" label="Select Equipment" {...field} color="info" required sx={{ margin: "8px 0" }}>
                {availableEquipment.map((eq: IEquipment) => (
                  <MenuItem key={eq.id} value={eq.id}>{eq.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
         />
         <Controller
          name="givenHealthIndex"
          control={form.control}
          defaultValue={0}
          render={({ field }) => (
            <TextField
               type="number"
               label="Given Health Index"
               color="info"
               margin="dense"
               slotProps={{ htmlInput: { min: 30, max: 100 } }}
               fullWidth
               required
               {...field}
               onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
         />
         <TextField
            type="date"
            label="Service Start Date"
            color="info"
            margin="dense"
            fullWidth
            required
            {...form.register("serviceStartDate")}
        />
         <TextField
            type="date"
            label="Service End Date"
            color="info"
            margin="dense"
            fullWidth
            required
            {...form.register("serviceEndDate")}
        />
        <Controller
          name="totalWorkingHours"
          control={form.control}
          defaultValue={0}
          render={({ field }) => (
            <TextField
                type="number"
                label="Total Working Hours"
                color="info"
                margin="dense"
                slotProps={{ htmlInput: { min: 0 } }}
                fullWidth
                required
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                />
          )}
         />
         <Controller
          name="dailyWorkingHours"
          control={form.control}
          defaultValue={1}
          render={({ field }) => (
            <TextField
               type="number"
               label="Daily Working Hours"
               color="info"
               margin="dense"
               slotProps={{ htmlInput: { min: 1, max: 24 } }}
               fullWidth
               required
               {...field}
               onChange={(e) => field.onChange(Number(e.target.value))}
               helperText="Approx. number of hours equipment works per day"
            />
          )}
         />
         <div className="border p-4 rounded-md bg-green-50 col-span-2">
          <h3 className="font-medium text-lg mb-3">Level A Maintenance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="levelAHours"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Working Hours Interval"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Interval between maintenance tasks in hours"
                />
              )}
            />
            <Controller
              name="levelADuration"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Duration (days)"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Expected maintenance duration in days"
                />
              )}
            />
          </div>
         </div>
         <div className="border p-4 rounded-md bg-amber-50 col-span-2">
          <h3 className="font-medium text-lg mb-3">Level B Maintenance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="levelBHours"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Working Hours Interval"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Interval between maintenance tasks in hours"
                />
              )}
            />
            <Controller
              name="levelBDuration"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Duration (days)"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Expected maintenance duration in days"
                />
              )}
            />
          </div>
         </div>
         <div className="border p-4 rounded-md bg-blue-50 col-span-2">
          <h3 className="font-medium text-lg mb-3">Level C Maintenance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="levelCHours"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Working Hours Interval"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Interval between maintenance tasks in hours"
                />
              )}
            />
            <Controller
              name="levelCDuration"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Duration (days)"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Expected maintenance duration in days"
                />
              )}
            />
          </div>
         </div>
         <div className="border p-4 rounded-md bg-purple-50 col-span-2">
          <h3 className="font-medium text-lg mb-3">Level D Maintenance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Controller
              name="levelDHours"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Working Hours Interval"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Interval between maintenance tasks in hours"
                />
              )}
            />
            <Controller
              name="levelDDuration"
              control={form.control}
              defaultValue={0}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Duration (days)"
                  color="info"
                  margin="dense"
                  slotProps={{ htmlInput: { min: 0 } }}
                  fullWidth
                  required
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  helperText="Expected maintenance duration in days"
                />
              )}
            />
          </div>
         </div>

         <div className="col-span-2 flex justify-end gap-x-2">
            <Button
              type="button"
              variant="outlined"
              color="error"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : maintenanceId ? "Update Maintenance" : "Save Maintenance"}
            </Button>
         </div>
      </div>
    </form>
  )
}

export default AddMaintenanceForm