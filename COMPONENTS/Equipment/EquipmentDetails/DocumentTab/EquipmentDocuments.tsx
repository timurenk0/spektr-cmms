"use client"


import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Button, Skeleton, Tab } from '@mui/material'
import React, { useState } from 'react'
import EquipmentDocumentsEl from './EquipmentDocumentsEl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import SlideDialog from '@/COMPONENTS/ui/SlideDialog'
import EquipmentDocumentsForm from './EquipmentDocumentsForm'
import toast from 'react-hot-toast'
import { TDocument } from '@/COMPONENTS/utils/types'



const DOCUMENT_CATEGORIES: Record<string, string> = {
    "other": "All documents",
    "manual": "Manuals",
    "maintenance": "Maintenance Reports",
    "certificate": "Certificates",
    "premob": "Pre-mob Reports",
    "fault": "Fault Reports",
    "inspection": "Inspection Reports",
    "emergency": "Emergency Repair Reports"
}


const EquipmentDocuments = ({ equipmentId, userRole }: { equipmentId: number, userRole: string }) => {
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState("other");

    const handleTabChange = (event: React.SyntheticEvent, val: string) => {
        setActiveTab(val);
    }


    const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<TDocument[]>({
        queryKey: ["documents", equipmentId],
        queryFn: async () => {
            const res = await fetch(`/api/equipments/${equipmentId}/documents`, {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) throw new Error("Failed to fetch documents");

            return await res.json();
        },
        enabled: !!equipmentId
    });

    const isLoading = (!documents || isLoadingDocuments);

    if (isLoading) return (
        <Skeleton>
            <TabPanel value="other">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
            <TabPanel value="manual">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
            <TabPanel value="maintenance">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
            <TabPanel value="certificate">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
            <TabPanel value="premob">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
            <TabPanel value="fault">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
            <TabPanel value="emergency">
                <EquipmentDocumentsEl documents={[]} userRole={userRole} />
            </TabPanel>
        </Skeleton>
    )
    
  return (
        <TabContext value={activeTab}>
            <div className="my-2 flex flex-col justify-between items-start">
                Manuals, certificates, maintenance records and other equipment documents
                {userRole === "admin" && (
                    <SlideDialog 
                        title="Upload Document"
                        Btn={(props) => (
                            <Button size="small" {...props} color="info" >
                                <Upload width={16} height={16} className="mr-2" /> Upload Document          
                            </Button>
                        )}
                        DialogForm={(props) => (
                            <EquipmentDocumentsForm equipmentId={equipmentId} documentCategories={DOCUMENT_CATEGORIES} {...props} />
                            )
                        }
                    >
                    </SlideDialog>
                )}
            </div>
            <TabList scrollButtons={false} onChange={handleTabChange} variant='scrollable'>
                {Object.entries(DOCUMENT_CATEGORIES).map(([val, lab]) => (
                    <Tab label={lab} value={val} key={lab} />
                ))} 
            </TabList>
            {Object.entries(DOCUMENT_CATEGORIES).map(([val, lab]) => (
                <TabPanel value={val} key={lab}>
                    <EquipmentDocumentsEl documents={val === "other" ? documents : documents.filter(doc => doc.category===val)} userRole={userRole}></EquipmentDocumentsEl>
                </TabPanel>
            ))}
        </TabContext>
  )
}

export default EquipmentDocuments