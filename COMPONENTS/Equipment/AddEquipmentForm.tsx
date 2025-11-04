"use client"

import z from "zod"
import { Controller, useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEquipmentSchema } from "@/BACKEND/Database/schema"

import toast from "react-hot-toast";
import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button, FormControl, FormControlLabel, FormLabel, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField } from "@mui/material";
import { EquipmentTypes } from "../utils/equipmentTypes";


const formSchema = insertEquipmentSchema.extend({
    name: z.string().min(1, { error: "Equipment name is required" }).transform((val) => val.trim()),
    manufacturer: z.string().min(1, { error: "Equipment manufacturer is required" }).transform((val) => val.trim()),
    model: z.string().min(1, { error: "Equipment model is required" }).transform((val) => val.trim()),
    assetId: z.string().min(1, { error: "Equipment asset ID is required" }).transform((val) => val.trim()),
    serialNumber: z.string().min(1, { error: "Equipment serial number is required" }).transform((val) => val.trim()),
    type: z.string().min(1, { error: "Equipment type is required" }).transform((val) => val.trim()),
    category: z.string().min(1, { error: "Equipment category is required" }).transform((val) => val.trim()),
    dateOfManufacturing: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    inServiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    location: z.string().min(1, { error: "Location is required" }),
    department: z.string().min(1, { error: "Department is required" }).transform((val) => val.trim()),
    requirements: z.string().min(1, { error: "Equipment requirements are required." }),
    usefulLifeSpan: z.number().min(1),
    equipmentImage: z.string().transform((val) => val.trim()),
    notes: z.string().transform((val) => val.trim()).optional(),
});
type EquipmentFormValues = z.infer<typeof formSchema>;

const equipmentLocations = ["Base", "Project"];
const equipmentRequirements = ["Calibration & Testing", "Maintenance", "Both"]


export default function AddEquipmentForm(
    {
        equipmentId,
        onClose,
    }:
    {
        equipmentId?: number,
        onClose: () => void,
    }
) {
    const queryClient = useQueryClient();
    const [equipmentImage, setEquipmentImage] = useState<string>();
    const [eqLocation, setEqLocation] = useState<string>();
    const [projectId, setProjectId] = useState<string | null>();

    const uploadImage = async (file: File) => {
        try {
            if (!file) throw new Error("No file selected");
            
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/upload/image", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            };

            setEquipmentImage(data.url);
            return data.url;            
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to upload image: ${msg}`);
            return;
        }
    };

    const { data: equipment, isLoading: isLoadingEquipment } = useQuery<IEquipment>({
        queryKey: [`/api/equipments/${equipmentId}`],
        enabled: !!equipmentId
    });

    const form = useForm<EquipmentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            manufacturer: "",
            assetId: "",
            serialNumber: "",
            model: "",
            type: "",
            category: "",
            dateOfManufacturing: format(new Date(), "yyyy-MM-dd"),
            inServiceDate: format(new Date(), "yyyy-MM-dd"),
            location: "",
            requirements: "",
            department: "",
            usefulLifeSpan: 180,
            equipmentImage: "",
            notes: ""
        }
    });

    // Watch type field for categorr dependancy
    const watchType = form.watch("type");

    // Populate form if equipment ID is passed (edit mode).
    useEffect(() => {
        if (equipment) {
            form.reset({...equipment});
            setEquipmentImage(equipment.equipmentImage);
        }
    }, [equipment, form]);

    // Change category when type is selected
    useEffect(() => {
        if (watchType) {
        const currentCategory = form.getValues("category");
        const validCategories = EquipmentTypes.find(type => type.id === watchType)?.categories || [];

        if (!validCategories.includes(currentCategory)) {
            form.setValue("category", validCategories[0]);
        }
        }
    }, [watchType, form]);

    
    const mutation = useMutation({
        mutationFn: async (values: EquipmentFormValues) => {
            console.log(values);
            const url = `/api/equipments${equipmentId ? `/${equipmentId}` : ""}`;
            const method = equipmentId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(values)
            });

            const data = await response.json().catch(() => null);
            console.log(data.error);

            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/equipments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
            toast.success(`Equipment ${equipmentId ? "updated" : "added"} successfully`, {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast.error(`Failed to ${equipmentId ? "update" : "add"} equipment: ${error.message}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });

    // Removed usefulLifeSpan: values.usefulLifeSpan (no bugs for now but if shit happens look HERE)
    const onSubmit = (values: EquipmentFormValues) => {
        const data = {
                ...values,
                location: (values.location === "Project" && projectId) ? values.location + " " + projectId : values.location,
                equipmentImage: equipmentImage || values.equipmentImage,
                status: "operational"
            };

        mutation.mutate(data);
    }

    if (isLoadingEquipment) return (<h1>Loading equipment info...</h1>);

  return (
    <form
        onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
        className="space-y-4 px-1" 
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
                label="Equipment name"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("name")}
            />
            <TextField
                label="Manufacturer"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("manufacturer")}
            />
            <TextField
                label="Model"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("model")}
            />
            <TextField
                label="Serial Number"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("serialNumber")}
            />
            <TextField
                label="Asset ID"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("assetId")}
            />
            <Controller
                name="usefulLifeSpan"
                control={form.control}
                defaultValue={1}
                render={({ field }) => (
                    <TextField
                        type="number"
                        label="Useful Life Span (months)"
                        color="info"
                        margin="dense"
                        fullWidth
                        required
                        slotProps={{ htmlInput: { min: 1 } }}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                )}
            />
            <Controller
                name="type"
                control={form.control}
                defaultValue=""
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel id="select-type" color="info" required sx={{ margin: "8px 0" }}>Select Type</InputLabel>
                        <Select labelId="select-type" label="Select Type" {...field} color="info" required sx={{ margin: "8px 0" }}>
                            {EquipmentTypes.map(type => (
                                <MenuItem key={type.id} value={type.id}>{type.id}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            />
            <Controller
                name="category"
                control={form.control}
                defaultValue=""
                disabled={!watchType}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel id="select-category" color="info" required sx={{ margin: "8px 0" }} disabled={!watchType}>Select Category</InputLabel>
                        <Select labelId="select-category" label="Select Category" {...field} color="info" required sx={{ margin: "8px 0" }}>
                            {watchType && EquipmentTypes.find(type => type.id === watchType)
                                ?.categories.map(cat => (
                                    <MenuItem key={cat} value={cat} defaultValue={cat}>{cat}</MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                )}
            />
            <TextField
                type="date"
                label="Date of Manufacturing"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("dateOfManufacturing")}
            />
            <TextField
                type="date"
                label="In Service Date"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("inServiceDate")}
            />
            <TextField
                label="Owning Department"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("department")}
            />
            <div>
                <Controller
                    name="location"
                    control={form.control}
                    defaultValue=""
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel id="select-location" color="info" required sx={{ margin: "8px 0" }}>Select Location</InputLabel>
                            <Select labelId="select-location" label="Select Location" {...field} color="info" required sx={{ margin: "8px 0" }} onChange={(e) => {field.onChange(e); setEqLocation(e.target.value)}}>
                                {equipmentLocations.map(loc => (
                                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    )}
                 />
                 {eqLocation === "Project" && (
                    <TextField
                        label="Project ID"
                        color="info"
                        margin="dense"
                        fullWidth
                        required={eqLocation === "Project"}
                        onChange={(e) => setProjectId(e.target.value)}
                     />
                 )}
            </div>
            <TextField
                type="file"
                slotProps={{ 
                    htmlInput: { 
                        accept: "image/*" 
                    },
                    input: { 
                        endAdornment: <InputAdornment position="start"><ImageIcon /></InputAdornment>
                    }
                 }}
                color="info"
                fullWidth
                className="col-span-2"
                required={!equipmentId}
                onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];

                    if (file) {
                        toast.promise(uploadImage(file)
                            .then((imageUrl) => {
                                console.log(imageUrl);
                                form.setValue("equipmentImage", imageUrl);
                            }).catch((error) => {
                                const msg = error instanceof Error ? error.message : "Unknown error";
                                throw new Error(`Failed to upload photo: ${msg}`);
                            }), {
                            loading: "Uploading photo",
                            success: <b>Photo uploaded!</b>,
                            error: <b>Failed to upload ;(</b>
                        })
                    }
                }}
            />
            {/* {equipmentImage && (
                <div className="mt-2">
                    <p className="text-sm">Image preview:</p>
                    <Image src={equipmentImage} width={32} height={32} alt="equipment_image_preview" className="w-32 h-32 object-cover rounded-md mt-1" />
                </div>
            )} */}
            <TextField
                label="Notes"
                color="info"
                margin="dense"
                className="col-span-2"
                fullWidth
                multiline
                rows={4}
                {...form.register("notes")}
             />
             <Controller
                name="requirements"
                control={form.control}
                defaultValue=""
                render={({ field }) => (
                    <FormControl className="col-span-2" fullWidth required>
                        <FormLabel color="a">Requirements</FormLabel>
                        <RadioGroup {...field}>
                            {equipmentRequirements.map(req => (
                                <FormControlLabel key={req} value={req.toLowerCase()} control={<Radio />} label={req} />
                            ))}
                        </RadioGroup>
                    </FormControl>
                )}
              />

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
                    disabled={mutation.isPending || (!equipmentId && !equipmentImage)}
                >
                    {mutation.isPending ? "Saving..." : equipmentId ? "Update Equipment" : "Add Equipment"}
                </Button>
              </div>
        </div>
    </form>
  )
}