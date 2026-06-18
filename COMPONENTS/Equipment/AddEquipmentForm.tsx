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
import { Button, FormControl, FormControlLabel, FormLabel, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, Skeleton, TextField } from "@mui/material";
import { EquipmentCategories } from "../utils/equipmentCategories";
import { CustomError, TEquipment, TTenant } from "../utils/types";
import { ImageIcon } from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { PickerValue } from "@mui/x-date-pickers/internals";


const formSchema = insertEquipmentSchema.extend({
    projectId: z.string().optional(),
    image: z.file().max(10_000_000).mime(["image/jpeg", "image/png"]).optional(),
});
type EquipmentFormValues = z.infer<typeof formSchema>;

const equipmentLocations = ["Base", "Project"];
const equipmentRequirements = ["Calibration and/or Testing", "Maintenance", "Both"]


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
    const [DOF, setDOF] = useState(new Date());
    const [requirements, setRequirements] = useState("");

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

            const data = await res.json();

            setDOF(data.dateOfManufacturing);

            return data;
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

    // Watch category field for type dependancy
    const watchCategory = form.watch("category");

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

    // Change type when category is selected
    useEffect(() => {
        if (watchCategory) {
        const currentCategory = form.getValues("category");
        const validTypes = EquipmentCategories.find(c => c.id === watchCategory)?.types || [];

        if (!validTypes.includes(currentCategory)) {
            form.setValue("type", validTypes[0]);
        }
        }
    }, [watchCategory, form]);

    const mutation = useMutation({
        mutationFn: async (values: EquipmentFormValues) => {
            
            if (values.image && values.image.size > 1024*1024*5) {
                throw new Error("Image size should exceeds 5MB! Choose another image");
            }
            
            const imageUrl = localEquipmentImage ? await uploadImage(values.image) : equipment?.equipmentImage;
            if (!imageUrl) throw new Error("Failed to upload image");
            
            const url = `/api/equipments${equipmentId ? `/${equipmentId}` : ""}`;
            const method = equipmentId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    ...values,
                    equipmentImage: imageUrl || values.equipmentImage
                })
            });

            const data = await response.json().catch(() => null);
            console.log(data.error);

            if (!response.ok) {
                const message = data.error.message;
                const suggest = data.error.suggestion;
                const res = message+" "+suggest || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(res);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipment-update"] })
            queryClient.invalidateQueries({ queryKey: ["equipment-list"] });
            queryClient.invalidateQueries({ queryKey: ["/api/equipments?concise=true"] });
            toast.success(`Equipment ${equipmentId ? "updated" : "added"} successfully`, {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            // toast.error(`Failed to ${equipmentId ? "update" : "add"} equipment: ${error.message}`, {
            //     duration: 2000,
            //     position: "bottom-right",
            //     icon: "❌"
            // });
            // console.error(error.code);
            toast.error(`Failed to add equipment: ${error.message}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });

    // Removed usefulLifeSpan: values.usefulLifeSpan (no bugs for now but if shit happens look HERE)
    const onSubmit = async (values: EquipmentFormValues) => {

        
        // const imageUrl = values.equipmentImage || await uploadImage(values.image);
        // if (!imageUrl) return;
        const data = {
                ...values,
                location: (values.location === "Project" && form.getValues("projectId")) ? values.location + " " + form.getValues("projectId") : values.location,
                // equipmentImage: imageUrl || values.equipmentImage,
                status: "operational"
            };
        mutation.mutate(data);
    }


    const isLoading = (isLoadingEquipment) || (!tenants || isLoadingTenants);
    if (isLoading) return (
        <>
            Loading data<span className="dots"></span>
        </>
    )

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
                slotProps={{
                    htmlInput: { maxLength: 255 }
                }}
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
                        <Select labelId="select-tenant" label="Select Owner" {...field} color="info" required sx={{ margin: "8px 0" }}>
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
                slotProps={{
                    htmlInput: { maxLength: 255 }
                }}
                margin="dense"
                fullWidth
                required
                {...form.register("manufacturer")}
            />
            <TextField
                label="Model"
                color="info"
                slotProps={{
                    htmlInput: { maxLength: 255 }
                }}
                margin="dense"
                fullWidth
                required
                {...form.register("model")}
            />
            <TextField
                label="Serial Number"
                color="info"
                slotProps={{
                    htmlInput: { maxLength: 255 }
                }}
                margin="dense"
                fullWidth
                required
                {...form.register("serialNumber")}
            />
            <TextField
                label="Asset ID"
                color="info"
                slotProps={{
                    htmlInput: { maxLength: 255 }
                }}
                margin="dense"
                fullWidth
                required
                {...form.register("assetId")}
            />
            <TextField
                label="Owning Department"
                color="info"
                slotProps={{
                    htmlInput: { maxLength: 255 }
                }}
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
                        slotProps={{ htmlInput: { min: 1, max: 600 } }}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                )}
            />
            <Controller
                name="category"
                control={form.control}
                defaultValue=""
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel id="select-category" color="info" required sx={{ margin: "8px 0" }}>Select Category</InputLabel>
                        <Select labelId="select-category" label="Select Category" {...field} color="info" required sx={{ margin: "8px 0" }}>
                            {EquipmentCategories.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.id}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            />
            <Controller
                name="type"
                control={form.control}
                defaultValue=""
                disabled={!watchCategory}
                render={({ field }) => (
                    <FormControl fullWidth>
                        <InputLabel id="select-type" color="info" required sx={{ margin: "8px 0" }} disabled={!watchCategory}>Select Type</InputLabel>
                        <Select labelId="select-type" label="Select Type" {...field} color="info" required sx={{ margin: "8px 0" }}>
                            {watchCategory && EquipmentCategories.find(c => c.id === watchCategory)
                                ?.types.map(t => (
                                    <MenuItem key={t} value={t} defaultValue={t}>{t}</MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                )}
            />
            <Controller
                name="dateOfManufacturing"
                control={form.control}
                render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Date of Manufacturing"
                            defaultValue={DOF}
                            minDate={new Date(DOF.getTime() - (1000 * 86400 * 365 * 30))}
                            maxDate={new Date()}
                            format="dd/MM/yyyy"
                            onChange={(e: PickerValue) => {
                                setDOF(e!);
                                field.onChange(e?.toISOString().slice(0, 10));
                            }}
                        />
                    </LocalizationProvider>
                )}
            />
            <Controller
                name="inServiceDate"
                control={form.control}
                render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="In Service Date"
                            defaultValue={new Date()}
                            minDate={DOF}
                            maxDate={new Date()}
                            format="dd/MM/yyyy"
                            onChange={(e: PickerValue) => field.onChange(e?.toISOString().slice(0, 10))}
                        />
                    </LocalizationProvider>
                )}
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
                        slotProps={{
                            htmlInput: { maxLength: 247 }
                        }}
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
                                    if (!file) throw new Error("No file selected");
                                    
                                    if (file.size > 1024*1024*5) {
                                        toast.error("Equipment thumbnail image size should not exceed 5MB!", {
                                            icon: "⚠️",
                                            position: "top-center"
                                        });
                                        e.target.value = "";
                                        setLocalEquipmentImage("");
                                        return;
                                    }
                                        
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
                slotProps={{
                    htmlInput: { maxLength: 511 }
                }}
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
                    <FormControl fullWidth required>
                        <FormLabel>
                            <div className="inline text-gray-500">Requirements</div>
                        </FormLabel>
                        <RadioGroup {...field} onChange={(e) => {
                            field.onChange(e);
                            setRequirements(e.target.value);
                        }}>
                            {equipmentRequirements.map(req => (
                                <FormControlLabel key={req} value={req.toLowerCase()} control={<Radio />} label={req} />
                            ))}
                        </RadioGroup>
                    </FormControl>
                )}
              />
              { (requirements && requirements !== "calibration and/or testing") && (
                <Controller
                    name="totalWorkingHours"
                    control={form.control}
                    defaultValue={null}
                    render={({ field }) => (
                        <TextField
                            type="number"
                            label="Total Working Hours"
                            color="info"
                            slotProps={{
                                htmlInput: { min: 0, max: 99999 },
                            }}
                            margin="dense"
                            fullWidth
                            required
                            value={field.value ?? ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? null : Number(value))
                            }}
                        />
                    )}
                />
              ) }
              

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