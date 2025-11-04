"use client"


import { insertPhotoSchema } from '@/BACKEND/Database/schema'
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, InputAdornment, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileIcon } from 'lucide-react';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import z from 'zod'


const formSchema = insertPhotoSchema.extend({
    equipmentId: z.number(),
    title: z.string().min(1, { error: "Photo title required" }),
    imageUrl: z.string().min(1, { error: "Photo URL required" }),
    notes: z.string().optional()
});
type PhotoFormValues = z.infer<typeof formSchema>;


const EquipmentPhotoForm = ({ equipmentId, onClose }: { equipmentId: number, onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<PhotoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            imageUrl: "",
            notes: ""
        }
    });
  
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

            form.setValue("equipmentId", equipmentId);
            return data.url;
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to upload image: ${msg}`);
            return;
        }
    };

    const uploadMutation = useMutation({
        mutationFn: async (values: PhotoFormValues) => {
            const response = await fetch("/api/photos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(values)
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(message);
            };


            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
            queryClient.invalidateQueries({ queryKey: [`/api/equipments/${equipmentId}`] });
            toast.success("Photo uploaded successfully", {
                duration: 2000,
                position: "bottom-right",
                icon: "✅"
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            console.error(error.stack, error.cause);
            toast.error(`Failed to upload photo: ${error.message}`, {
                duration: 2000,
                position: "bottom-right",
                icon: "❌"
            });
        }
    });
    
    const onSubmit = (values: PhotoFormValues) => {
        const data = {
            ...values,
        }
        uploadMutation.mutate(data);
    }
    
  return (
    <form
        onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
        className='space-y-4 px-1'
    >
        <TextField
            type='file'
            slotProps={{
                htmlInput: {
                    accept: "image/png,image/jpeg,image/jpg,image/gif"
                },
                input: {
                    endAdornment: <InputAdornment position='start'><FileIcon /></InputAdornment>
                }
            }}
            color='info'
            margin='dense'
            fullWidth
            required
            onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                setIsUploading(true);
                try {
                    toast.promise(uploadImage(file).then((photoUrl) => {
                        form.setValue("imageUrl", photoUrl);
                        form.setValue("title", file.name);
                    }).catch((error) => {
                        const msg = error instanceof Error ? error.message : "Unknown error";
                        throw new Error(`Failed to uplaod image: ${msg}`);
                    }), {
                        loading: "Uploading image",
                        success: <b>Image uploaded!</b>,
                        error: <b>Failed to upload ;(</b>
                    })
                } catch (error) {
                    return ;
                } finally {
                    setIsUploading(false);
                }
            }}
        />
        <TextField
            label="Notes"
            color='info'
            margin='dense'
            fullWidth
            multiline
            rows={4}
            {...form.register("notes")}
        />
        <div className="mt-6 flex justify-end gap-4">
            <Button
                type='button'
                variant='outlined'
                color='error'
                onClick={onClose}
            >
                Cancel
            </Button>
            <Button
                type='submit'
                disabled={uploadMutation.isPending || isUploading}
            >
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
        </div>
    </form>
  )
}

export default EquipmentPhotoForm