import { insertComponentSchema } from "@/BACKEND/Database/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextField } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";


const componentSchema = insertComponentSchema;
const formSchema = z.object({
    components: z.array(componentSchema).min(1)
});
type ComponentFormValues = z.infer<typeof formSchema>;

const AddEquipmentComponentForm = ({
    equipmentId,
    onClose
}: {
    equipmentId: number,
    onClose: () => void
}) => {
    const queryClient = useQueryClient();

    const form = useForm<ComponentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            components: [
                {
                    equipmentId,
                    name: "",
                    manufacturer: "",
                    partNumber: "",
                    notes: "",
                    stock: 1
                }
            ]
        }
    });


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "components"
    });

    const mutation = useMutation({
        mutationFn: async (values: ComponentFormValues) => {
            const url = values.components.length > 1 ? "/api/components/bulk" : "/api/components";
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(values.components),
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipment-components"] });
            toast.success("Components added", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error(`Failed to add components: ${error.message}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });

    const onSubmit = (values: ComponentFormValues) => {
        mutation.mutate(values);
    }

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
            className="space-y-4 max-h overflow-y-auto px-1"
        >
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-5 gap-2 py-2">
                    <Controller
                        name={`components.${index}.name`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                label="Name"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 255 }
                                }}
                                fullWidth
                                required
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name={`components.${index}.manufacturer`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                label="Manufacturer"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 255 }
                                }}
                                fullWidth
                                required
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name={`components.${index}.partNumber`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                label="Part Number"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 255 }
                                }}
                                fullWidth
                                required
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name={`components.${index}.stock`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                type="number"
                                slotProps={{ htmlInput: { min: 1, max: 9999 } }}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                label="Stock"
                                color="info"
                                margin="dense"
                                fullWidth
                                required
                            />
                        )}
                    />
                    <Controller
                        name={`components.${index}.notes`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                label="Notes"
                                color="info"
                                margin="dense"
                                slotProps={{
                                    htmlInput: { maxLength: 511 }
                                }}
                                fullWidth
                                {...field}
                            />
                        )}
                    />
                {fields.length > 1 && (
                    <Button type="button" variant="text" onClick={() => remove(index)} color="error" className="col-span-7">Remove Component</Button>
                )}
                </div> 
            ))}
            <Button
                type="button"
                variant="text"
                fullWidth
                sx={{ margin: "1rem 0" }}
                onClick={() => append({
                    equipmentId,
                    name: "",
                    manufacturer: "",
                    partNumber: "",
                    stock: 1,
                    notes: ""
                })}
            >
                <Plus /> Add another component
            </Button>


            <div className="flex justify-end gap-2">
                <Button variant="outlined" type="button" onClick={onClose} color="error">Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving" : form.getValues().components.length > 1 ? "Add Components" : "Add component"}</Button>
            </div>
        </form>
    )
};


export default AddEquipmentComponentForm;