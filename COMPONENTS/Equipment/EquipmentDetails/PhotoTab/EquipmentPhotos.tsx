"use client"

import SlideDialog from '@/COMPONENTS/ui/SlideDialog';
import { Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Trash, Upload, X, ZoomIn } from 'lucide-react';
import React, { useState } from 'react'
import Image from 'next/image';
import AddEquipmentPhotoForm from './AddEquipmentPhotoForm';
import { TPhoto } from '@/COMPONENTS/utils/types';
import DeleteEquipmentForm from '../../DeleteEquipmentForm';
import DeleteEquipmentPhotoForm from './DeleteEquipmentPhotoForm';

const EquipmentPhotos = ({ equipmentId, userRole }: { equipmentId: number, userRole: string }) => {
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const { data: photos = [], isLoading: isLoadingPhotos } = useQuery<TPhoto[]>({
        queryKey: [`/api/equipments/${equipmentId}/photos`],
        enabled: !!equipmentId
    });

    const isLoading = (!photos || isLoadingPhotos);
    if (isLoading) return (<h1>Loading...</h1>)
    
  return (
    <>
        <h1>Equipment photos and images</h1>
        {userRole === "admin" && (
            <SlideDialog
                title="Upload Photo"
                
                Btn={(props) => (
                    <Button size='small' {...props} color="info">
                        <Upload width={16} height={16} className='mr-2' /> Upload Photo
                    </Button>
                )}
                DialogForm={(props) => (
                    <AddEquipmentPhotoForm equipmentId={equipmentId} {...props} />
                )}
            />
        )}
        <div className="grid grid-cols-2 md:grid-cols-10 mt-4">
            {photos.length > 0 ? photos.map(photo => (
                <div key={photo.id} className="relative group max-w-[120px]">
                    <Image src={photo.imageUrl} width={120} height={120} alt="Equipment photo" />
                    <div className="absolute inset-0 bg-black transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-60">
                        <Button
                            variant='text'
                            size="small"
                            title='View fullscreen'
                            onClick={() => setFullscreenImage(photo.imageUrl)}
                        >
                            <ZoomIn width={16} height={16} className='text-white hover:text-green-600' />
                        </Button>
                        {userRole === "admin" && (
                        <SlideDialog
                            title="Delete Photo"
                            Btn={(props) => (
                            <Button variant='text' {...props}><Trash size={16} className='text-white hover:text-red-600' /></Button>
                            )}
                            DialogForm={(props) => (
                                <DeleteEquipmentPhotoForm {...props} photoId={photo.id} />
                            )}
                        />
                        )}
                    </div>
                </div>
            )): "Nothing to see here yet..."}  
        </div>
        {fullscreenImage && (
            <div
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setFullscreenImage(null)}
            >
                <Image
                    src={fullscreenImage}
                    alt="Fullscreen image"
                    width={480}
                    height={360}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        )}
    </>
  )
}

export default EquipmentPhotos;