"use client"


import { insertPhotoSchema } from '@/BACKEND/Database/schema'
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, InputAdornment, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileIcon, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import z from 'zod'


const formSchema = z.object({
    file: z.file().max(5_000_000).mime(["image/png", "image/jpeg"]),
});
type PhotoFormValues = z.infer<typeof formSchema>;


const AddEquipmentPhotoForm = ({ equipmentId, onClose }: { equipmentId: number, onClose: () => void }) => {
    const queryClient = useQueryClient();
    const [localEquipmentImage, setLocalEquipmentImage] = useState<string | null>(null);

    const form = useForm<PhotoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            file: undefined,
        }
    });
  
    const mutation = useMutation({
        mutationFn: async (values: PhotoFormValues) => {
            const file = values.file;

            if (!file) throw new Error("No file selected");

            if (file.size > 5_000_000) throw new Error("File should not exceed 5MB!");

            const urlRes = await fetch("/api/photos/upload-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                })
            });

            const urlData = await urlRes.json();
            if (!urlRes.ok) throw new Error(urlData.error || "Failed to generate upload URL");


            const gcsRes = await fetch(urlData.uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type
                },
                body: file
            });
            if (!gcsRes.ok) {
                console.error("GCS upload error:", await gcsRes.text());
                throw new Error("Failed to upload file to GCS");
            }

            const uploadRes = await fetch("/api/photos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    equipmentId,
                    fileUrl: urlData.fileUrl
                })
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload document");

            return uploadData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["photos", equipmentId] });
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
        mutation.mutate(values);
    }
    
  return (
    <form
        onSubmit={form.handleSubmit(onSubmit, (error) => console.error(error))}
        className='space-y-4 px-1'
    >
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
                            accept: ["image/png", "image/jpeg"],
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0];
                                if (!file) throw new Error("No file selected");

                                if (file.size > 1024*1024*5) {
                                    toast.error("Image size should not exceed 5MB!");
                                    return;
                                }
                                
                                field.onChange(file);
                                console.log(file);

                                const reader = new FileReader();
                                reader.readAsDataURL(file);

                                reader.addEventListener("load", () => setLocalEquipmentImage(String(reader.result)))
                            },
                        },
                        input: {
                            endAdornment: <InputAdornment position='start'><ImageIcon /></InputAdornment>
                        }
                    }}
                />
            )}
        />
        {localEquipmentImage && (
            <div className="mt-2">
                <p className="text-sm">Image preview:</p>
                <Image unoptimized src={localEquipmentImage} width={32} height={32} alt="equipment_image_preview" className="w-auto h-auto max-w-64 max-h-64 rounded-md mt-1" />
            </div>
        )}
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
                disabled={mutation.isPending}
            >
                {mutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
        </div>
    </form>
  )
}

export default AddEquipmentPhotoForm