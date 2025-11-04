import SlideDialog from '@/COMPONENTS/ui/SlideDialog';
import { Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Trash, Upload, ZoomIn } from 'lucide-react';
import React from 'react'
import Image from 'next/image';
import EquipmentPhotoForm from './EquipmentPhotoForm';

const EquipmentPhotos = ({ equipmentId, userRole }: { equipmentId: number, userRole: string }) => {

    const { data: photos = [], isLoading: isLoadingPhotos } = useQuery<IPhoto[]>({
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
                    <EquipmentPhotoForm equipmentId={equipmentId} {...props} />
                )}
            />
        )}
        <div className="grid grid-cols-2 md:grid-cols-10 mt-4">
            {photos.length > 0 ? photos.map(photo => (
                <div key={photo.id} className="relative group max-w-[120px]">
                    <Image src={photo.imageUrl} width={120} height={120} alt="Equipment photo" />
                    <div className="absolute inset-0 bg-black transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-40">
                        <Button
                            variant='text'
                            size="small"
                            title='View fullscreen'
                        >
                            <ZoomIn width={16} height={16} className='text-white' />
                        </Button>
                        {userRole === "admin" && (
                            <Button
                                variant='text'
                                size='small'       
                                title='Delete photo'
                            >
                                <Trash width={16} height={16} className='text-white' />
                            </Button>
                        )}
                    </div>
                </div>
            )): "Nothing to see here yet..."}  
        </div>
    </>
  )
}

export default EquipmentPhotos;