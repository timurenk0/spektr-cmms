"use client"

import z from "zod"
import { Controller, useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEquipmentSchema } from "@/BACKEND/Database/schema"

import toast from "react-hot-toast";
import Image from "next/image"
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button, FormControl, FormControlLabel, FormLabel, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField } from "@mui/material";
import { EquipmentTypes } from "../utils/equipmentTypes";
import { TEquipment, TTenant } from "../utils/types";
import { ImageIcon } from "lucide-react";


const formSchema = insertEquipmentSchema.extend({
    projectId: z.string().optional(),
    image: z.file().max(10_000_000).mime(["image/jpeg", "image/png"]).optional(),
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
    const [equipmentImage, setEquipmentImage] = useState("");
    const [localEquipmentImage, setLocalEquipmentImage] = useState("");
    const [eqLocation, setEqLocation] = useState("");

    const { data: tenants, isLoading: isLoadingTenants } = useQuery<TTenant[]>({
        queryKey: ["/api/tenants"]
    });

    // Fetch equipment for Equipment Update Form
    const { data: equipment, isLoading: isLoadingEquipment } = useQuery<TEquipment>({
        queryKey: [`equipment-update`],
        queryFn: async () => {
            const res = await fetch(`/api/equipments/${equipmentId}`);
            if (!res.ok) {
                throw new Error("Failed to fetch specified equipment data");
            }

            return await res.json();
        },
        enabled: !!equipmentId
    });

    const uploadImage = async (file: File | undefined) => {
        try {
            if (!file) throw new Error("No file selected");

            const formData = new FormData();
            formData.append("file", file);
            
            const response = await fetch("/api/photos?type=thumb", {
                method: "POST",
                body: formData 
            });

            const data = await response.json();
            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            };

            setEquipmentImage(data.equipmentImage);
            return data.equipmentImage;            
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to upload image: ${msg}`);
            return;
        }
    };


    const form = useForm<EquipmentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            tenantId: 1,
            manufacturer: "",
            assetId: "",
            serialNumber: "",
            model: "",
            type: "",
            category: "",
            dateOfManufacturing: format(new Date(), "yyyy-MM-dd"),
            inServiceDate: format(new Date(), "yyyy-MM-dd"),
            location: "",
            projectId: "",
            requirements: "",
            department: "",
            usefulLifeSpan: 180,
            totalWorkingHours: null,
            equipmentImage: "",
            notes: null
        }
    });

    // Watch type field for categorr dependancy
    const watchType = form.watch("type");

    // Populate form if equipment ID is passed (edit mode).
    useEffect(() => {
        if (equipment) {
            const equipmentLocation = equipment.location.split(/\s(.+)/);
            const {healthIndex, ...equipmentData} = equipment;
            const formData = {
                ...equipmentData,
                image: undefined,
                location: equipmentLocation[0],
                projectId: equipmentData.location === "Base" ? "" : equipmentLocation[1],
                notes: !equipmentData.notes ? null : equipmentData.notes
            }
            form.reset(formData);
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
            queryClient.invalidateQueries({ queryKey: ["equipment-update"] })
            queryClient.invalidateQueries({ queryKey: ["equipment-list"] });
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
    const onSubmit = async (values: EquipmentFormValues) => {

        
        const imageUrl = values.equipmentImage || await uploadImage(values.image);
        if (!imageUrl) return;
        const data = {
                ...values,
                location: (values.location === "Project" && form.getValues("projectId")) ? values.location + " " + form.getValues("projectId") : values.location,
                equipmentImage: imageUrl || values.equipmentImage,
                status: "operational"
            };
        mutation.mutate(data);
    }


    const isLoading = (isLoadingEquipment) || (!tenants || isLoadingTenants);
    if (isLoading) return (<h1>Loading data...</h1>)

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
            <Controller
                name="tenantId"
                control={form.control}
                defaultValue={1}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel id="select-tenant" color="info" required sx={{ margin: "8px 0" }}>Select Owner</InputLabel>
                        <Select labelId="select-tenant" label="Select Type" {...field} color="info" required sx={{ margin: "8px 0" }}>
                            {tenants.map(t => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
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
            <TextField
                label="Owning Department"
                color="info"
                margin="dense"
                fullWidth
                required
                {...form.register("department")}
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
                 {(eqLocation === "Project" || (equipment && equipment.location !== "Base")) && (
                    <TextField
                        label="Project ID"
                        color="info"
                        margin="dense"
                        fullWidth
                        {...form.register("projectId")}
                        required={eqLocation === "Project"}
                     />
                 )}
            </div>
            <Controller
                name="image"
                control={form.control}
                render={({ field }) => (
                    <TextField
                        type="file"
                        color="info"  
                        margin="dense"
                        fullWidth
                        required={!equipmentImage || equipmentImage.length<1}
                        slotProps={{
                            htmlInput: {
                                accept: ["image/jpeg", "image/png"],
                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (!file) throw new Error("No file selected")
                                    field.onChange(file);
                                    const reader = new FileReader();
                                    reader.readAsDataURL(file);
                                    
                                    reader.addEventListener("load", () => {setLocalEquipmentImage(String(reader.result))})
                                    
                                    console.log(file);
                                }
                            },
                            input: {
                                endAdornment: <InputAdornment position="start"><ImageIcon /></InputAdornment>
                            }
                        }}
                    />
                )}
            />
            {localEquipmentImage && (
                <div className="mt-2">
                    <p className="text-sm">Image preview:</p>
                    <Image src={localEquipmentImage} width={32} height={32} alt="equipment_image_preview" className="w-auto h-auto max-w-64 max-h-64 rounded-md mt-1" />
                </div>
            )}
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
                name="totalWorkingHours"
                control={form.control}
                defaultValue={null}
                render={({ field }) => (
                    <TextField
                        type="number"
                        label="Total Working Hours (if applicable)"
                        color="info"
                        margin="dense"
                        fullWidth
                        value={field.value ?? ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? null : Number(value))
                        }}
                    />
                )}
            />
             <Controller
                name="requirements"
                control={form.control}
                defaultValue=""
                render={({ field }) => (
                    <FormControl className="col-span-2" fullWidth required>
                        <FormLabel>
                            <div className="inline text-gray-500">Requirements</div>
                        </FormLabel>
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
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? "Saving..." : equipmentId ? "Update Equipment" : "Add Equipment"}
                </Button>
              </div>
        </div>
    </form>
  )
}