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


const formSchema = insertDocumentSchema.extend({
  equipmentId: z.number(),
  title: z.string().min(1, { error: "Document title required" }),
  fileUrl: z.string().min(1, { error: "Document URL required" }),
  fileName: z.string().min(1, { error: "Filename required" }),
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

    const [isUploading, setIsUploading] = useState(false);
    
    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            fileUrl: "",
            fileName: "",
            category: "",
            notes: ""
        }
    });

    
    const uploadDocument = async (file: File) => {
        if (!file) throw new Error("No file selected!");
        
        const buffer = await file.arrayBuffer();
        
        const response = await fetch("/api/upload/document", {
            method: "POST",
            headers: {
                "Content-Type": "application/pdf",
                "X-Filename": file.name
                },
                body: buffer,
        });
            
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
            throw new Error(message); 
        }
        
            
        form.setValue("fileUrl", data);
        form.setValue("fileName", file.name);
        form.setValue("equipmentId", equipmentId);

        return data; 
    }

    const uploadMutation = useMutation({
        mutationFn: async (values: DocumentFormValues) => {
            const response = await fetch("/api/documents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
            queryClient.invalidateQueries({ queryKey: [`/api/equipments/${equipmentId}`] });
            toast.success("Document uploaded successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            console.error(error.stack, error.cause);
            toast.error(`Failed to upload document: ${error.message}`, {
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
            fullWidth
            required
            {...form.register("title")}
        />
        <TextField
            type="file"
            slotProps={{
                htmlInput: {
                    accept: "application/pdf"
                },
                input: {
                    endAdornment: <InputAdornment position='start'><FileIcon /></InputAdornment>
                }
            }}
            color="info"
            margin="dense"
            fullWidth
            required
            onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];

                if (!file) return;
                
                setIsUploading(true);
                if (file) {
                    try {
                        toast.promise(uploadDocument(file).then((docUrl) => {
                            form.setValue("fileUrl", docUrl);
                        }).catch((error) => {
                            const msg = error instanceof Error ? error.message : "Unknown error";
                            throw new Error(`Failed to upload document: ${msg}`);
                        }), {
                            loading: "Uploading document",
                            success: <b>Document uploaded!</b>,
                            error: <b>Failed to upload ;(</b>
                        })
                    } catch (error) {
                        return ;
                    } finally {
                        setIsUploading(false);
                    }
                    }
                }
            }
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
                disabled={uploadMutation.isPending || isUploading}
            >
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
        </div>
    </form>
  )
}

export default EquipmentDocumentsForm