import { Button, TextField } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

const DeleteEquipmentForm = (
    { 
        equipmentId,
        equipmentName,
        onClose 
    }: { 
        equipmentId: number,
        equipmentName: string,
        onClose: ()=>void 
    }) => {
        const queryClient = useQueryClient();
        const [reason, setReason] = useState("");

        const deleteMutation = useMutation({
            mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
                try {
                    const response = await fetch(`/api/equipments/${id}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            reason
                        }),
                        credentials: "include"
                    });
    
                    const data = await response.json().catch(() => null);
    
                    if (!response.ok) {
                        const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
                        throw new Error(message);
                    }
    
                    return data;
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Unknown error";
                    throw new Error(message);
                }
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["/api/equipments"] });
                queryClient.invalidateQueries({ queryKey: ["/api/maintenances"] });
                queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
                toast.success("Equipment deleted successfully", {
                    duration: 2000,
                    position: "bottom-right",
                    icon: "✅"
                });
                onClose();
            },
            onError: (err) => {
                console.log(err.cause, err.stack)
                toast.error("Failed to delete equipment", {
                    duration: 2000,
                    position: "bottom-right",
                    icon: "❌"
                });
            }
        });

        const onSubmit = () => {
            deleteMutation.mutate({ id: equipmentId, reason })
        }
        
  return (
    <div>
        <p>Are you sure you want to delete the "{equipmentName}" equipment from the system? This action is <b>permanent</b>. If yes, input the reason of deletion:</p>
        <TextField
            color="info"
            label="Deletion reason"
            fullWidth
            margin='dense'
            defaultValue={reason}
            onChange={(e) => setReason(e.target.value)}
            required
        />
        <div className='flex justify-end gap-2'>
            <Button type="submit" onClick={onSubmit} variant='outlined' color='error' disabled={!reason || reason.length < 1}>Yes, fuck it</Button>
            <Button onClick={onClose} variant='text' color="inherit">No, get me back</Button>
        </div>
    </div>
  )
}

export default DeleteEquipmentForm