"use client"

import { insertDocumentSchema } from '@/BACKEND/Database/schema';
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { FileIcon } from 'lucide-react';
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast';
import z from 'zod';


const formSchema = z.object({
  file: z.file().max(10_000_000).mime(["application/pdf"]),
  title: z.string().min(1, { error: "Document title required" }),
  category: z.string().min(1, { error: "Document category required" }),
  notes: z.string().optional()
});
type DocumentFormValues = z.infer<typeof formSchema>;

const documentCategories: Record<string, string> = {
    "Manuals": "manual",
    "Maintenance Reports": "maintenance",
    "Certificates": "certificate",
    "Pre-mob Reports": "premob",
    "Fault Reports": "fault",
    "Emergency Repair Reports": "emergency",
    "Other": "other"
}


const EquipmentDocumentsForm = ({ equipmentId, onClose }: { equipmentId: number, onClose: () => void }) => {
    const queryClient = useQueryClient();

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            file: undefined,
            title: "",
            category: "",
            notes: ""
        }
    });

    
    const uploadMutation = useMutation({
        mutationFn: async (values: DocumentFormValues) => {
            const formData = new FormData();

            if (values.file && values.file.size > 1024*1024*10) throw new Error("File size should not exceed 10MB!")
            
            formData.append("file", values.file);
            formData.append("equipmentId", equipmentId.toString());
            formData.append("title", values.title);
            formData.append("category", values.category);
            formData.append("notes", values.notes ?? "");
            
            const response = await fetch("/api/documents", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents", equipmentId] })
            toast.success("Document uploaded successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            form.reset();
            onClose();
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to upload document: ${msg}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });

    const onSubmit = (values: DocumentFormValues) => {
        uploadMutation.mutate(values);
    }
    
  return (
    <form
        onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
        className="space-y-4 px-1"
    >
        <TextField
            label="Document Title"
            color="info"
            margin="dense"
            slotProps={{
                htmlInput: { maxLength: 255 }
            }}
            fullWidth
            required
            {...form.register("title")}
        />
        <Controller
            name='file'
            control={form.control}
            render={({ field }) => (
                <TextField
                    type="file"
                    color="info"
                    margin="dense"
                    fullWidth
                    required
                    slotProps={{
                        htmlInput: {
                            accept: "application/pdf",
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                e.preventDefault();
                                const file = e.target.files?.[0];
                                if (!file) {
                                    toast.error("No file found!");
                                    return
                                }

                                if (file.size > 1024*1024*10) {
                                    toast.error("File should not exceed 10MB!");
                                }
                                
                                field.onChange(file);
                                console.log(file);
                            },
                        },
                        input: {
                            endAdornment: <InputAdornment position='start'><FileIcon /></InputAdornment>
                        }
                    }}
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
                        {Object.keys(documentCategories).map(cat => (
                            <MenuItem key={cat} value={documentCategories[cat]}>{cat}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        />
        <TextField
            label="Notes"
            color="info"
            margin="dense"
            slotProps={{
                htmlInput: { maxLength: 511 }
            }}
            fullWidth
            multiline
            rows={4}
            {...form.register("notes")}
        />
        <div className="mt-6 flex justify-end gap-4">
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
                disabled={uploadMutation.isPending}
            >
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
        </div>
    </form>
  )
}

export default EquipmentDocumentsForm